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

type RangeKey = "24h" | "7d" | "30d" | "90d" | "365d";
const VALID_RANGES: RangeKey[] = ["24h", "7d", "30d", "90d", "365d"];

function getRangeStart(range: RangeKey): Date {
  const now = new Date();
  const ms: Record<RangeKey, number> = {
    "24h": 24 * 60 * 60 * 1000,
    "7d": 7 * 24 * 60 * 60 * 1000,
    "30d": 30 * 24 * 60 * 60 * 1000,
    "90d": 90 * 24 * 60 * 60 * 1000,
    "365d": 365 * 24 * 60 * 60 * 1000,
  };
  return new Date(now.getTime() - ms[range]);
}

function buildBuckets(range: RangeKey, logs: { createdAt: Date }[]) {
  const now = new Date();
  const buckets: { label: string; key: string; count: number }[] = [];

  if (range === "24h") {
    for (let i = 23; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 60 * 60 * 1000);
      d.setMinutes(0, 0, 0);
      buckets.push({
        key: d.toISOString(),
        label: `${String(d.getHours()).padStart(2, "0")}:00`,
        count: 0,
      });
    }
    logs.forEach((log) => {
      const h = new Date(log.createdAt);
      h.setMinutes(0, 0, 0);
      const b = buckets.find((x) => x.key === h.toISOString());
      if (b) b.count++;
    });
  } else if (range === "7d" || range === "30d" || range === "90d") {
    const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      buckets.push({
        key: d.toISOString(),
        label: d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" }),
        count: 0,
      });
    }
    logs.forEach((log) => {
      const d = new Date(log.createdAt);
      d.setHours(0, 0, 0, 0);
      const b = buckets.find((x) => x.key === d.toISOString());
      if (b) b.count++;
    });
  } else {
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        label: d.toLocaleDateString("tr-TR", { month: "short", year: "2-digit" }),
        count: 0,
      });
    }
    logs.forEach((log) => {
      const d = new Date(log.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const b = buckets.find((x) => x.key === key);
      if (b) b.count++;
    });
  }

  return buckets;
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(_req.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const rawRange = searchParams.get("range") || "24h";
  const range: RangeKey = VALID_RANGES.includes(rawRange as RangeKey)
    ? (rawRange as RangeKey)
    : "24h";
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
      isBanned: true,
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

  const rangeStart = getRangeStart(range);

  const [logs, logsTotal, chartLogs, actionBreakdown] = await Promise.all([
    prisma.activityLog.findMany({
      where: { userId: params.id },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.activityLog.count({ where: { userId: params.id } }),
    prisma.activityLog.findMany({
      where: { userId: params.id, createdAt: { gte: rangeStart } },
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
    chartData: buildBuckets(range, chartLogs),
    range,
    actionBreakdown: actionBreakdown.map((a) => ({ action: a.action, count: a._count.id })),
  });
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { isAdmin, isBanned } = body;

  if (params.id === adminId && isAdmin === false) {
    return NextResponse.json({ error: "Kendi admin yetkini kaldıramazsın" }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {};
  if (typeof isAdmin === "boolean") updateData.isAdmin = isAdmin;
  if (typeof isBanned === "boolean") updateData.isBanned = isBanned;

  const existingUser = await prisma.user.findUnique({
    where: { id: params.id },
    select: { id: true },
  });

  if (!existingUser) {
    return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
  }

  const user = await prisma.user.update({
    where: { id: params.id },
    data: updateData,
    select: { id: true, name: true, email: true, isAdmin: true, isBanned: true },
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

  const existingUser = await prisma.user.findUnique({
    where: { id: params.id },
    select: { id: true },
  });

  if (!existingUser) {
    return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
  }

  await prisma.user.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}
