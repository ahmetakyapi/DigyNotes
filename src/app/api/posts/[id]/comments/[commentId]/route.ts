import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError, requireAuth } from "@/lib/api-server";
import { consumeRateLimit, createRateLimitErrorResponse } from "@/lib/rate-limit";

/* Reply levels walked to find what the cascade removes; real threads are a few levels
   deep, the cap only bounds a pathological chain. */
const MAX_BRANCH_DEPTH = 50;

/* The comment's author, or the note's owner moderating their own note. Replies go
   with it (onDelete: Cascade), and so do the comment, mention and comment_like
   notifications of the whole branch (they would otherwise stay unread and lead
   nowhere). */
export async function DELETE(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string; commentId: string }> }
) {
  const params = await paramsPromise;
  try {
    const [userId, authError] = await requireAuth();
    if (authError) return authError;

    const rateLimit = await consumeRateLimit({
      action: "comment-delete",
      req,
      userId,
      limit: 30,
      windowMs: 60_000,
    });
    if (!rateLimit.success) {
      return createRateLimitErrorResponse(
        rateLimit,
        "Çok fazla silme işlemi yaptınız. Lütfen biraz sonra tekrar deneyin."
      );
    }

    const { commentId } = params;
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true, userId: true, postId: true, post: { select: { userId: true } } },
    });

    if (!comment || comment.postId !== params.id) {
      return NextResponse.json({ error: "Yorum bulunamadı" }, { status: 404 });
    }

    if (comment.userId !== userId && comment.post.userId !== userId) {
      return NextResponse.json({ error: "Bu yorumu silme yetkiniz yok" }, { status: 403 });
    }

    const branchIds = [commentId];
    let frontier = [commentId];
    for (let depth = 0; depth < MAX_BRANCH_DEPTH && frontier.length > 0; depth += 1) {
      const level = await prisma.comment.findMany({
        where: { postId: params.id, parentId: { in: frontier } },
        select: { id: true },
      });
      frontier = level.map((row) => row.id);
      branchIds.push(...frontier);
    }

    /* comment_like references are "<commentId>:<actorId>"; matched by prefix so this
       does not depend on the comment_likes table (ERR-DB-005). */
    await prisma.$transaction([
      prisma.notification.deleteMany({
        where: {
          OR: [
            { type: { in: ["comment", "mention"] }, referenceId: { in: branchIds } },
            ...branchIds.map((id) => ({
              type: "comment_like",
              referenceId: { startsWith: `${id}:` },
            })),
          ],
        },
      }),
      prisma.comment.delete({ where: { id: commentId } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, "Yorum silinemedi.");
  }
}
