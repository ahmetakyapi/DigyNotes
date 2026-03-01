import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: { username: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const currentUserId = session?.user ? (session.user as { id: string }).id : null;
    const user = await prisma.user.findUnique({
      where: { username: params.username },
      select: { id: true, isPublic: true },
    });

    if (!user || !user.isPublic) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const follows = await prisma.follow.findMany({
      where: { followingId: user.id },
      include: {
        follower: {
          select: {
            id: true,
            name: true,
            username: true,
            bio: true,
            avatarUrl: true,
            _count: { select: { posts: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const users = follows.map((f) => ({
      id: f.follower.id,
      name: f.follower.name ?? "",
      username: f.follower.username,
      bio: f.follower.bio,
      avatarUrl: f.follower.avatarUrl,
      postCount: f.follower._count.posts,
    }));

    const followedIds =
      currentUserId && users.length > 0
        ? new Set(
            (
              await prisma.follow.findMany({
                where: {
                  followerId: currentUserId,
                  followingId: { in: users.map((entry) => entry.id) },
                },
                select: { followingId: true },
              })
            ).map((entry) => entry.followingId)
          )
        : new Set<string>();

    return NextResponse.json({
      users: users.map((entry) => ({
        ...entry,
        isSelf: entry.id === currentUserId,
        isFollowing: currentUserId ? followedIds.has(entry.id) : false,
      })),
    });
  } catch (err) {
    console.error("[GET /api/users/[username]/followers]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
