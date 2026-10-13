import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { handleApiError, requireAuth } from "@/lib/api-server";
import { publicPostsWhere } from "@/lib/public-posts";
import {
  POPULAR_CANDIDATE_LIMIT,
  POPULAR_WINDOW_DAYS,
  decodeOffsetCursor,
  decodeTimeCursor,
  encodeTimeCursor,
  parseFeedLimit,
  parseFeedOwn,
  parseFeedTab,
  rankFeedPosts,
} from "@/lib/feed";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/* GET /api/feed?tab=following|popular|latest&cursor=&limit=&own=0|1
   following: published notes of people the viewer follows (public authors) plus the
              viewer's own unless own=0 — createdAt+id cursor.
   popular:   public notes ranked by engagement with decay (last 30 days, all time
              when that is thinner than a page) — offset cursor.
   latest:    every public note except the viewer's, newest first — createdAt+id cursor. */

function feedInclude(userId: string) {
  return {
    tags: { include: { tag: true } },
    user: {
      select: {
        id: true,
        name: true,
        username: true,
        avatarUrl: true,
        followers: { where: { followerId: userId }, select: { followerId: true } },
      },
    },
    likes: { where: { userId }, select: { userId: true } },
    bookmarks: { where: { userId }, select: { userId: true } },
    _count: { select: { likes: true, comments: true } },
  } satisfies Prisma.PostInclude;
}

type FeedRow = Prisma.PostGetPayload<{ include: ReturnType<typeof feedInclude> }>;

function serializeFeedPost(post: FeedRow, userId: string) {
  const { tags, user, likes, bookmarks, _count, ...rest } = post;
  const isOwn = rest.userId === userId;
  return {
    ...rest,
    createdAt: rest.createdAt.toISOString(),
    updatedAt: rest.updatedAt.toISOString(),
    deletedAt: rest.deletedAt ? rest.deletedAt.toISOString() : null,
    tags: tags.map((pt) => pt.tag),
    user: user
      ? { id: user.id, name: user.name, username: user.username, avatarUrl: user.avatarUrl }
      : undefined,
    likeCount: _count.likes,
    commentCount: _count.comments,
    likedByMe: likes.length > 0,
    bookmarkedByMe: bookmarks.length > 0,
    isOwn,
    isFollowing: !isOwn && (user?.followers.length ?? 0) > 0,
  };
}

const NEWEST_FIRST: Prisma.PostOrderByWithRelationInput[] = [{ createdAt: "desc" }, { id: "desc" }];

function timeCursorWhere(cursor: string | null): Prisma.PostWhereInput {
  const decoded = decodeTimeCursor(cursor);
  if (!decoded) return {};
  return {
    OR: [
      { createdAt: { lt: decoded.createdAt } },
      { createdAt: decoded.createdAt, id: { lt: decoded.id } },
    ],
  };
}

async function listByTime(
  where: Prisma.PostWhereInput,
  cursor: string | null,
  limit: number,
  userId: string
) {
  const posts = await prisma.post.findMany({
    where: { AND: [where, timeCursorWhere(cursor)] },
    orderBy: NEWEST_FIRST,
    take: limit + 1,
    include: feedInclude(userId),
  });

  const hasMore = posts.length > limit;
  const page = hasMore ? posts.slice(0, limit) : posts;
  const last = page.at(-1);
  return {
    items: page.map((post) => serializeFeedPost(post, userId)),
    nextCursor: hasMore && last ? encodeTimeCursor(last) : null,
  };
}

async function listPopular(cursor: string | null, limit: number, userId: string) {
  const candidateSelect = {
    id: true,
    createdAt: true,
    _count: { select: { likes: true, comments: true, bookmarks: true } },
  } satisfies Prisma.PostSelect;

  const since = new Date(Date.now() - POPULAR_WINDOW_DAYS * 86_400_000);
  let candidates = await prisma.post.findMany({
    where: { AND: [publicPostsWhere(), { createdAt: { gte: since } }] },
    orderBy: NEWEST_FIRST,
    take: POPULAR_CANDIDATE_LIMIT,
    select: candidateSelect,
  });

  // A quiet month: rank the most liked notes of all time instead.
  if (candidates.length < limit) {
    candidates = await prisma.post.findMany({
      where: publicPostsWhere(),
      orderBy: [{ likes: { _count: "desc" } }, ...NEWEST_FIRST],
      take: POPULAR_CANDIDATE_LIMIT,
      select: candidateSelect,
    });
  }

  const ranked = rankFeedPosts(
    candidates.map((post) => ({
      id: post.id,
      createdAt: post.createdAt,
      likes: post._count.likes,
      comments: post._count.comments,
      bookmarks: post._count.bookmarks,
    }))
  );

  const offset = decodeOffsetCursor(cursor);
  const pageIds = ranked.slice(offset, offset + limit).map((post) => post.id);
  if (pageIds.length === 0) return { items: [], nextCursor: null };

  const posts = await prisma.post.findMany({
    where: { id: { in: pageIds } },
    include: feedInclude(userId),
  });
  const byId = new Map(posts.map((post) => [post.id, post]));
  const items = pageIds
    .map((id) => byId.get(id))
    .filter((post): post is FeedRow => Boolean(post))
    .map((post) => serializeFeedPost(post, userId));

  const nextOffset = offset + limit;
  return { items, nextCursor: nextOffset < ranked.length ? String(nextOffset) : null };
}

export async function GET(request: NextRequest) {
  try {
    const [userId, unauthorized] = await requireAuth();
    if (unauthorized) return unauthorized;

    const { searchParams } = request.nextUrl;
    const tab = parseFeedTab(searchParams.get("tab"));
    const limit = parseFeedLimit(searchParams.get("limit"));
    const cursor = searchParams.get("cursor");

    if (tab === "popular") {
      return NextResponse.json({ tab, ...(await listPopular(cursor, limit, userId)) });
    }

    if (tab === "latest") {
      const where: Prisma.PostWhereInput = {
        AND: [publicPostsWhere(), { NOT: { userId } }],
      };
      return NextResponse.json({ tab, ...(await listByTime(where, cursor, limit, userId)) });
    }

    // Followed authors only while their profile is public, matching canReadPost.
    const sources: Prisma.PostWhereInput[] = [
      { user: { isPublic: true, followers: { some: { followerId: userId } } } },
    ];
    if (parseFeedOwn(searchParams.get("own"))) sources.push({ userId });

    const where: Prisma.PostWhereInput = { isDeleted: false, isDraft: false, OR: sources };
    return NextResponse.json({ tab, ...(await listByTime(where, cursor, limit, userId)) });
  } catch (error) {
    return handleApiError(error, "Akış yüklenirken bir hata oluştu.");
  }
}
