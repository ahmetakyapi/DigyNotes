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
    "24h":  24 * 60 * 60 * 1000,
    "7d":   7  * 24 * 60 * 60 * 1000,
    "30d":  30 * 24 * 60 * 60 * 1000,
    "90d":  90 * 24 * 60 * 60 * 1000,
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
      buckets.push({ key: d.toISOString(), label: `${String(d.getHours()).padStart(2, "0")}:00`, count: 0 });
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
    // 365d → monthly
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

export async function GET(request: NextRequest) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const action = searchParams.get("action") || "";
  const rawRange = searchParams.get("range") || "24h";
  const range: RangeKey = VALID_RANGES.includes(rawRange as RangeKey) ? (rawRange as RangeKey) : "24h";
  const limit = 50;
  const skip = (page - 1) * limit;

  const rangeStart = getRangeStart(range);
  const where = action ? { action } : {};

  const [logs, total, chartLogs] = await Promise.all([
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
    prisma.activityLog.findMany({
      where: { createdAt: { gte: rangeStart } },
      select: { createdAt: true, action: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return NextResponse.json({
    logs,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    chartData: buildBuckets(range, chartLogs),
    range,
  });
}
