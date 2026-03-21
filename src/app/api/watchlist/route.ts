import { NextRequest, NextResponse } from "next/server";
import { getCategoryVariants, normalizeCategory } from "@/lib/categories";
import { prisma } from "@/lib/prisma";
import { requireAuth, safeParseBody, handleApiError } from "@/lib/api-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;
import { serializeWishlistItem } from "@/lib/wishlist";
import { consumeRateLimit, createRateLimitErrorResponse } from "@/lib/rate-limit";

const TITLE_MAX_LENGTH = 160;
const CREATOR_MAX_LENGTH = 120;
const YEARS_MAX_LENGTH = 40;

export async function GET(req: NextRequest) {
  try {
    const [userId, authError] = await requireAuth();
    if (authError) return authError;

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const categoryVariants = getCategoryVariants(category);

    const items = await prisma.wishlist.findMany({
      where: {
        userId,
        ...(categoryVariants.length > 0 ? { category: { in: categoryVariants } } : {}),
      },
      orderBy: [{ addedAt: "desc" }, { updatedAt: "desc" }],
    });

    return NextResponse.json(items.map(serializeWishlistItem));
  } catch (error) {
    return handleApiError(error, "İzleme listesi alınamadı.");
  }
}

export async function POST(req: NextRequest) {
  try {
    const [userId, authError] = await requireAuth();
    if (authError) return authError;

    const rateLimit = await consumeRateLimit({
      action: "watchlist-add",
      req,
      userId,
      limit: 30,
      windowMs: 60_000,
    });
    if (!rateLimit.success) {
      return createRateLimitErrorResponse(
        rateLimit,
        "Çok fazla izleme listesi işlemi yaptınız. Lütfen biraz sonra tekrar deneyin."
      );
    }

    const body = await safeParseBody(req);
    if (!body) {
      return NextResponse.json({ error: "Geçersiz istek verisi" }, { status: 400 });
    }

    const category = normalizeCategory(body.category as string);
    const title =
      typeof body.title === "string" ? body.title.trim().slice(0, TITLE_MAX_LENGTH) : "";
    const creator =
      typeof body.creator === "string" ? body.creator.trim().slice(0, CREATOR_MAX_LENGTH) : "";
    const years =
      typeof body.years === "string" ? body.years.trim().slice(0, YEARS_MAX_LENGTH) : "";
    const image = typeof body.image === "string" ? body.image.trim() : "";
    const excerpt = typeof body.excerpt === "string" ? body.excerpt.trim().slice(0, 600) : "";
    const externalId = typeof body.externalId === "string" ? body.externalId.trim() : "";
    const externalRating =
      typeof body.externalRating === "number" && Number.isFinite(body.externalRating)
        ? body.externalRating
        : null;

    if (!category || !title || !externalId) {
      return NextResponse.json({ error: "Eksik watchlist verisi" }, { status: 400 });
    }

    const item = await prisma.wishlist.upsert({
      where: {
        userId_category_externalId: {
          userId,
          category,
          externalId,
        },
      },
      create: {
        userId,
        category,
        title,
        creator: creator || null,
        years: years || null,
        image: image || null,
        excerpt: excerpt || null,
        externalRating,
        externalId,
      },
      update: {
        title,
        creator: creator || null,
        years: years || null,
        image: image || null,
        excerpt: excerpt || null,
        externalRating,
      },
    });

    return NextResponse.json(serializeWishlistItem(item), { status: 201 });
  } catch (error) {
    return handleApiError(error, "İzleme listesine ekleme başarısız oldu.");
  }
}
