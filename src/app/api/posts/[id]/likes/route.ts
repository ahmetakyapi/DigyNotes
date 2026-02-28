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
  const session = await getServerSession(authOptions);
  const { id: postId } = params;
  const userId = (session?.user as { id?: string })?.id;
  const access = await getPostReadAccess(postId, userId);

  if (!access.post || !access.canRead) {
    return NextResponse.json({ error: "Not bulunamadı" }, { status: 404 });
  }

  const count = await prisma.postLike.count({ where: { postId } });

  let liked = false;
  if (userId) {
    const existing = await prisma.postLike.findUnique({
      where: { postId_userId: { postId, userId } },
    });
    liked = !!existing;
  }

  return NextResponse.json({ count, liked });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Giriş yapmanız gerekiyor" }, { status: 401 });
  }

  const { id: postId } = params;
  const userId = (session.user as { id: string }).id;
  const rateLimit = await consumeRateLimit({
    action: "post-like-toggle",
    req,
    userId,
    limit: 30,
    windowMs: 60_000,
  });

  if (!rateLimit.success) {
    return createRateLimitErrorResponse(
      rateLimit,
      "Çok fazla beğeni işlemi yaptınız. Lütfen kısa bir süre sonra tekrar deneyin."
    );
  }

  const access = await getPostReadAccess(postId, userId);

  if (!access.post || !access.canRead) {
    return NextResponse.json({ error: "Not bulunamadı" }, { status: 404 });
  }

  const existing = await prisma.postLike.findUnique({
    where: { postId_userId: { postId, userId } },
  });

  if (existing) {
    await prisma.postLike.delete({ where: { postId_userId: { postId, userId } } });
    const count = await prisma.postLike.count({ where: { postId } });
    return applyRateLimitHeaders(NextResponse.json({ liked: false, count }), rateLimit);
  } else {
    await prisma.postLike.create({ data: { postId, userId } });

    if (access.post.userId && access.post.userId !== userId) {
      await prisma.notification.create({
        data: {
          userId: access.post.userId,
          type: "like",
          referenceId: `${postId}:${userId}`,
        },
      });
    }

    const count = await prisma.postLike.count({ where: { postId } });
    return applyRateLimitHeaders(NextResponse.json({ liked: true, count }), rateLimit);
  }
}
