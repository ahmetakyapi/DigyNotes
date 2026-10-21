import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { collectionWithPostsInclude, serializeCollection } from "@/lib/collections";
import { requireAuth, safeParseBody, handleApiError } from "@/lib/api-server";
import { consumeRateLimit, createRateLimitErrorResponse } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** 404 when the collection is missing, 403 when it isn't the caller's, otherwise null. */
async function checkCollectionOwnership(id: string, userId: string) {
  const collection = await prisma.collection.findUnique({
    where: { id },
    select: { userId: true },
  });

  if (!collection) {
    return NextResponse.json({ error: "Koleksiyon bulunamadı" }, { status: 404 });
  }

  if (collection.userId !== userId) {
    return NextResponse.json({ error: "Bu işlem için yetkiniz yok" }, { status: 403 });
  }

  return null;
}

async function getSerializedCollection(id: string) {
  const collection = await prisma.collection.findUnique({
    where: { id },
    include: collectionWithPostsInclude,
  });

  return collection ? serializeCollection(collection) : null;
}

/** Adding or removing notes counts as an update: bump `updatedAt` and return the fresh collection. */
async function touchSerializedCollection(id: string) {
  const collection = await prisma.collection.update({
    where: { id },
    data: { updatedAt: new Date() },
    include: collectionWithPostsInclude,
  });

  return serializeCollection(collection);
}

async function consumeCollectionPostsRateLimit(req: NextRequest, userId: string) {
  const rateLimit = await consumeRateLimit({
    action: "collection-posts",
    req,
    userId,
    limit: 60,
    windowMs: 60_000,
  });

  return rateLimit.success
    ? null
    : createRateLimitErrorResponse(
        rateLimit,
        "Çok fazla koleksiyon işlemi yaptınız. Lütfen biraz sonra tekrar deneyin."
      );
}

async function readPostId(req: NextRequest) {
  const body = await safeParseBody<{ postId?: unknown }>(req);
  return typeof body?.postId === "string" ? body.postId.trim() : "";
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const [userId, authError] = await requireAuth();
    if (authError) return authError;

    const rateLimitError = await consumeCollectionPostsRateLimit(req, userId);
    if (rateLimitError) return rateLimitError;

    const ownershipError = await checkCollectionOwnership(params.id, userId);
    if (ownershipError) return ownershipError;

    const postId = await readPostId(req);

    if (!postId) {
      return NextResponse.json({ error: "Not seçilmedi" }, { status: 400 });
    }

    const post = await prisma.post.findFirst({
      where: {
        id: postId,
        userId,
        isDeleted: false,
        isDraft: false,
      },
      select: { id: true },
    });

    if (!post) {
      return NextResponse.json(
        { error: "Koleksiyona sadece kendi notlarınızı ekleyebilirsiniz" },
        { status: 400 }
      );
    }

    const currentMax = await prisma.collectionPost.aggregate({
      where: { collectionId: params.id },
      _max: { position: true },
    });

    await prisma.collectionPost.upsert({
      where: {
        collectionId_postId: {
          collectionId: params.id,
          postId,
        },
      },
      create: {
        collectionId: params.id,
        postId,
        position: (currentMax._max.position ?? -1) + 1,
      },
      update: {},
    });

    return NextResponse.json(await touchSerializedCollection(params.id));
  } catch (error) {
    return handleApiError(error, "Koleksiyon güncellenemedi.");
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const [userId, authError] = await requireAuth();
    if (authError) return authError;

    const rateLimitError = await consumeCollectionPostsRateLimit(req, userId);
    if (rateLimitError) return rateLimitError;

    const ownershipError = await checkCollectionOwnership(params.id, userId);
    if (ownershipError) return ownershipError;

    const postId = await readPostId(req);

    if (!postId) {
      return NextResponse.json({ error: "Not seçilmedi" }, { status: 400 });
    }

    const { count } = await prisma.collectionPost.deleteMany({
      where: {
        collectionId: params.id,
        postId,
      },
    });

    const serialized =
      count > 0
        ? await touchSerializedCollection(params.id)
        : await getSerializedCollection(params.id);

    return NextResponse.json(serialized);
  } catch (error) {
    return handleApiError(error, "Koleksiyon güncellenemedi.");
  }
}
