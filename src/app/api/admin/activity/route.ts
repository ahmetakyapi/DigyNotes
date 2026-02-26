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

export async function GET(request: NextRequest) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const action = searchParams.get("action") || "";
  const limit = 50;
  const skip = (page - 1) * limit;

  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const where = action ? { action } : {};

  const [logs, total, hourlyData] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, username: true, avatarUrl: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.activityLog.count({ where }),
    // Hourly activity for last 24 hours
    prisma.activityLog.findMany({
      where: { createdAt: { gte: twentyFourHoursAgo } },
      select: { createdAt: true, action: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  // Build hourly buckets for last 24 hours
  const hours: { hour: string; label: string; count: number }[] = [];
  for (let i = 23; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 60 * 60 * 1000);
    d.setMinutes(0, 0, 0);
    hours.push({
      hour: d.toISOString(),
      label: `${String(d.getHours()).padStart(2, "0")}:00`,
      count: 0,
    });
  }

  hourlyData.forEach((log) => {
    const logHour = new Date(log.createdAt);
    logHour.setMinutes(0, 0, 0);
    const key = logHour.toISOString();
    const bucket = hours.find((h) => h.hour === key);
    if (bucket) bucket.count++;
  });

  return NextResponse.json({
    logs,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    hourlyData: hours,
  });
}
