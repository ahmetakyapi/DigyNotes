import { NextRequest, NextResponse } from "next/server";
import { getCategoryVariants, normalizeFixedCategory } from "@/lib/categories";
import { prisma } from "@/lib/prisma";
import { requireAuth, safeParseBody, handleApiError } from "@/lib/api-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;
import { serializeWishlistItem } from "@/lib/wishlist";
import { consumeRateLimit, createRateLimitErrorResponse } from "@/lib/rate-limit";

const TITLE_MAX_LENGTH = 160;
const CREATOR_MAX_LENGTH = 120;
const YEARS_MAX_LENGTH = 40;
// Travel ids are `nominatim:<full display name>`, which can run past 200 characters.
const EXTERNAL_ID_MAX_LENGTH = 500;
const IMAGE_MAX_LENGTH = 2048;

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

    const category = normalizeFixedCategory(
      typeof body.category === "string" ? body.category : null
    );
    const title =
      typeof body.title === "string" ? body.title.trim().slice(0, TITLE_MAX_LENGTH) : "";
    const creator =
      typeof body.creator === "string" ? body.creator.trim().slice(0, CREATOR_MAX_LENGTH) : "";
    const years =
      typeof body.years === "string" ? body.years.trim().slice(0, YEARS_MAX_LENGTH) : "";
    const rawImage = typeof body.image === "string" ? body.image.trim() : "";
    const image =
      rawImage.length <= IMAGE_MAX_LENGTH && /^https?:\/\//i.test(rawImage) ? rawImage : "";
    const excerpt = typeof body.excerpt === "string" ? body.excerpt.trim().slice(0, 600) : "";
    const externalId = typeof body.externalId === "string" ? body.externalId.trim() : "";
    const externalRating =
      typeof body.externalRating === "number" && Number.isFinite(body.externalRating)
        ? body.externalRating
        : null;

    if (
      !category ||
      category === "other" ||
      !title ||
      !externalId ||
      externalId.length > EXTERNAL_ID_MAX_LENGTH
    ) {
      return NextResponse.json({ error: "Eksik ya da geçersiz liste verisi" }, { status: 400 });
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
