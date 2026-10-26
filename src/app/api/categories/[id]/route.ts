import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleApiError } from "@/lib/api-server";
import { consumeRateLimit, createRateLimitErrorResponse } from "@/lib/rate-limit";

export async function DELETE(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  const params = await paramsPromise;
  try {
    const [userId, authError] = await requireAuth();
    if (authError) return authError;

    const rateLimit = await consumeRateLimit({
      action: "category-delete",
      req,
      userId,
      limit: 20,
      windowMs: 10 * 60_000,
    });
    if (!rateLimit.success) {
      return createRateLimitErrorResponse(
        rateLimit,
        "Çok fazla kategori işlemi yaptınız. Lütfen biraz sonra tekrar deneyin."
      );
    }

    const category = await prisma.category.findUnique({
      where: { id: params.id },
      select: { userId: true },
    });

    if (!category) {
      return NextResponse.json({ error: "Kategori bulunamadı" }, { status: 404 });
    }

    // Legacy global rows (userId: null) belong to no one, so they can't be deleted here either.
    if (category.userId !== userId) {
      return NextResponse.json({ error: "Bu işlem için yetkiniz yok" }, { status: 403 });
    }

    await prisma.category.deleteMany({ where: { id: params.id, userId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, "Kategori silinemedi.");
  }
}
