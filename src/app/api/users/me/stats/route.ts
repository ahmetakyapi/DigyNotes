import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const posts = await prisma.post.findMany({
    where: { userId },
    select: {
      id: true,
      category: true,
      rating: true,
      status: true,
      createdAt: true,
      tags: {
        include: {
          tag: {
            select: { name: true },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const totalPosts = posts.length;
  const ratedPosts = posts.filter((post) => post.rating > 0);
  const avgRating =
    ratedPosts.length > 0
      ? Math.round(
          (ratedPosts.reduce((sum, post) => sum + post.rating, 0) / ratedPosts.length) * 10
        ) / 10
      : 0;

  const now = new Date();
  const currentYear = now.getFullYear();
  const postsThisYear = posts.filter((post) => post.createdAt.getFullYear() === currentYear).length;
  const uniqueTags = new Set(posts.flatMap((post) => post.tags.map((entry) => entry.tag.name)))
    .size;

  const monthBuckets = Array.from({ length: 12 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (11 - index), 1);
    return {
      key: getMonthKey(date),
      month: date.toLocaleDateString("tr-TR", { month: "short" }),
      count: 0,
    };
  });
  const monthMap = new Map(monthBuckets.map((item) => [item.key, item]));
  posts.forEach((post) => {
    const bucket = monthMap.get(getMonthKey(post.createdAt));
    if (bucket) bucket.count += 1;
  });

  const categoryMap = new Map<string, number>();
  const statusMap = new Map<string, number>();
  const tagMap = new Map<string, number>();
  const ratingMap = new Map<string, number>([
    ["1", 0],
    ["2", 0],
    ["3", 0],
    ["4", 0],
    ["5", 0],
  ]);

  posts.forEach((post) => {
    categoryMap.set(post.category, (categoryMap.get(post.category) ?? 0) + 1);
    statusMap.set(post.status ?? "Belirsiz", (statusMap.get(post.status ?? "Belirsiz") ?? 0) + 1);

    post.tags.forEach((entry) => {
      tagMap.set(entry.tag.name, (tagMap.get(entry.tag.name) ?? 0) + 1);
    });

    if (post.rating > 0) {
      const bucket = String(Math.min(5, Math.max(1, Math.round(post.rating))));
      ratingMap.set(bucket, (ratingMap.get(bucket) ?? 0) + 1);
    }
  });

  return NextResponse.json({
    kpis: {
      totalPosts,
      avgRating,
      postsThisYear,
      uniqueTags,
    },
    monthlySeries: monthBuckets,
    categories: Array.from(categoryMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
    statuses: Array.from(statusMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
    topTags: Array.from(tagMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8),
    ratingDistribution: Array.from(ratingMap.entries()).map(([label, count]) => ({
      label: `${label}★`,
      count,
    })),
  });
}
