import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;
import { collectionWithPostsInclude, serializeCollection } from "@/lib/collections";

export async function GET(req: NextRequest, { params }: { params: { username: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const currentUserId = session?.user ? (session.user as { id: string }).id : null;

    // Step 1: get user basic info
    const user = await prisma.user.findUnique({
      where: { username: params.username },
      select: {
        id: true,
        name: true,
        username: true,
        bio: true,
        avatarUrl: true,
        isPublic: true,
        isAdmin: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const currentUser = currentUserId
      ? await prisma.user.findUnique({
          where: { id: currentUserId },
          select: { id: true, isAdmin: true },
        })
      : null;
    const canViewPrivateProfile =
      user.isPublic || currentUser?.id === user.id || currentUser?.isAdmin === true;

    if (!canViewPrivateProfile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Step 2: get posts, follower/following counts, and isFollowing in parallel
    const [rawPosts, rawCollections, followerCount, followingCount, followRow] = await Promise.all([
      prisma.post.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        include: { tags: { include: { tag: true } } },
      }),
      prisma.collection.findMany({
        where: { userId: user.id },
        orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
        include: collectionWithPostsInclude,
      }),
      prisma.follow.count({ where: { followingId: user.id } }),
      prisma.follow.count({ where: { followerId: user.id } }),
      currentUserId && currentUserId !== user.id
        ? prisma.follow.findUnique({
            where: {
              followerId_followingId: { followerId: currentUserId, followingId: user.id },
            },
          })
        : Promise.resolve(null),
    ]);

    const posts = rawPosts.map(({ tags, ...rest }) => ({
      ...rest,
      createdAt: rest.createdAt.toISOString(),
      updatedAt: rest.updatedAt.toISOString(),
      tags: tags.map((pt) => pt.tag),
    }));

    const ratings = posts.filter((p) => p.rating > 0).map((p) => p.rating);
    const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        isPublic: user.isPublic,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        postCount: posts.length,
        avgRating: Math.round(avgRating * 10) / 10,
        followerCount,
        followingCount,
        isFollowing: !!followRow,
      },
      posts,
      collections: rawCollections.map(serializeCollection),
    });
  } catch (err) {
    console.error("[GET /api/users/[username]] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
