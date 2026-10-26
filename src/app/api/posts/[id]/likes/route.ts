import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPostReadAccess } from "@/lib/post-access";
import { handleApiError } from "@/lib/api-server";
import {
  applyRateLimitHeaders,
  consumeRateLimit,
  createRateLimitErrorResponse,
} from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  _req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  const params = await paramsPromise;
  try {
    const session = await getServerSession(authOptions);
    const { id: postId } = params;
    const userId = (session?.user as { id?: string })?.id;
    const access = await getPostReadAccess(postId, userId);

    if (!access.post || !access.canRead) {
      return NextResponse.json({ error: "Not bulunamadı" }, { status: 404 });
    }

    const [count, existing] = await Promise.all([
      prisma.postLike.count({ where: { postId } }),
      userId
        ? prisma.postLike.findUnique({
            where: { postId_userId: { postId, userId } },
            select: { userId: true },
          })
        : Promise.resolve(null),
    ]);

    return NextResponse.json({ count, liked: !!existing });
  } catch (error) {
    return handleApiError(error, "Beğeni bilgisi yüklenirken bir hata oluştu.");
  }
}

export async function POST(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  const params = await paramsPromise;
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (!userId) {
      return NextResponse.json({ error: "Giriş yapmanız gerekiyor" }, { status: 401 });
    }

    const { id: postId } = params;
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

    /* Same pattern as comment likes: the author gets one `like` notification per actor
       (referenceId "<postId>:<actorId>"), an unlike removes it, so liking again never
       stacks duplicates; upsert/deleteMany keep a toggle racing itself from failing. */
    const key = { postId_userId: { postId, userId } };
    const ownerId = access.post.userId;
    const notifyAuthor = !!ownerId && ownerId !== userId;
    const notification = {
      userId: ownerId ?? "",
      type: "like",
      referenceId: `${postId}:${userId}`,
    };
    const existing = await prisma.postLike.findUnique({ where: key, select: { userId: true } });

    let liked: boolean;
    if (existing) {
      await prisma.postLike.deleteMany({ where: { postId, userId } });
      if (notifyAuthor) {
        await prisma.notification.deleteMany({ where: notification });
      }
      liked = false;
    } else {
      await prisma.postLike.upsert({ where: key, create: { postId, userId }, update: {} });
      if (notifyAuthor) {
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

    const count = await prisma.postLike.count({ where: { postId } });
    return applyRateLimitHeaders(NextResponse.json({ liked, count }), rateLimit);
  } catch (error) {
    return handleApiError(error, "Beğeni işlemi sırasında bir hata oluştu.");
  }
}
