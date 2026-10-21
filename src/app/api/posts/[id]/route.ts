import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  sanitizeRating,
  sanitizePostContent,
  sanitizeStringField,
  transformPostTags,
} from "@/lib/api-utils";
import { normalizeCategory } from "@/lib/categories";
import { prisma } from "@/lib/prisma";
import { getPostDetail } from "@/lib/post-detail";
import { categorySupportsSpoiler } from "@/lib/post-config";
import { handleApiError, safeParseBody } from "@/lib/api-server";
import {
  boundedNumber,
  formatMissingFieldsMessage,
  getMissingPostFields,
  hasMeaningfulContent,
  parseCoverImage,
  POST_CATEGORY_MAX_LENGTH,
  POST_CONTENT_MAX_LENGTH,
} from "@/lib/post-form";
import { consumeRateLimit, createRateLimitErrorResponse } from "@/lib/rate-limit";
import { stripHtml } from "@/lib/text";
import { cleanTagName, TAG_LIMIT } from "@/lib/tag-input";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id;
    const { post } = await getPostDetail(params.id, userId ?? null);
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json(post);
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

    const body = await safeParseBody<Record<string, unknown>>(request);
    if (!body) {
      return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
    }
    const normalizedCategory = normalizeCategory(
      typeof body.category === "string" ? body.category : ""
    );
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

    if (!existing) {
      return NextResponse.json({ error: "Not bulunamadı" }, { status: 404 });
    }
    // Legacy notes without an owner (userId null) are editable by admins only.
    if (!isAdmin && existing.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Yalnızca başlık, kategori ve içerik zorunlu; kapak, yaratıcı ve yıl boş kalabilir.
    const sanitizedContent = sanitizePostContent(typeof content === "string" ? content : "");
    const missing = getMissingPostFields({
      title: typeof title === "string" ? title : "",
      category: normalizedCategory,
      hasContent: hasMeaningfulContent(sanitizedContent),
    });
    if (missing.length > 0) {
      return NextResponse.json({ error: formatMissingFieldsMessage(missing) }, { status: 400 });
    }
    if (sanitizedContent.length > POST_CONTENT_MAX_LENGTH) {
      return NextResponse.json({ error: "Not içeriği çok uzun." }, { status: 400 });
    }
    if (normalizedCategory.length > POST_CATEGORY_MAX_LENGTH) {
      return NextResponse.json({ error: "Kategori adı çok uzun." }, { status: 400 });
    }
    const coverImage = parseCoverImage(image);
    if (coverImage === null) {
      return NextResponse.json(
        { error: "Kapak görseli geçerli bir bağlantı olmalı." },
        { status: 400 }
      );
    }
    const safeExcerpt =
      typeof excerpt === "string" && excerpt.trim() ? excerpt : stripHtml(sanitizedContent);

    // Same cleaning as TagInput; de-duplicated so two spellings of one tag can't hit post_tags' key.
    const tagNames: string[] = Array.isArray(tags)
      ? Array.from(
          new Set(
            tags
              .filter((t): t is string => typeof t === "string")
              .map(cleanTagName)
              .filter(Boolean)
          )
        ).slice(0, TAG_LIMIT)
      : [];

    const upsertedTags = await Promise.all(
      tagNames.map((name) => prisma.tag.upsert({ where: { name }, create: { name }, update: {} }))
    );

    // Replace all existing tags in one transaction: a failed update keeps the old tags.
    const [, post] = await prisma.$transaction([
      prisma.postTag.deleteMany({ where: { postId: params.id } }),
      prisma.post.update({
        where: { id: params.id },
        data: {
          title: String(title).trim().slice(0, 500),
          category: normalizedCategory,
          image: coverImage,
          excerpt: safeExcerpt.slice(0, 2000),
          content: sanitizedContent,
          creator: sanitizeStringField(creator, 200),
          years: sanitizeStringField(years, 40),
          rating: sanitizeRating(rating),
          externalRating: boundedNumber(externalRating, 0, 10),
          status: sanitizeStringField(status, 40),
          hasSpoiler: categorySupportsSpoiler(normalizedCategory) ? Boolean(hasSpoiler) : false,
          lat: boundedNumber(lat, -90, 90),
          lng: boundedNumber(lng, -180, 180),
          imagePosition: sanitizeStringField(imagePosition, 40) ?? "center",
          tags: {
            create: upsertedTags.map((tag) => ({ tagId: tag.id })),
          },
        },
        include: { tags: { include: { tag: true } } },
      }),
    ]);

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
      prisma.post.findUnique({
        where: { id: params.id },
        select: { title: true, category: true, userId: true },
      }),
      prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true } }),
    ]);
    const isAdmin = currentUser?.isAdmin ?? false;

    if (!postToDelete) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (!isAdmin && postToDelete.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Soft-delete: isDeleted flag + deletedAt timestamp
    const softDeleteWhere = isAdmin ? { id: params.id } : { id: params.id, userId };

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
