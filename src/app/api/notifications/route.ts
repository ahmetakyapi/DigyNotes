import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleApiError } from "@/lib/api-server";

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

export async function GET(request: NextRequest) {
  try {
    const [userId, authError] = await requireAuth();
    if (authError) return authError;

    const limit = Math.min(
      Number.parseInt(request.nextUrl.searchParams.get("limit") ?? "20", 10),
      50
    );
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    const unreadCount = await prisma.notification.count({
      where: { userId, read: false },
    });

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

    const [followActors, likeActors, likePosts, commentRecords] = await Promise.all([
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
              post: { select: { id: true, title: true } },
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
    ]);

    const followActorMap = new Map(followActors.map((user) => [user.id, user]));
    const likeActorMap = new Map(likeActors.map((user) => [user.id, user]));
    const likePostMap = new Map(likePosts.map((post) => [post.id, post]));
    const commentMap = new Map(commentRecords.map((comment) => [comment.id, comment]));

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
      const isReplyToRecipient = Boolean(
        comment?.parentId &&
        comment.parent?.userId === notification.userId &&
        comment.user.id !== notification.userId
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

    return NextResponse.json({ notifications: items, unreadCount });
  } catch (error) {
    return handleApiError(error, "Bildirimler alınamadı.");
  }
}
