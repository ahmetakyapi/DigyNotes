import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPostReadAccess } from "@/lib/post-access";
import { handleApiError, requireAuth } from "@/lib/api-server";
import { isMissingCommentLikesTable } from "@/lib/comments";
import {
  applyRateLimitHeaders,
  consumeRateLimit,
  createRateLimitErrorResponse,
} from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/* Toggles the viewer's like on a comment → `{ count, liked }`. The comment's author
   gets one `comment_like` notification (referenceId "<commentId>:<actorId>"); an
   unlike removes it, so liking again never stacks duplicates. */
export async function POST(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string; commentId: string }> }
) {
  const params = await paramsPromise;
  try {
    const [userId, authError] = await requireAuth();
    if (authError) return authError;

    const rateLimit = await consumeRateLimit({
      action: "comment-like-toggle",
      req,
      userId,
      limit: 40,
      windowMs: 60_000,
    });

    if (!rateLimit.success) {
      return createRateLimitErrorResponse(
        rateLimit,
        "Çok fazla beğeni işlemi yaptınız. Lütfen kısa bir süre sonra tekrar deneyin."
      );
    }

    const { id: postId, commentId } = params;
    const access = await getPostReadAccess(postId, userId);
    if (!access.post || !access.canRead) {
      return NextResponse.json({ error: "Not bulunamadı" }, { status: 404 });
    }

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true, userId: true, postId: true },
    });
    if (!comment || comment.postId !== postId) {
      return NextResponse.json({ error: "Yorum bulunamadı" }, { status: 404 });
    }

    const key = { commentId_userId: { commentId, userId } };
    const notification = {
      userId: comment.userId,
      type: "comment_like",
      referenceId: `${commentId}:${userId}`,
    };
    const existing = await prisma.commentLike.findUnique({ where: key, select: { userId: true } });

    let liked: boolean;
    if (existing) {
      await prisma.commentLike.deleteMany({ where: { commentId, userId } });
      if (comment.userId !== userId) {
        await prisma.notification.deleteMany({ where: notification });
      }
      liked = false;
    } else {
      /* upsert: a double click racing itself must not fail on the composite key. */
      await prisma.commentLike.upsert({
        where: key,
        create: { commentId, userId },
        update: {},
      });
      if (comment.userId !== userId) {
        const alreadyNotified = await prisma.notification.findFirst({
          where: notification,
          select: { id: true },
        });
        if (!alreadyNotified) {
          await prisma.notification.create({ data: notification });
        }
      }
      liked = true;
    }

    const count = await prisma.commentLike.count({ where: { commentId } });
    return applyRateLimitHeaders(NextResponse.json({ count, liked }), rateLimit);
  } catch (error) {
    if (isMissingCommentLikesTable(error)) {
      console.error("[comment-likes] comment_likes table missing (run prisma db push)");
      return NextResponse.json(
        { error: "Yorum beğenileri şu anda kullanılamıyor." },
        { status: 503 }
      );
    }
    return handleApiError(error, "Beğeni işlemi sırasında bir hata oluştu.");
  }
}
