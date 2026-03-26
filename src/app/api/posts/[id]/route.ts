import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { transformPostTags, sanitizeRating, sanitizePostContent } from "@/lib/api-utils";
import { normalizeCategory } from "@/lib/categories";
import { prisma } from "@/lib/prisma";
import { getPostReadAccess } from "@/lib/post-access";
import { categorySupportsSpoiler } from "@/lib/post-config";
import { handleApiError } from "@/lib/api-server";
import {
  consumeRateLimit,
  createRateLimitErrorResponse,
} from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id;
    const access = await getPostReadAccess(params.id, userId);

    if (!access.post || !access.canRead) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const post = await prisma.post.findUnique({
      where: { id: params.id },
      include: {
        tags: { include: { tag: true } },
        user: { select: { id: true, name: true, username: true, avatarUrl: true } },
      },
    });
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json(transformPostTags(post));
  } catch (error) {
    return handleApiError(error, "Not detayı yüklenirken bir hata oluştu.");
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimit = await consumeRateLimit({
      action: "post-update",
      req: request,
      userId,
      limit: 30,
      windowMs: 10 * 60_000,
    });
    if (!rateLimit.success) {
      return createRateLimitErrorResponse(
        rateLimit,
        "Çok fazla güncelleme yaptınız. Lütfen biraz sonra tekrar deneyin."
      );
    }

    const body = await request.json();
    const normalizedCategory = normalizeCategory(body.category);
    const {
      title,
      image,
      excerpt,
      content,
      creator,
      years,
      rating,
      status,
      hasSpoiler,
      lat,
      lng,
      imagePosition,
      tags,
      externalRating,
    } = body;

    const [existing, currentUser] = await Promise.all([
      prisma.post.findUnique({ where: { id: params.id }, select: { id: true, userId: true } }),
      prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true } }),
    ]);
    const isAdmin = currentUser?.isAdmin ?? false;

    if (!existing || (!isAdmin && existing.userId !== null && existing.userId !== userId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const sanitizedContent = sanitizePostContent(content ?? "");

    const tagNames: string[] = Array.isArray(tags)
      ? tags
          .map((t: string) => t.toLowerCase().trim())
          .filter(Boolean)
          .slice(0, 10)
      : [];

    const upsertedTags = await Promise.all(
      tagNames.map((name) => prisma.tag.upsert({ where: { name }, create: { name }, update: {} }))
    );

    // Replace all existing tags
    await prisma.postTag.deleteMany({ where: { postId: params.id } });

    const post = await prisma.post.update({
      where: { id: params.id },
          data: {
        title: String(title).slice(0, 500),
        category: normalizedCategory,
        image,
        excerpt: String(excerpt).slice(0, 2000),
        content: sanitizedContent,
        creator,
        years,
        rating: sanitizeRating(rating),
        externalRating: typeof externalRating === "number" ? externalRating : null,
        status: status || null,
        hasSpoiler: categorySupportsSpoiler(normalizedCategory) ? Boolean(hasSpoiler) : false,
        lat: typeof lat === "number" ? lat : null,
        lng: typeof lng === "number" ? lng : null,
        imagePosition: imagePosition || "center",
        tags: {
          create: upsertedTags.map((tag) => ({ tagId: tag.id })),
        },
      },
      include: { tags: { include: { tag: true } } },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: "post.update",
        metadata: { postId: post.id, title: post.title, category: post.category },
      },
    });

    return NextResponse.json(transformPostTags(post));
  } catch (error) {
    return handleApiError(error, "Not güncellenirken bir hata oluştu.");
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimit = await consumeRateLimit({
      action: "post-delete",
      req: _req,
      userId,
      limit: 10,
      windowMs: 10 * 60_000,
    });
    if (!rateLimit.success) {
      return createRateLimitErrorResponse(
        rateLimit,
        "Çok fazla silme işlemi yaptınız. Lütfen biraz sonra tekrar deneyin."
      );
    }

    const [postToDelete, currentUser] = await Promise.all([
      prisma.post.findUnique({ where: { id: params.id }, select: { title: true, category: true, userId: true } }),
      prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true } }),
    ]);
    const isAdmin = currentUser?.isAdmin ?? false;

    if (!postToDelete) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (!isAdmin && postToDelete.userId !== null && postToDelete.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Soft-delete: isDeleted flag + deletedAt timestamp
    const softDeleteWhere = isAdmin
      ? { id: params.id }
      : { id: params.id, userId };

    await prisma.post.updateMany({
      where: softDeleteWhere,
      data: { isDeleted: true, deletedAt: new Date() },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: "post.delete",
        metadata: { postId: params.id, title: postToDelete.title, category: postToDelete.category },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, "Not silinirken bir hata oluştu.");
  }
}
