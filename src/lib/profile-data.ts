import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { collectionWithPostsInclude, serializeCollection } from "@/lib/collections";

const POST_LIMIT = 30;

/**
 * Everything a profile page shows, behind its visibility rule: public profiles for
 * everyone, private ones only for their owner and admins (others get the name card).
 * Shared by `/api/users/[username]` and the server-rendered profile page; `cache`
 * lets generateMetadata and the page share one read.
 */
export const getProfilePageData = cache(async (username: string, viewerId: string | null) => {
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      name: true,
      username: true,
      bio: true,
      avatarUrl: true,
      isPublic: true,
      createdAt: true,
      lastLoginAt: true,
    },
  });

  if (!user) return { kind: "not-found" as const };

  const viewer = viewerId
    ? await prisma.user.findUnique({
        where: { id: viewerId },
        select: { id: true, isAdmin: true },
      })
    : null;
  const canView = user.isPublic || viewer?.id === user.id || viewer?.isAdmin === true;

  if (!canView) {
    return {
      kind: "private" as const,
      profile: { name: user.name, username: user.username, avatarUrl: user.avatarUrl },
    };
  }

  const [
    rawPosts,
    rawCollections,
    followerCount,
    followingCount,
    followRow,
    postCount,
    avgRatingResult,
    lastPost,
  ] = await Promise.all([
    prisma.post.findMany({
      where: { userId: user.id, isDeleted: false, isDraft: false },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      take: POST_LIMIT,
      include: { tags: { include: { tag: true } } },
    }),
    prisma.collection.findMany({
      where: { userId: user.id },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      include: collectionWithPostsInclude,
    }),
    prisma.follow.count({ where: { followingId: user.id } }),
    prisma.follow.count({ where: { followerId: user.id } }),
    viewerId && viewerId !== user.id
      ? prisma.follow.findUnique({
          where: { followerId_followingId: { followerId: viewerId, followingId: user.id } },
        })
      : Promise.resolve(null),
    prisma.post.count({ where: { userId: user.id, isDeleted: false, isDraft: false } }),
    prisma.post.aggregate({
      where: { userId: user.id, isDeleted: false, isDraft: false, rating: { gt: 0 } },
      _avg: { rating: true },
    }),
    prisma.post.findFirst({
      where: { userId: user.id, isDeleted: false, isDraft: false },
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true },
    }),
  ]);

  const avgRating = avgRatingResult._avg.rating ?? 0;

  return {
    kind: "ok" as const,
    /** Latest public edit, for JSON-LD / sitemap style freshness hints. */
    lastModified: lastPost?.updatedAt ?? user.createdAt,
    data: {
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        isPublic: user.isPublic,
        createdAt: user.createdAt.toISOString(),
        lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
        postCount,
        avgRating: Math.round(avgRating * 10) / 10,
        followerCount,
        followingCount,
        isFollowing: !!followRow,
      },
      posts: rawPosts.map(({ tags, ...rest }) => ({
        ...rest,
        createdAt: rest.createdAt.toISOString(),
        updatedAt: rest.updatedAt.toISOString(),
        tags: tags.map((pt) => pt.tag),
      })),
      collections: rawCollections.map(serializeCollection),
    },
  };
});

export type ProfilePageResult = Awaited<ReturnType<typeof getProfilePageData>>;
