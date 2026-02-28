import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCategoryVariants, normalizeCategory } from "@/lib/categories";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;
import { serializeWishlistItem } from "@/lib/wishlist";

const TITLE_MAX_LENGTH = 160;
const CREATOR_MAX_LENGTH = 120;
const YEARS_MAX_LENGTH = 40;

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const category = normalizeCategory(body.category);
  const title = typeof body.title === "string" ? body.title.trim().slice(0, TITLE_MAX_LENGTH) : "";
  const creator =
    typeof body.creator === "string" ? body.creator.trim().slice(0, CREATOR_MAX_LENGTH) : "";
  const years = typeof body.years === "string" ? body.years.trim().slice(0, YEARS_MAX_LENGTH) : "";
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
}
