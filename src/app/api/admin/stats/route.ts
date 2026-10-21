import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, handleApiError } from "@/lib/api-server";
import { prisma } from "@/lib/prisma";
import { getIstanbulDateKey, getIstanbulDayStart } from "@/lib/number-format";

type SeriesRange = "7d" | "30d" | "90d" | "365d";
const VALID_SERIES: SeriesRange[] = ["7d", "30d", "90d", "365d"];

export async function GET(request: NextRequest) {
  try {
    const adminId = await requireAdmin();
    if (!adminId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const rawSeries = searchParams.get("series") || "30d";
    const series: SeriesRange = VALID_SERIES.includes(rawSeries as SeriesRange)
      ? (rawSeries as SeriesRange)
      : "30d";
    const seriesDays = series === "7d" ? 7 : series === "30d" ? 30 : series === "90d" ? 90 : 365;

    // Days are cut at Istanbul midnight (servers run in UTC); Istanbul has no DST.
    const todayStart = getIstanbulDayStart();
    const thirtyDaysAgo = new Date(todayStart.getTime() - (seriesDays - 1) * 86_400_000);

    const [
      totalUsers,
      totalPosts,
      totalCategories,
      totalTags,
      totalFollows,
      todayActivity,
      postsLast30Days,
      usersLast30Days,
      postStatusDistribution,
      postsPerCategory,
      topUsers,
      topTags,
      ratingDistribution,
    ] = await Promise.all([
      prisma.user.count(),
      // Trashed (soft-deleted) notes are gone everywhere else, so they don't count here either
      prisma.post.count({ where: { isDeleted: false } }),
      prisma.category.count(),
      prisma.tag.count(),
      prisma.follow.count(),
      prisma.activityLog.count({ where: { createdAt: { gte: todayStart } } }),
      // Posts per day for last 30 days
      prisma.post.findMany({
        where: { createdAt: { gte: thirtyDaysAgo }, isDeleted: false },
        select: { createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
      // Users per day for last 30 days
      prisma.user.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
      // Post status distribution
      prisma.post.groupBy({
        by: ["status"],
        where: { isDeleted: false },
        _count: { id: true },
      }),
      // Posts per category (top 10)
      prisma.post.groupBy({
        by: ["category"],
        where: { isDeleted: false },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 10,
      }),
      // Top users by post count (grouped on posts: a relation-count orderBy can't skip trashed notes)
      prisma.post.groupBy({
        by: ["userId"],
        where: { isDeleted: false, userId: { not: null } },
        _count: { _all: true },
        orderBy: { _count: { userId: "desc" } },
        take: 10,
      }),
      // Top tags by usage
      prisma.postTag.groupBy({
        by: ["tagId"],
        where: { post: { isDeleted: false } },
        _count: { _all: true },
        orderBy: { _count: { tagId: "desc" } },
        take: 20,
      }),
      // Rating distribution (ratings come in 0.5 steps, so at most 10 groups)
      prisma.post.groupBy({
        by: ["rating"],
        where: { rating: { gt: 0 }, isDeleted: false },
        _count: { _all: true },
      }),
    ]);

    const [topUserRows, topTagRows] = await Promise.all([
      prisma.user.findMany({
        where: { id: { in: topUsers.flatMap((row) => (row.userId ? [row.userId] : [])) } },
        select: { id: true, name: true, username: true, avatarUrl: true },
      }),
      prisma.tag.findMany({
        where: { id: { in: topTags.map((row) => row.tagId) } },
        select: { id: true, name: true },
      }),
    ]);
    const usersById = new Map(topUserRows.map((u) => [u.id, u]));
    const tagNamesById = new Map(topTagRows.map((t) => [t.id, t.name]));

    // Build daily series for selected range
    const days: string[] = [];
    for (let i = 0; i < seriesDays; i++) {
      days.push(getIstanbulDateKey(new Date(thirtyDaysAgo.getTime() + i * 86_400_000)));
    }

    const postsByDay: Record<string, number> = {};
    const usersByDay: Record<string, number> = {};
    days.forEach((d) => {
      postsByDay[d] = 0;
      usersByDay[d] = 0;
    });

    postsLast30Days.forEach((p) => {
      const key = getIstanbulDateKey(p.createdAt);
      if (key in postsByDay) postsByDay[key]++;
    });
    usersLast30Days.forEach((u) => {
      const key = getIstanbulDateKey(u.createdAt);
      if (key in usersByDay) usersByDay[key]++;
    });

    const dailySeries = days.map((date) => ({
      date,
      posts: postsByDay[date],
      users: usersByDay[date],
    }));

    // Rating distribution buckets
    const ratingBuckets: Record<string, number> = {
      "0.5-1": 0,
      "1.5-2": 0,
      "2.5-3": 0,
      "3.5-4": 0,
      "4.5-5": 0,
    };
    ratingDistribution.forEach(({ rating: r, _count }) => {
      const n = _count._all;
      if (r <= 1) ratingBuckets["0.5-1"] += n;
      else if (r <= 2) ratingBuckets["1.5-2"] += n;
      else if (r <= 3) ratingBuckets["2.5-3"] += n;
      else if (r <= 4) ratingBuckets["3.5-4"] += n;
      else ratingBuckets["4.5-5"] += n;
    });

    return NextResponse.json({
      series,
      kpi: {
        totalUsers,
        totalPosts,
        totalCategories,
        totalTags,
        totalFollows,
        todayActivity,
      },
      dailySeries,
      postStatusDistribution: postStatusDistribution.map((s) => ({
        status: s.status || "Belirsiz",
        count: s._count.id,
      })),
      postsPerCategory: postsPerCategory.map((c) => ({
        category: c.category,
        count: c._count.id,
      })),
      topUsers: topUsers.flatMap((row) => {
        const u = row.userId ? usersById.get(row.userId) : undefined;
        return u
          ? [
              {
                id: u.id,
                name: u.name,
                username: u.username,
                avatarUrl: u.avatarUrl,
                postCount: row._count._all,
              },
            ]
          : [];
      }),
      topTags: topTags.flatMap((row) => {
        const name = tagNamesById.get(row.tagId);
        return name ? [{ name, count: row._count._all }] : [];
      }),
      ratingDistribution: Object.entries(ratingBuckets).map(([label, count]) => ({
        label,
        count,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
