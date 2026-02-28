import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPostReadAccess } from "@/lib/post-access";
import {
  applyRateLimitHeaders,
  consumeRateLimit,
  createRateLimitErrorResponse,
} from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { id: postId } = params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  const access = await getPostReadAccess(postId, userId);

  if (!access.post || !access.canRead) {
    return NextResponse.json({ error: "Not bulunamadı" }, { status: 404 });
  }

  const comments = await prisma.comment.findMany({
    where: { postId },
    include: {
      user: { select: { id: true, name: true, username: true, avatarUrl: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(comments);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Giriş yapmanız gerekiyor" }, { status: 401 });
  }

  const { id: postId } = params;
  const { content, parentId } = await req.json();
  const userId = (session.user as { id: string }).id;
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

  if (!content?.trim()) {
    return NextResponse.json({ error: "Yorum boş olamaz" }, { status: 400 });
  }

  if (content.trim().length > 1000) {
    return NextResponse.json({ error: "Yorum 1000 karakterden uzun olamaz" }, { status: 400 });
  }

  let parentComment: { id: string; userId: string; postId: string } | null = null;
  if (typeof parentId === "string" && parentId.trim()) {
    parentComment = await prisma.comment.findUnique({
      where: { id: parentId.trim() },
      select: { id: true, userId: true, postId: true },
    });

    if (!parentComment || parentComment.postId !== postId) {
      return NextResponse.json({ error: "Yanıtlanacak yorum bulunamadı" }, { status: 404 });
    }
  }

  const comment = await prisma.comment.create({
    data: {
      content: content.trim(),
      post: { connect: { id: postId } },
      user: { connect: { id: userId } },
      ...(parentComment ? { parent: { connect: { id: parentComment.id } } } : {}),
    },
    include: {
      user: { select: { id: true, name: true, username: true, avatarUrl: true } },
    },
  });

  if (access.post.userId && access.post.userId !== userId) {
    await prisma.notification.create({
      data: {
        userId: access.post.userId,
        type: "comment",
        referenceId: comment.id,
      },
    });
  }

  if (
    parentComment &&
    parentComment.userId !== userId &&
    parentComment.userId !== access.post.userId
  ) {
    await prisma.notification.create({
      data: {
        userId: parentComment.userId,
        type: "comment",
        referenceId: comment.id,
      },
    });
  }

  return applyRateLimitHeaders(NextResponse.json(comment, { status: 201 }), rateLimit);
}
