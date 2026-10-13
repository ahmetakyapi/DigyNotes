import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPostReadAccess } from "@/lib/post-access";
import { getSessionUserId, handleApiError, requireAuth, safeParseBody } from "@/lib/api-server";
import { findCommentForResponse, loadCommentPage, notifyMentionedUsers } from "@/lib/comments";
import {
  applyRateLimitHeaders,
  consumeRateLimit,
  createRateLimitErrorResponse,
} from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/* Root comments newest first with all their replies; `?cursor=` pages older roots.
   Returns `{ items, nextCursor, total }` (items flat, with parentId). */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id: postId } = params;
    const userId = await getSessionUserId();
    const access = await getPostReadAccess(postId, userId);

    if (!access.post || !access.canRead) {
      return NextResponse.json({ error: "Not bulunamadı" }, { status: 404 });
    }

    const { searchParams } = req.nextUrl;
    const limit = Math.min(
      Math.max(Number.parseInt(searchParams.get("limit") ?? "20", 10) || 20, 1),
      50
    );

    const page = await loadCommentPage(postId, userId, {
      cursor: searchParams.get("cursor"),
      limit,
    });
    return NextResponse.json(page);
  } catch (error) {
    return handleApiError(error, "Yorumlar yüklenemedi.");
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const [userId, authError] = await requireAuth();
    if (authError) return authError;

    const { id: postId } = params;
    const rateLimit = await consumeRateLimit({
      action: "post-comment-create",
      req,
      userId,
      limit: 8,
      windowMs: 10 * 60_000,
    });

    if (!rateLimit.success) {
      return createRateLimitErrorResponse(
        rateLimit,
        "Çok hızlı yorum yapıyorsunuz. Lütfen biraz bekleyip tekrar deneyin."
      );
    }

    const access = await getPostReadAccess(postId, userId);
    if (!access.post || !access.canRead) {
      return NextResponse.json({ error: "Not bulunamadı" }, { status: 404 });
    }

    const body = await safeParseBody<{ content?: unknown; parentId?: unknown }>(req);
    const content = typeof body?.content === "string" ? body.content.trim() : "";
    const parentId = typeof body?.parentId === "string" ? body.parentId.trim() : "";

    if (!content) {
      return NextResponse.json({ error: "Yorum boş olamaz" }, { status: 400 });
    }

    if (content.length > 1000) {
      return NextResponse.json({ error: "Yorum 1000 karakterden uzun olamaz" }, { status: 400 });
    }

    let parentComment: { id: string; userId: string; postId: string } | null = null;
    if (parentId) {
      parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
        select: { id: true, userId: true, postId: true },
      });

      if (!parentComment || parentComment.postId !== postId) {
        return NextResponse.json({ error: "Yanıtlanacak yorum bulunamadı" }, { status: 404 });
      }
    }

    const created = await prisma.comment.create({
      data: {
        content,
        post: { connect: { id: postId } },
        user: { connect: { id: userId } },
        ...(parentComment ? { parent: { connect: { id: parentComment.id } } } : {}),
      },
      select: { id: true },
    });

    /* "comment" goes to the note owner and to the author of the comment replied to;
       mentions skip both so nobody gets two notifications for one comment. */
    const commentRecipients = new Set<string>();
    if (access.post.userId && access.post.userId !== userId) {
      commentRecipients.add(access.post.userId);
    }
    if (parentComment && parentComment.userId !== userId) {
      commentRecipients.add(parentComment.userId);
    }

    if (commentRecipients.size > 0) {
      await prisma.notification.createMany({
        data: Array.from(commentRecipients, (recipient) => ({
          userId: recipient,
          type: "comment",
          referenceId: created.id,
        })),
      });
    }

    await notifyMentionedUsers({
      commentId: created.id,
      content,
      authorId: userId,
      post: access.post,
      alreadyNotified: commentRecipients,
    });

    const comment = await findCommentForResponse(created.id, userId);
    return applyRateLimitHeaders(NextResponse.json(comment, { status: 201 }), rateLimit);
  } catch (error) {
    return handleApiError(error, "Yorum eklenemedi.");
  }
}
