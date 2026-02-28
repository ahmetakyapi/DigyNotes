import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  applyRateLimitHeaders,
  consumeRateLimit,
  createRateLimitErrorResponse,
} from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const username = req.nextUrl.searchParams.get("username");
  if (!username) return NextResponse.json({ error: "username required" }, { status: 400 });

  const target = await prisma.user.findUnique({ where: { username }, select: { id: true } });
  if (!target) return NextResponse.json({ isFollowing: false });

  const follow = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: userId, followingId: target.id } },
  });

  return NextResponse.json({ isFollowing: !!follow });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;
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
      "Cok fazla takip islemi yaptiniz. Lutfen biraz sonra tekrar deneyin."
    );
  }

  const { username } = await req.json();
  if (!username) return NextResponse.json({ error: "username required" }, { status: 400 });

  const target = await prisma.user.findUnique({ where: { username }, select: { id: true } });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (target.id === userId)
    return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });

  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: userId, followingId: target.id } },
  });

  if (!existing) {
    await prisma.follow.create({
      data: { followerId: userId, followingId: target.id },
    });

    await prisma.notification.create({
      data: {
        userId: target.id,
        type: "follow",
        referenceId: userId,
      },
    });
  }

  await prisma.activityLog.create({
    data: {
      userId,
      action: "user.follow",
      metadata: { targetUserId: target.id, targetUsername: username },
    },
  });

  return applyRateLimitHeaders(NextResponse.json({ success: true }), rateLimit);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;
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
      "Cok fazla takip islemi yaptiniz. Lutfen biraz sonra tekrar deneyin."
    );
  }

  const { username } = await req.json();
  if (!username) return NextResponse.json({ error: "username required" }, { status: 400 });

  const target = await prisma.user.findUnique({ where: { username }, select: { id: true } });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  await prisma.follow.deleteMany({
    where: { followerId: userId, followingId: target.id },
  });

  return applyRateLimitHeaders(NextResponse.json({ success: true }), rateLimit);
}
