import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const { searchParams } = request.nextUrl;
  const limit = Math.min(
    Math.max(Number.parseInt(searchParams.get("limit") ?? "20", 10) || 20, 1),
    50
  );
  const cursor = searchParams.get("cursor");

  const following = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });

  const followingIds = following.map((f) => f.followingId);

  if (followingIds.length === 0) {
    return NextResponse.json({ items: [], nextCursor: null });
  }

  const cursorFilter = cursor
    ? { createdAt: { lt: new Date(cursor) } }
    : {};

  const posts = await prisma.post.findMany({
    where: {
      userId: { in: followingIds },
      ...cursorFilter,
    },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    include: {
      tags: { include: { tag: true } },
      user: { select: { id: true, name: true, username: true, avatarUrl: true } },
    },
  });

  let nextCursor: string | null = null;
  if (posts.length > limit) {
    posts.pop();
    const last = posts.at(-1);
    nextCursor = last ? last.createdAt.toISOString() : null;
  }

  const items = posts.map(({ tags, ...rest }) => ({
    ...rest,
    createdAt: rest.createdAt.toISOString(),
    updatedAt: rest.updatedAt.toISOString(),
    tags: tags.map((pt) => pt.tag),
  }));

  return NextResponse.json({ items, nextCursor });
}
