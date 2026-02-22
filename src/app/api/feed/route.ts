import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const following = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });

  const followingIds = following.map((f) => f.followingId);

  if (followingIds.length === 0) {
    return NextResponse.json([]);
  }

  const posts = await prisma.post.findMany({
    where: { userId: { in: followingIds } },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      tags: { include: { tag: true } },
      user: { select: { id: true, name: true, username: true, avatarUrl: true } },
    },
  });

  const result = posts.map(({ tags, ...rest }) => ({
    ...rest,
    createdAt: rest.createdAt.toISOString(),
    updatedAt: rest.updatedAt.toISOString(),
    tags: tags.map((pt) => pt.tag),
  }));

  return NextResponse.json(result);
}
