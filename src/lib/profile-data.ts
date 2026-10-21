import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { collectionWithPostsInclude, serializeCollection } from "@/lib/collections";
import { getCategoryLabel, isOtherCategory } from "@/lib/categories";

/** First page of notes on a profile; the rest come from `/api/users/[username]/posts`. */
export const PROFILE_POST_PAGE = 30;

const profilePostOrder = [
  { isPinned: "desc" as const },
  { createdAt: "desc" as const },
  { id: "desc" as const },
];

/**
 * Label of the category with the most published notes ("Film"), or null. Counted over the
 * whole archive: the client only holds the first page, so a count there could name a
 * different category than the stats and change after "Daha Fazla Not". The catch-all
 * "Diğer" never describes anyone; ties go to the first label alphabetically.
 */
function pickTopCategory(groups: { category: string; _count: { _all: number } }[]) {
  const counts = new Map<string, number>();
  for (const group of groups) {
    if (isOtherCategory(group.category)) continue;
    const label = getCategoryLabel(group.category);
    counts.set(label, (counts.get(label) ?? 0) + group._count._all);
  }
  const ranked = Array.from(counts.entries()).sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "tr")
  );
  return ranked[0]?.[0] ?? null;
}

/** A profile's owner row plus whether `viewerId` may see its notes. */
async function resolveProfileAccess(username: string, viewerId: string | null) {
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      name: true,
      username: true,
      bio: true,
      avatarUrl: true,
      isPublic: true,
      isBanned: true,
      createdAt: true,
    },
  });
  if (!user) return null;

  const viewer = viewerId
    ? await prisma.user.findUnique({
        where: { id: viewerId },
        select: { id: true, isAdmin: true },
      })
    : null;
  // A banned account reads as private to everyone but its owner and admins.
  const canView =
    (user.isPublic && !user.isBanned) || viewer?.id === user.id || viewer?.isAdmin === true;
  return { user, canView };
}

function serializeProfilePost<
  T extends { createdAt: Date; updatedAt: Date; tags: { tag: unknown }[] },
>(post: T) {
  const { tags, ...rest } = post;
  return {
    ...rest,
    createdAt: rest.createdAt.toISOString(),
    updatedAt: rest.updatedAt.toISOString(),
    tags: tags.map((pt) => pt.tag),
  };
}

/**
 * Everything a profile page shows, behind its visibility rule: public profiles for
 * everyone, private ones only for their owner and admins (others get the name card).
 * Shared by `/api/users/[username]` and the server-rendered profile page; `cache`
 * lets generateMetadata and the page share one read.
 *
 * The exact last sign-in time is not part of a public profile (it used to be shown to
 * anyone); `lastNoteAt`, the newest published note, says how active the archive is.
 */
export const getProfilePageData = cache(async (username: string, viewerId: string | null) => {
  const access = await resolveProfileAccess(username, viewerId);
  if (!access) return { kind: "not-found" as const };
  const { user, canView } = access;

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
    newestPost,
    categoryGroups,
  ] = await Promise.all([
    prisma.post.findMany({
      where: { userId: user.id, isDeleted: false, isDraft: false },
      orderBy: profilePostOrder,
      take: PROFILE_POST_PAGE,
      omit: { content: true },
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
    prisma.post.findFirst({
      where: { userId: user.id, isDeleted: false, isDraft: false },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
    prisma.post.groupBy({
      by: ["category"],
      where: { userId: user.id, isDeleted: false, isDraft: false },
      _count: { _all: true },
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
        lastNoteAt: newestPost?.createdAt.toISOString() ?? null,
        topCategory: pickTopCategory(categoryGroups),
        postCount,
        avgRating: Math.round(avgRating * 10) / 10,
        followerCount,
        followingCount,
        isFollowing: !!followRow,
      },
      posts: rawPosts.map(serializeProfilePost),
      collections: rawCollections.map(serializeCollection),
    },
  };
});

export type ProfilePageResult = Awaited<ReturnType<typeof getProfilePageData>>;

/**
 * Later pages of a profile's notes, same order and visibility as the first page.
 * Offset paging: the pinned-first order has no single cursor column.
 */
export async function getProfilePostsPage(
  username: string,
  viewerId: string | null,
  offset: number,
  limit: number
) {
  const access = await resolveProfileAccess(username, viewerId);
  if (!access) return { kind: "not-found" as const };
  if (!access.canView) return { kind: "private" as const };

  const rows = await prisma.post.findMany({
    where: { userId: access.user.id, isDeleted: false, isDraft: false },
    orderBy: profilePostOrder,
    skip: offset,
    take: limit + 1,
    omit: { content: true },
    include: { tags: { include: { tag: true } } },
  });

  return {
    kind: "ok" as const,
    posts: rows.slice(0, limit).map(serializeProfilePost),
    hasMore: rows.length > limit,
  };
}
