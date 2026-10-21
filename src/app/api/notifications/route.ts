import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleApiError } from "@/lib/api-server";
import { decodeCommentCursor, encodeCommentCursor } from "@/lib/comment-thread";
import { canReadPost } from "@/lib/post-access";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type NotificationRow = {
  id: string;
  userId: string;
  type: string;
  referenceId: string;
  read: boolean;
  createdAt: Date;
};

function parseLikeReference(referenceId: string) {
  const [postId, actorUserId] = referenceId.split(":");
  if (!postId || !actorUserId) return null;
  return { postId, actorUserId };
}

/* "comment_like" → "<commentId>:<actorUserId>". */
function parseCommentLikeReference(referenceId: string) {
  const [commentId, actorUserId] = referenceId.split(":");
  if (!commentId || !actorUserId) return null;
  return { commentId, actorUserId };
}

/* Types whose referenceId is a bare comment id ("comment_like" adds the actor). */
const COMMENT_TYPES = new Set(["comment", "mention"]);

function commentHref(comment: { id: string; post: { id: string } | null } | undefined) {
  return comment?.post
    ? `/posts/${comment.post.id}?comment=${comment.id}#comment-${comment.id}`
    : "/notes";
}

/* Newest first; `?cursor=` (from `nextCursor`) pages older ones. Returns
   `{ notifications, unreadCount, total, nextCursor }`; `total` is counted on the first
   page only (null after). `?countOnly=1` returns just `{ unreadCount }` (the shell badge). */
