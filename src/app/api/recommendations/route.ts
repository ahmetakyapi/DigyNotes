import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  // Kullanıcının en çok kullandığı 5 tag
  const userTagGroups = await prisma.postTag.groupBy({
    by: ["tagId"],
    where: { post: { userId } },
    _count: { tagId: true },
    orderBy: { _count: { tagId: "desc" } },
    take: 5,
  });

  if (userTagGroups.length === 0) {
    return NextResponse.json([]);
  }

  const topTagIds = userTagGroups.map((t) => t.tagId);

  // Kullanıcının mevcut içerik başlıkları (hariç tutmak için)
  const userTitles = await prisma.post.findMany({
    where: { userId },
    select: { title: true },
  });
  const excludedTitles = userTitles.map((p) => p.title.toLowerCase());

  // O tag'lere sahip başka kullanıcıların public postları
  const posts = await prisma.post.findMany({
    where: {
      userId: { not: userId },
      user: { isPublic: true },
      tags: { some: { tagId: { in: topTagIds } } },
    },
    orderBy: { rating: "desc" },
    take: 30,
    include: {
      tags: { include: { tag: true } },
      user: { select: { id: true, name: true, username: true, avatarUrl: true } },
    },
  });

  // Kullanıcının notladığı içerikleri hariç tut (title bazlı)
  const filtered = posts
    .filter((p) => !excludedTitles.includes(p.title.toLowerCase()))
    .slice(0, 12);

  const result = filtered.map(({ tags, ...rest }) => ({
    ...rest,
    createdAt: rest.createdAt.toISOString(),
    updatedAt: rest.updatedAt.toISOString(),
    tags: tags.map((pt) => pt.tag),
  }));

  return NextResponse.json(result);
}
