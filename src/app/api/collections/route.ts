import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { collectionWithPostsInclude, serializeCollection } from "@/lib/collections";
import { requireAuth, safeParseBody, handleApiError } from "@/lib/api-server";
import { consumeRateLimit, createRateLimitErrorResponse } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const TITLE_MAX_LENGTH = 80;
const DESCRIPTION_MAX_LENGTH = 400;
const MAX_POST_IDS = 30;

export async function GET() {
  try {
    const [userId, authError] = await requireAuth();
    if (authError) return authError;

    const collections = await prisma.collection.findMany({
      where: { userId },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      include: collectionWithPostsInclude,
    });

    return NextResponse.json(collections.map(serializeCollection));
  } catch (error) {
    return handleApiError(error, "Koleksiyonlar alınamadı.");
  }
}

export async function POST(req: NextRequest) {
  try {
    const [userId, authError] = await requireAuth();
    if (authError) return authError;

    const rateLimit = await consumeRateLimit({
      action: "collection-create",
      req,
      userId,
      limit: 15,
      windowMs: 10 * 60_000,
    });
    if (!rateLimit.success) {
      return createRateLimitErrorResponse(
        rateLimit,
        "Çok fazla koleksiyon oluşturdunuz. Lütfen biraz sonra tekrar deneyin."
      );
    }

    const body = await safeParseBody(req);
    if (!body) {
      return NextResponse.json({ error: "Geçersiz istek verisi" }, { status: 400 });
    }

    const title = typeof body.title === "string" ? body.title.trim() : "";
    const description =
      typeof body.description === "string"
        ? body.description.trim().slice(0, DESCRIPTION_MAX_LENGTH)
        : "";
    const postIds: string[] = [];

    if (Array.isArray(body.postIds)) {
      for (const value of body.postIds) {
        if (typeof value !== "string") continue;
        if (postIds.includes(value)) continue;

        postIds.push(value);

        if (postIds.length >= MAX_POST_IDS) {
          break;
        }
      }
    }

    if (!title) {
      return NextResponse.json({ error: "Koleksiyon başlığı gerekli" }, { status: 400 });
    }

    if (title.length > TITLE_MAX_LENGTH) {
      return NextResponse.json({ error: "Koleksiyon başlığı çok uzun" }, { status: 400 });
    }

    const ownedPosts = postIds.length
      ? await prisma.post.findMany({
          where: {
            id: { in: postIds },
            userId,
          },
          select: { id: true },
        })
      : [];

    if (ownedPosts.length !== postIds.length) {
      return NextResponse.json(
        { error: "Koleksiyona sadece kendi notlarınızı ekleyebilirsiniz" },
        { status: 400 }
      );
    }

    const collection = await prisma.collection.create({
      data: {
        userId,
        title,
        description: description || null,
        posts: {
          create: postIds.map((postId, index) => ({
            position: index,
            post: { connect: { id: postId } },
          })),
        },
      },
      include: collectionWithPostsInclude,
    });

    return NextResponse.json(serializeCollection(collection), { status: 201 });
  } catch (error) {
    return handleApiError(error, "Koleksiyon oluşturulamadı.");
  }
}