export async function GET(request: NextRequest) {
  try {
    const [userId, authError] = await requireAuth();
    if (authError) return authError;

    const { searchParams } = request.nextUrl;
    if (searchParams.get("countOnly") === "1") {
      const unreadCount = await prisma.notification.count({ where: { userId, read: false } });
      return NextResponse.json({ unreadCount });
    }

    const limit = Math.min(
      Math.max(Number.parseInt(searchParams.get("limit") ?? "20", 10) || 20, 1),
      50
    );
    const after = decodeCommentCursor(searchParams.get("cursor"));
    const [rows, unreadCount, total] = await Promise.all([
      prisma.notification.findMany({
        where: {
          userId,
          ...(after
            ? {
                OR: [
                  { createdAt: { lt: after.createdAt } },
                  { createdAt: after.createdAt, id: { lt: after.id } },
                ],
              }
            : {}),
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: limit + 1,
      }),
      prisma.notification.count({ where: { userId, read: false } }),
      after ? Promise.resolve(null) : prisma.notification.count({ where: { userId } }),
    ]);

    const hasMore = rows.length > limit;
    const notifications = hasMore ? rows.slice(0, limit) : rows;
    const last = notifications.at(-1);
    const nextCursor = hasMore && last ? encodeCommentCursor(last.createdAt, last.id) : null;

    const followActorIds = notifications
      .filter((item) => item.type === "follow")
      .map((item) => item.referenceId);
    const likeRefs = notifications
      .filter((item) => item.type === "like")
      .map((item) => parseLikeReference(item.referenceId))
      .filter(Boolean) as { postId: string; actorUserId: string }[];
    const commentLikeRefs = notifications
      .filter((item) => item.type === "comment_like")
      .map((item) => parseCommentLikeReference(item.referenceId))
      .filter(Boolean) as { commentId: string; actorUserId: string }[];
    const commentIds = Array.from(
      new Set([
        ...notifications
          .filter((item) => COMMENT_TYPES.has(item.type))
          .map((item) => item.referenceId),
        ...commentLikeRefs.map((item) => item.commentId),
      ])
    );
    const actorIds = Array.from(
      new Set([
        ...likeRefs.map((item) => item.actorUserId),
        ...commentLikeRefs.map((item) => item.actorUserId),
      ])
    );

    const [followActors, likeActors, likePosts, commentRecords, viewer] = await Promise.all([
      followActorIds.length > 0
        ? prisma.user.findMany({
            where: { id: { in: followActorIds } },
            select: { id: true, name: true, username: true, avatarUrl: true },
          })
        : Promise.resolve([]),
      actorIds.length > 0
        ? prisma.user.findMany({
            where: { id: { in: actorIds } },
            select: { id: true, name: true, username: true, avatarUrl: true },
          })
        : Promise.resolve([]),
      likeRefs.length > 0
        ? prisma.post.findMany({
            where: { id: { in: likeRefs.map((item) => item.postId) } },
            select: { id: true, title: true },
          })
        : Promise.resolve([]),
      commentIds.length > 0
        ? prisma.comment.findMany({
            where: { id: { in: commentIds } },
            include: {
              user: { select: { id: true, name: true, username: true, avatarUrl: true } },
              post: {
                select: {
                  id: true,
                  title: true,
                  userId: true,
                  isDraft: true,
                  isDeleted: true,
                  user: { select: { isPublic: true } },
                },
              },
              parent: {
                select: {
                  id: true,
                  userId: true,
                  user: { select: { id: true, name: true, username: true, avatarUrl: true } },
                },
              },
            },
          })
        : Promise.resolve([]),
      commentIds.length > 0
        ? prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true } })
        : Promise.resolve(null),
    ]);

    const followActorMap = new Map(followActors.map((user) => [user.id, user]));
    const likeActorMap = new Map(likeActors.map((user) => [user.id, user]));
    const likePostMap = new Map(likePosts.map((post) => [post.id, post]));
    /* A note the recipient can no longer open (draft, trash, private author) shows no
       title or comment text; those items fall back to the generic line. */
    const isAdmin = viewer?.isAdmin ?? false;
    const commentMap = new Map(
      commentRecords
        .filter((comment) => canReadPost(comment.post, userId, isAdmin))
        .map((comment) => [comment.id, comment])
    );

    const items = notifications.map((notification: NotificationRow) => {
      if (notification.type === "follow") {
        const actor = followActorMap.get(notification.referenceId);
        return {
          id: notification.id,
          type: notification.type,
          read: notification.read,
          createdAt: notification.createdAt.toISOString(),
          href: actor?.username ? `/profile/${actor.username}` : "/discover",
          actor,
          text: actor ? `${actor.name} seni takip etti` : "Yeni bir takipçin var",
          kindLabel: "Takip",
          contextTitle: actor?.username ? `@${actor.username}` : null,
          preview: null,
        };
      }

      if (notification.type === "like") {
        const likeRef = parseLikeReference(notification.referenceId);
        const actor = likeRef ? likeActorMap.get(likeRef.actorUserId) : null;
        const post = likeRef ? likePostMap.get(likeRef.postId) : null;
        return {
          id: notification.id,
          type: notification.type,
          read: notification.read,
          createdAt: notification.createdAt.toISOString(),
          href: post ? `/posts/${post.id}` : "/notes",
          actor: actor ?? undefined,
          text:
            actor && post ? `${actor.name} "${post.title}" notunu beğendi` : "Bir notun beğenildi",
          kindLabel: "Beğeni",
          contextTitle: post?.title ?? null,
          preview: null,
        };
      }

      if (notification.type === "mention") {
        const comment = commentMap.get(notification.referenceId);
        return {
          id: notification.id,
          type: notification.type,
          read: notification.read,
          createdAt: notification.createdAt.toISOString(),
          href: commentHref(comment),
          actor: comment?.user,
          text: comment?.user
            ? `${comment.user.name} seni bir yorumda andı`
            : "Bir yorumda anıldın",
          kindLabel: "Bahsetme",
          contextTitle: comment?.post?.title ?? null,
          preview: comment?.content ?? null,
        };
      }

      if (notification.type === "comment_like") {
        const ref = parseCommentLikeReference(notification.referenceId);
        const actor = ref ? likeActorMap.get(ref.actorUserId) : undefined;
        const comment = ref ? commentMap.get(ref.commentId) : undefined;
        return {
          id: notification.id,
          type: notification.type,
          read: notification.read,
          createdAt: notification.createdAt.toISOString(),
          href: commentHref(comment),
          actor,
          text: actor ? `${actor.name} yorumunu beğendi` : "Bir yorumun beğenildi",
          kindLabel: "Yorum Beğenisi",
          contextTitle: comment?.post?.title ?? null,
          preview: comment?.content ?? null,
        };
      }

      if (notification.type !== "comment") {
        return {
          id: notification.id,
          type: notification.type,
          read: notification.read,
          createdAt: notification.createdAt.toISOString(),
          href: "/notifications",
          actor: undefined,
          text: "Yeni bir bildirimin var",
          kindLabel: null,
          contextTitle: null,
          preview: null,
        };
      }

      const comment = commentMap.get(notification.referenceId);
      /* "comment" goes only to the note owner and to the author of the comment answered,
         so anyone else got it as a reply. Their comment may not be the stored parent: a
         reply below the last loaded level hangs on the answered comment's parent. */
      const isReplyToRecipient = Boolean(
        comment?.parentId &&
        comment.user.id !== notification.userId &&
        (comment.parent?.userId === notification.userId ||
          comment.post.userId !== notification.userId)
      );
      const href = commentHref(comment);
      const text =
        comment?.user && comment.post
          ? isReplyToRecipient
            ? `${comment.user.name} yorumuna yanıt verdi`
            : comment.parentId
              ? `${comment.user.name} "${comment.post.title}" notundaki sohbete katıldı`
              : `${comment.user.name} "${comment.post.title}" notuna yorum yaptı`
          : "Bir notuna yorum yapıldı";
      return {
        id: notification.id,
        type: notification.type,
        read: notification.read,
        createdAt: notification.createdAt.toISOString(),
        href,
        actor: comment?.user,
        text,
        kindLabel: isReplyToRecipient ? "Yanıt" : "Yorum",
        contextTitle: comment?.post?.title ?? null,
        preview: comment?.content ?? null,
      };
    });

    return NextResponse.json({ notifications: items, unreadCount, total, nextCursor });
  } catch (error) {
    return handleApiError(error, "Bildirimler alınamadı.");
  }
}
