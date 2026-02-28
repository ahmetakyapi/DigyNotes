import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = Math.min(parseInt(request.nextUrl.searchParams.get("limit") ?? "20", 10), 50);
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
  const commentIds = notifications
    .filter((item) => item.type === "comment")
    .map((item) => item.referenceId);

  const [followActors, likeActors, likePosts, commentRecords] = await Promise.all([
    followActorIds.length > 0
      ? prisma.user.findMany({
          where: { id: { in: followActorIds } },
          select: { id: true, name: true, username: true, avatarUrl: true },
        })
      : Promise.resolve([]),
    likeRefs.length > 0
      ? prisma.user.findMany({
          where: { id: { in: likeRefs.map((item) => item.actorUserId) } },
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
      };
    }

    const comment = commentMap.get(notification.referenceId);
    return {
      id: notification.id,
      type: notification.type,
      read: notification.read,
      createdAt: notification.createdAt.toISOString(),
      href: comment?.post ? `/posts/${comment.post.id}` : "/notes",
      actor: comment?.user,
      text:
        comment?.user && comment.post
          ? `${comment.user.name} "${comment.post.title}" notuna yorum yaptı`
          : "Bir notuna yorum yapıldı",
    };
  });

  return NextResponse.json({ notifications: items, unreadCount });
}
