import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleApiError } from "@/lib/api-server";
import { consumeRateLimit, createRateLimitErrorResponse } from "@/lib/rate-limit";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const [userId, authError] = await requireAuth();
    if (authError) return authError;

    const rateLimit = await consumeRateLimit({
      action: "watchlist-remove",
      req: _req,
      userId,
      limit: 30,
      windowMs: 60_000,
    });
    if (!rateLimit.success) {
      return createRateLimitErrorResponse(
        rateLimit,
        "Çok fazla işlem yaptınız. Lütfen biraz sonra tekrar deneyin."
      );
    }

    const item = await prisma.wishlist.findUnique({
      where: { id: params.id },
      select: { id: true, userId: true },
    });

    if (!item || item.userId !== userId) {
      return NextResponse.json({ error: "Watchlist kaydı bulunamadı" }, { status: 404 });
    }

    await prisma.wishlist.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, "İzleme listesi kaydı silinemedi.");
  }
}
