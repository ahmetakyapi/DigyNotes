import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth, safeParseBody, handleApiError } from "@/lib/api-server";
import {
  applyRateLimitHeaders,
  consumeRateLimit,
  createRateLimitErrorResponse,
} from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const [userId, authError] = await requireAuth();
    if (authError) return authError;

    const username = req.nextUrl.searchParams.get("username");
    if (!username) return NextResponse.json({ error: "username required" }, { status: 400 });

    const target = await prisma.user.findUnique({ where: { username }, select: { id: true } });
    if (!target) return NextResponse.json({ isFollowing: false });

    const follow = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: userId, followingId: target.id } },
    });

    return NextResponse.json({ isFollowing: !!follow });
  } catch (error) {
    return handleApiError(error, "Takip durumu alınamadı.");
  }
}

export async function POST(req: NextRequest) {
  try {
    const [userId, authError] = await requireAuth();
    if (authError) return authError;

    const rateLimit = await consumeRateLimit({
      action: "follow-mutate",
      req,
      userId,
      limit: 20,
      windowMs: 10 * 60_000,
    });

    if (!rateLimit.success) {
      return createRateLimitErrorResponse(
        rateLimit,
        "Çok fazla takip işlemi yaptınız. Lütfen biraz sonra tekrar deneyin."
      );
    }

    const body = await safeParseBody<{ username?: string }>(req);
    if (!body?.username) return NextResponse.json({ error: "username required" }, { status: 400 });

    const { username } = body;
    const target = await prisma.user.findUnique({ where: { username }, select: { id: true } });
    if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (target.id === userId)
      return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });

    const existing = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: userId, followingId: target.id } },
    });

    if (!existing) {
      /* Two tabs racing: the loser hits the composite key, the follow already exists. */
      const created = await prisma.follow
        .create({ data: { followerId: userId, followingId: target.id } })
        .then(() => true)
        .catch((error: unknown) => {
          if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            return false;
          }
          throw error;
        });

      if (created) {
        /* Follow/unfollow loops must not flood the target with "seni takip etti". */
        const notification = { userId: target.id, type: "follow", referenceId: userId };
        const alreadyNotified = await prisma.notification.findFirst({
          where: { ...notification, createdAt: { gte: new Date(Date.now() - 24 * 60 * 60_000) } },
          select: { id: true },
        });
        if (!alreadyNotified) {
          await prisma.notification.create({ data: notification });
        }

        await prisma.activityLog.create({
          data: {
            userId,
            action: "user.follow",
            metadata: { targetUserId: target.id, targetUsername: username },
          },
        });
      }
    }

    return applyRateLimitHeaders(NextResponse.json({ success: true }), rateLimit);
  } catch (error) {
    return handleApiError(error, "Takip işlemi başarısız oldu.");
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const [userId, authError] = await requireAuth();
    if (authError) return authError;

    const rateLimit = await consumeRateLimit({
      action: "follow-mutate",
      req,
      userId,
      limit: 20,
      windowMs: 10 * 60_000,
    });

    if (!rateLimit.success) {
      return createRateLimitErrorResponse(
        rateLimit,
        "Çok fazla takip işlemi yaptınız. Lütfen biraz sonra tekrar deneyin."
      );
    }

    const body = await safeParseBody<{ username?: string }>(req);
    if (!body?.username) return NextResponse.json({ error: "username required" }, { status: 400 });

    const target = await prisma.user.findUnique({
      where: { username: body.username },
      select: { id: true },
    });
    if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

    await prisma.follow.deleteMany({
      where: { followerId: userId, followingId: target.id },
    });

    return applyRateLimitHeaders(NextResponse.json({ success: true }), rateLimit);
  } catch (error) {
    return handleApiError(error, "Takip kaldırma işlemi başarısız oldu.");
  }
}
