import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getMonthLabel(month: number) {
  return ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"][
    month
  ];
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()), 10);

  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year + 1, 0, 1);

  const posts = await prisma.post.findMany({
    where: {
      userId,
      createdAt: { gte: startDate, lt: endDate },
    },
    select: {
      id: true,
      title: true,
      category: true,
      rating: true,
      status: true,
      image: true,
      creator: true,
      createdAt: true,
      tags: {
        include: {
          tag: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  if (posts.length === 0) {
    return NextResponse.json({
      year,
      totalPosts: 0,
      isEmpty: true,
    });
  }

  // KPI'lar
  const totalPosts = posts.length;
  const ratedPosts = posts.filter((p) => p.rating > 0);
  const avgRating =
    ratedPosts.length > 0
      ? Math.round((ratedPosts.reduce((s, p) => s + p.rating, 0) / ratedPosts.length) * 10) / 10
      : 0;

  // Kategori dağılımı
  const categoryMap = new Map<string, number>();
  posts.forEach((p) => {
    categoryMap.set(p.category, (categoryMap.get(p.category) ?? 0) + 1);
  });
  const categories = Array.from(categoryMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // Aylık seri
  const monthlySeries = Array.from({ length: 12 }, (_, i) => ({
    month: getMonthLabel(i),
    count: 0,
  }));
  posts.forEach((p) => {
    const m = p.createdAt.getMonth();
    monthlySeries[m].count += 1;
  });

  // En aktif ay
  const busiestMonth = monthlySeries.reduce((best, cur) => (cur.count > best.count ? cur : best));

  // En çok kullanılan etiketler
  const tagMap = new Map<string, number>();
  posts.forEach((p) => {
    p.tags.forEach((pt) => {
      tagMap.set(pt.tag.name, (tagMap.get(pt.tag.name) ?? 0) + 1);
    });
  });
  const topTags = Array.from(tagMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const uniqueTagCount = tagMap.size;

  // En yüksek puanlı 5 not
  const topRated = [...posts]
    .filter((p) => p.rating > 0)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 5)
    .map((p) => ({
      id: p.id,
      title: p.title,
      category: p.category,
      rating: p.rating,
      image: p.image,
      creator: p.creator,
    }));

  // İlk ve son not
  const firstPost = posts[0];
  const lastPost = posts[posts.length - 1];

  // Streak hesaplama (ardışık gün)
  const daySet = new Set(
    posts.map((p) => {
      const d = p.createdAt;
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    })
  );
  const sortedDays = Array.from(daySet).sort();

  let maxStreak = 0;
  let currentStreak = 1;
  for (let i = 1; i < sortedDays.length; i++) {
    const prev = new Date(sortedDays[i - 1]);
    const curr = new Date(sortedDays[i]);
    const diffMs = curr.getTime() - prev.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      currentStreak++;
    } else {
      maxStreak = Math.max(maxStreak, currentStreak);
      currentStreak = 1;
    }
  }
  maxStreak = Math.max(maxStreak, currentStreak);

  // Puan dağılımı
  const ratingDist = new Map<string, number>([
    ["1", 0],
    ["2", 0],
    ["3", 0],
    ["4", 0],
    ["5", 0],
  ]);
  posts.forEach((p) => {
    if (p.rating > 0) {
      const bucket = String(Math.min(5, Math.max(1, Math.round(p.rating))));
      ratingDist.set(bucket, (ratingDist.get(bucket) ?? 0) + 1);
    }
  });

  return NextResponse.json({
    year,
    isEmpty: false,
    totalPosts,
    avgRating,
    uniqueTagCount,
    maxStreak,
    busiestMonth: busiestMonth.count > 0 ? busiestMonth : null,
    categories,
    monthlySeries,
    topTags,
    topRated,
    ratingDistribution: Array.from(ratingDist.entries()).map(([label, count]) => ({
      label: `${label}★`,
      count,
    })),
    firstPost: {
      id: firstPost.id,
      title: firstPost.title,
      category: firstPost.category,
      createdAt: firstPost.createdAt,
    },
    lastPost: {
      id: lastPost.id,
      title: lastPost.title,
      category: lastPost.category,
      createdAt: lastPost.createdAt,
    },
  });
}
