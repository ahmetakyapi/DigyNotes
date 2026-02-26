import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const user = await prisma.user.findUnique({
    where: { id: (session.user as { id: string }).id },
    select: { isAdmin: true },
  });
  return user?.isAdmin ? (session.user as { id: string }).id : null;
}

export async function GET() {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

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
    prisma.post.count(),
    prisma.category.count(),
    prisma.tag.count(),
    prisma.follow.count(),
    prisma.activityLog.count({ where: { createdAt: { gte: todayStart } } }),
    // Posts per day for last 30 days
    prisma.post.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
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
      _count: { id: true },
    }),
    // Posts per category (top 10)
    prisma.post.groupBy({
      by: ["category"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    }),
    // Top users by post count
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        avatarUrl: true,
        _count: { select: { posts: true } },
      },
      orderBy: { posts: { _count: "desc" } },
      take: 10,
    }),
    // Top tags by usage
    prisma.tag.findMany({
      select: {
        name: true,
        _count: { select: { posts: true } },
      },
      orderBy: { posts: { _count: "desc" } },
      take: 20,
    }),
    // Rating distribution
    prisma.post.findMany({
      select: { rating: true },
      where: { rating: { gt: 0 } },
    }),
  ]);

  // Build daily series for last 30 days
  const days: string[] = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(thirtyDaysAgo);
    d.setDate(d.getDate() + i);
    days.push(d.toISOString().slice(0, 10));
  }

  const postsByDay: Record<string, number> = {};
  const usersByDay: Record<string, number> = {};
  days.forEach((d) => {
    postsByDay[d] = 0;
    usersByDay[d] = 0;
  });

  postsLast30Days.forEach((p) => {
    const key = p.createdAt.toISOString().slice(0, 10);
    if (key in postsByDay) postsByDay[key]++;
  });
  usersLast30Days.forEach((u) => {
    const key = u.createdAt.toISOString().slice(0, 10);
    if (key in usersByDay) usersByDay[key]++;
  });

  const dailySeries = days.map((date) => ({
    date,
    posts: postsByDay[date],
    users: usersByDay[date],
  }));

  // Rating distribution buckets
  const ratingBuckets: Record<string, number> = {
    "0.5-1": 0, "1.5-2": 0, "2.5-3": 0, "3.5-4": 0, "4.5-5": 0,
  };
  ratingDistribution.forEach((p) => {
    const r = p.rating;
    if (r <= 1) ratingBuckets["0.5-1"]++;
    else if (r <= 2) ratingBuckets["1.5-2"]++;
    else if (r <= 3) ratingBuckets["2.5-3"]++;
    else if (r <= 4) ratingBuckets["3.5-4"]++;
    else ratingBuckets["4.5-5"]++;
  });

  return NextResponse.json({
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
    topUsers: topUsers.map((u) => ({
      id: u.id,
      name: u.name,
      username: u.username,
      avatarUrl: u.avatarUrl,
      postCount: u._count.posts,
    })),
    topTags: topTags.map((t) => ({
      name: t.name,
      count: t._count.posts,
    })),
    ratingDistribution: Object.entries(ratingBuckets).map(([label, count]) => ({
      label,
      count,
    })),
  });
}
