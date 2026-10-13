import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sanitizeRating, sanitizePostContent } from "@/lib/api-utils";
import { normalizeCategory } from "@/lib/categories";
import { prisma } from "@/lib/prisma";
import { getPostDetail } from "@/lib/post-detail";
import { categorySupportsSpoiler } from "@/lib/post-config";
import { handleApiError, safeParseBody } from "@/lib/api-server";
import {
  formatMissingFieldsMessage,
  getMissingPostFields,
  hasMeaningfulContent,
  optionalString,
} from "@/lib/post-form";
import { consumeRateLimit, createRateLimitErrorResponse } from "@/lib/rate-limit";
import { normalizeTagName, stripHtml } from "@/lib/text";

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

    if (!existing || (!isAdmin && existing.userId !== null && existing.userId !== userId)) {
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
    const safeExcerpt =
      typeof excerpt === "string" && excerpt.trim() ? excerpt : stripHtml(sanitizedContent);

    const tagNames: string[] = Array.isArray(tags)
      ? tags
          .filter((t): t is string => typeof t === "string")
          .map((t) => normalizeTagName(t))
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
        title: String(title).trim().slice(0, 500),
        category: normalizedCategory,
        image: typeof image === "string" ? image.trim() : "",
        excerpt: safeExcerpt.slice(0, 2000),
        content: sanitizedContent,
        creator: optionalString(creator),
        years: optionalString(years),
        rating: sanitizeRating(rating),
        externalRating: typeof externalRating === "number" ? externalRating : null,
        status: optionalString(status),
        hasSpoiler: categorySupportsSpoiler(normalizedCategory) ? Boolean(hasSpoiler) : false,
        lat: typeof lat === "number" ? lat : null,
        lng: typeof lng === "number" ? lng : null,
        imagePosition: optionalString(imagePosition) ?? "center",
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

    return NextResponse.json(post);
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

    if (!isAdmin && postToDelete.userId !== null && postToDelete.userId !== userId) {
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
