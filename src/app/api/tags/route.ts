import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.toLowerCase().trim();
  const trending = searchParams.get("trending") === "true";
  const category = searchParams.get("category")?.trim() || undefined;
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50);

  // Kategori bazlı popüler tag'ler
  if (category && !q && !trending) {
    const categoryTags = await prisma.postTag.groupBy({
      by: ["tagId"],
      where: { post: { category } },
      _count: { tagId: true },
      orderBy: { _count: { tagId: "desc" } },
      take: limit,
    });

    const tagIds = categoryTags.map((pt) => pt.tagId);
    const countMap = Object.fromEntries(categoryTags.map((pt) => [pt.tagId, pt._count.tagId]));

    const tags = await prisma.tag.findMany({ where: { id: { in: tagIds } } });

    const ordered = tagIds
      .map((id) => tags.find((t) => t.id === id))
      .filter(Boolean)
      .map((t) => ({ id: t!.id, name: t!.name, count: countMap[t!.id] ?? 0 }));

    return NextResponse.json(ordered);
  }

  if (trending) {
    // Son 30 günde en çok kullanılan tag'ler (public kullanıcıların postlarında)
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const recentPostTags = await prisma.postTag.groupBy({
      by: ["tagId"],
      where: {
        post: {
          createdAt: { gte: since },
          user: { isPublic: true },
        },
      },
      _count: { tagId: true },
      orderBy: { _count: { tagId: "desc" } },
      take: limit,
    });

    const tagIds = recentPostTags.map((pt) => pt.tagId);
    const countMap = Object.fromEntries(recentPostTags.map((pt) => [pt.tagId, pt._count.tagId]));

    const tags = await prisma.tag.findMany({
      where: { id: { in: tagIds } },
    });

    // Preserve order
    const ordered = tagIds
      .map((id) => tags.find((t) => t.id === id))
      .filter(Boolean)
      .map((t) => ({ id: t!.id, name: t!.name, count: countMap[t!.id] ?? 0 }));

    return NextResponse.json(ordered);
  }

  const tags = await prisma.tag.findMany({
    where: q ? { name: { contains: q } } : undefined,
    include: {
      _count: { select: { posts: true } },
    },
    orderBy: { posts: { _count: "desc" } },
    take: limit,
  });

  return NextResponse.json(tags.map((t) => ({ id: t.id, name: t.name, count: t._count.posts })));
}
