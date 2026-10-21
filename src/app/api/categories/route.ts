import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { FIXED_CATEGORIES, normalizeCategory } from "@/lib/categories";
import { prisma } from "@/lib/prisma";
import { getSessionUserId, requireAuth, safeParseBody, handleApiError } from "@/lib/api-server";
import { consumeRateLimit, createRateLimitErrorResponse } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const NAME_MAX_LENGTH = 40;

export async function GET() {
  try {
    const userId = await getSessionUserId();

    if (userId) {
      const existingCategories = await prisma.category.findMany({
        where: { userId },
        select: { name: true },
      });
      const existingNames = new Set(existingCategories.map((category) => category.name));
      const missingCategories = FIXED_CATEGORIES.filter((name) => !existingNames.has(name));

      if (missingCategories.length > 0) {
        await prisma.category.createMany({
          data: missingCategories.map((name) => ({ name, userId })),
          skipDuplicates: true,
        });
      }
    }

    const categories = await prisma.category.findMany({
      where: userId ? { userId } : { userId: null },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(categories);
  } catch (error) {
    return handleApiError(error, "Kategoriler alınamadı.");
  }
}

export async function POST(request: NextRequest) {
  try {
    const [userId, authError] = await requireAuth();
    if (authError) return authError;

    const rateLimit = await consumeRateLimit({
      action: "category-create",
      req: request,
      userId,
      limit: 20,
      windowMs: 10 * 60_000,
    });
    if (!rateLimit.success) {
      return createRateLimitErrorResponse(
        rateLimit,
        "Çok fazla kategori oluşturdunuz. Lütfen biraz sonra tekrar deneyin."
      );
    }

    const body = await safeParseBody<{ name?: unknown }>(request);
    if (!body) {
      return NextResponse.json({ error: "Geçersiz istek verisi" }, { status: 400 });
    }

    const normalizedName = normalizeCategory(typeof body.name === "string" ? body.name : "");

    if (!normalizedName) {
      return NextResponse.json({ error: "Kategori adı gerekli" }, { status: 400 });
    }

    if (normalizedName.length > NAME_MAX_LENGTH) {
      return NextResponse.json({ error: "Kategori adı çok uzun" }, { status: 400 });
    }

    let category;
    try {
      category = await prisma.category.create({
        data: { name: normalizedName, userId },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        return NextResponse.json({ error: "Bu kategori zaten mevcut" }, { status: 409 });
      }

      throw error;
    }

    await prisma.activityLog.create({
      data: {
        userId,
        action: "category.create",
        metadata: { categoryId: category.id, name: category.name },
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    return handleApiError(error, "Kategori eklenemedi.");
  }
}
