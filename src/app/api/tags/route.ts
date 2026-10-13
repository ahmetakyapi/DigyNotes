import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSessionUserId, handleApiError, requireAuth } from "@/lib/api-server";
import { normalizeTagName } from "@/lib/text";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface TagCountRow {
  tagId: string;
  _count: { tagId: number };
}

/** Turns `postTag.groupBy` rows into `{ id, name, count }`, keeping the count order. */
async function withTagNames(rows: TagCountRow[]) {
  const tagIds = rows.map((row) => row.tagId);
  const countMap = Object.fromEntries(rows.map((row) => [row.tagId, row._count.tagId]));
  const tags = await prisma.tag.findMany({
    where: { id: { in: tagIds } },
    select: { id: true, name: true },
  });
  const byId = new Map(tags.map((tag) => [tag.id, tag]));

  return tagIds.flatMap((id) => {
    const tag = byId.get(id);
    return tag ? [{ id: tag.id, name: tag.name, count: countMap[id] ?? 0 }] : [];
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawQ = searchParams.get("q");
    const q = rawQ ? normalizeTagName(rawQ.replace(/^#+/, "")) : undefined;
    const trending = searchParams.get("trending") === "true";
    const mineParam = searchParams.get("mine");
    const mine = mineParam === "1" || mineParam === "true";
    const category = searchParams.get("category")?.trim() || undefined;
    const parsedLimit = Number.parseInt(searchParams.get("limit") ?? "20", 10);
    const limit = Math.min(Math.max(Number.isFinite(parsedLimit) ? parsedLimit : 20, 1), 50);

    // Oturumdaki kullanıcının en sık kullandığı etiketler (not yazarken öneri)
    if (mine) {
      const [userId, unauthorized] = await requireAuth();
      if (unauthorized) return unauthorized;

      const rows = await prisma.postTag.groupBy({
        by: ["tagId"],
        where: { post: { userId, isDeleted: false } },
        _count: { tagId: true },
        orderBy: { _count: { tagId: "desc" } },
        take: limit,
      });

      return NextResponse.json(await withTagNames(rows));
    }

    // Kategori bazlı popüler tag'ler: herkese açık yayınlanmış notlar + kendi notların
    if (category && !q && !trending) {
      const userId = await getSessionUserId();
      const visible: Prisma.PostWhereInput[] = [{ isDraft: false, user: { isPublic: true } }];
      if (userId) visible.push({ userId });

      const rows = await prisma.postTag.groupBy({
        by: ["tagId"],
        where: { post: { category, isDeleted: false, OR: visible } },
        _count: { tagId: true },
        orderBy: { _count: { tagId: "desc" } },
        take: limit,
      });

      return NextResponse.json(await withTagNames(rows));
    }

    if (trending) {
      // Son 30 günde en çok kullanılan tag'ler (public kullanıcıların postlarında)
      const since = new Date();
      since.setDate(since.getDate() - 30);

      const rows = await prisma.postTag.groupBy({
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

      return NextResponse.json(await withTagNames(rows));
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
  } catch (error) {
    return handleApiError(error, "Etiketler yüklenirken bir hata oluştu.");
  }
}
