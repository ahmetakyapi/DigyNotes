import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const user = await prisma.user.findUnique({
    where: { id: (session.user as { id: string }).id },
    select: { isAdmin: true },
  });
  return user?.isAdmin ? (session.user as { id: string }).id : null;
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(_req.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = 30;
  const skip = (page - 1) * limit;

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
      bio: true,
      avatarUrl: true,
      isAdmin: true,
      isPublic: true,
      createdAt: true,
      lastLoginAt: true,
      lastLogoutAt: true,
      _count: { select: { posts: true, followers: true, following: true, activityLogs: true } },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
  }

  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [logs, logsTotal, hourlyData, actionBreakdown] = await Promise.all([
    prisma.activityLog.findMany({
      where: { userId: params.id },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.activityLog.count({ where: { userId: params.id } }),
    prisma.activityLog.findMany({
      where: { userId: params.id, createdAt: { gte: twentyFourHoursAgo } },
      select: { createdAt: true, action: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.activityLog.groupBy({
      by: ["action"],
      where: { userId: params.id },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    }),
  ]);

  // Hourly buckets — last 24h
  const hours: { hour: string; label: string; count: number }[] = [];
  for (let i = 23; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 60 * 60 * 1000);
    d.setMinutes(0, 0, 0);
    hours.push({ hour: d.toISOString(), label: `${String(d.getHours()).padStart(2, "0")}:00`, count: 0 });
  }
  hourlyData.forEach((log) => {
    const logHour = new Date(log.createdAt);
    logHour.setMinutes(0, 0, 0);
    const key = logHour.toISOString();
    const bucket = hours.find((h) => h.hour === key);
    if (bucket) bucket.count++;
  });

  return NextResponse.json({
    user: {
      ...user,
      postCount: user._count.posts,
      followerCount: user._count.followers,
      followingCount: user._count.following,
      activityCount: user._count.activityLogs,
    },
    logs,
    logsTotal,
    page,
    totalPages: Math.ceil(logsTotal / limit),
    hourlyData: hours,
    actionBreakdown: actionBreakdown.map((a) => ({ action: a.action, count: a._count.id })),
  });
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { isAdmin } = body;

  if (params.id === adminId && isAdmin === false) {
    return NextResponse.json({ error: "Kendi admin yetkini kaldıramazsın" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: params.id },
    data: { isAdmin: Boolean(isAdmin) },
    select: { id: true, name: true, email: true, isAdmin: true },
  });

  return NextResponse.json(user);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (params.id === adminId) {
    return NextResponse.json({ error: "Kendi hesabını silemezsin" }, { status: 400 });
  }

  await prisma.user.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}
