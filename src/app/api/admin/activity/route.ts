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

export async function GET(request: NextRequest) {
  try {
    const adminId = await requireAdmin();
    if (!adminId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const action = searchParams.get("action") || "";
    const rawRange = searchParams.get("range") || "24h";
    const range: RangeKey = VALID_RANGES.includes(rawRange as RangeKey)
      ? (rawRange as RangeKey)
      : "24h";
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
      chartData: buildActivityBuckets(range, chartLogs),
      range,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
