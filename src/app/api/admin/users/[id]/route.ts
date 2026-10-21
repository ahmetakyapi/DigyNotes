import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, handleApiError } from "@/lib/api-server";
import { prisma } from "@/lib/prisma";
import { buildActivityBuckets } from "@/lib/admin-buckets";

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

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
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
        _count: {
          select: {
            posts: { where: { isDeleted: false } },
            followers: true,
            following: true,
            activityLogs: true,
          },
        },
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
      chartData: buildActivityBuckets(range, chartLogs),
      range,
      actionBreakdown: actionBreakdown.map((a) => ({ action: a.action, count: a._count.id })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const adminId = await requireAdmin();
    if (!adminId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { isAdmin, isBanned, isPublic } = body;

    if (params.id === adminId && isAdmin === false) {
      return NextResponse.json({ error: "Kendi admin yetkini kaldıramazsın" }, { status: 400 });
    }

    // A banned session is dropped at once, so a self-ban would lock the admin out for good.
    if (params.id === adminId && isBanned === true) {
      return NextResponse.json({ error: "Kendi hesabını banlayamazsın" }, { status: 400 });
    }

    const updateData: Record<string, boolean> = {};
    if (typeof isAdmin === "boolean") updateData.isAdmin = isAdmin;
    if (typeof isBanned === "boolean") updateData.isBanned = isBanned;
    if (typeof isPublic === "boolean") updateData.isPublic = isPublic;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "Geçerli alan gönderilmedi" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: params.id },
      select: { id: true },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
    }

    // One transaction, so a failed audit write never reports an applied change as failed.
    const [user] = await prisma.$transaction([
      prisma.user.update({
        where: { id: params.id },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          isAdmin: true,
          isBanned: true,
          isPublic: true,
        },
      }),
      prisma.activityLog.create({
        data: {
          userId: adminId,
          action: "user.update",
          metadata: { targetUserId: params.id, changes: updateData, adminAction: true },
        },
      }),
    ]);

    return NextResponse.json(user);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
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

    // The account's own logs hold its name, e-mail and note titles, so they go too;
    // the audit entry keeps only the id.
    await prisma.$transaction([
      prisma.activityLog.deleteMany({ where: { userId: params.id } }),
      prisma.user.delete({ where: { id: params.id } }),
      prisma.activityLog.create({
        data: {
          userId: adminId,
          action: "user.delete",
          metadata: { targetUserId: params.id, adminAction: true },
        },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
