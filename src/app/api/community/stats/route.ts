import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const title = searchParams.get("title");
    const creator = searchParams.get("creator");

    if (!title) return NextResponse.json({ count: 0, avgRating: 0 });

    const where: Prisma.PostWhereInput = {
      title: { equals: title, mode: "insensitive" },
      ...(creator ? { creator: { equals: creator, mode: "insensitive" } } : {}),
      // Only published notes count; drafts and trashed notes stay private.
      isDeleted: false,
      isDraft: false,
      user: { isPublic: true },
    };

    const [authors, rated] = await Promise.all([
      prisma.post.groupBy({ by: ["userId"], where }),
      prisma.post.aggregate({
        where: { AND: [where, { rating: { gt: 0 } }] },
        _avg: { rating: true },
      }),
    ]);

    // The card says "N kişi": people, not notes (a rewatch is the same person).
    const count = authors.length;
    // Unrated notes are stored as 0 and stay out of the average, like everywhere else.
    const avgRating = Math.round((rated._avg.rating ?? 0) * 10) / 10;

    return NextResponse.json({ count, avgRating });
  } catch (error) {
    return handleApiError(error, "Topluluk istatistikleri alınamadı.");
  }
}
