import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  transformPostTags,
  sanitizeRating,
  sanitizePostContent,
  sanitizeStringField,
} from "@/lib/api-utils";
import { getCategoryVariants, normalizeCategory } from "@/lib/categories";
import { prisma } from "@/lib/prisma";
import { buildPostSearchWhere } from "@/lib/search";
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
import { normalizeTagName, stripHtml } from "@/lib/text";
import { cleanTagName, TAG_LIMIT } from "@/lib/tag-input";
import { getIstanbulMonthStart } from "@/lib/number-format";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function encodePostsCursor(post: { createdAt: Date; id: string }) {
  return Buffer.from(
    JSON.stringify({
      createdAt: post.createdAt.toISOString(),
      id: post.id,
    })
  ).toString("base64url");
}

function decodePostsCursor(cursor?: string | null) {
  if (!cursor) return null;

  try {
    const parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as {
      createdAt?: string;
      id?: string;
    };

    if (!parsed.createdAt || !parsed.id) return null;

    const createdAt = new Date(parsed.createdAt);
    if (Number.isNaN(createdAt.getTime())) return null;

    return { createdAt, id: parsed.id };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const tagsParam = searchParams.get("tags");
    const query = searchParams.get("q");
    const paginate = searchParams.get("paginate") === "1";
    const cursor = searchParams.get("cursor");
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") ?? "12", 10) || 12, 1), 24);
    const tagNames = tagsParam
      ? tagsParam
          .split(",")
          .map((t) => normalizeTagName(t))
          .filter(Boolean)
      : [];

    const where: Prisma.PostWhereInput = {};
    where.userId = userId;
    where.isDeleted = false;

    const draftsOnly = searchParams.get("drafts") === "1";
    const archivedOnly = searchParams.get("archived") === "1";
    if (draftsOnly) {
      where.isDraft = true;
    } else if (archivedOnly) {
      where.isArchived = true;
    } else {
      where.isDraft = false;
      where.isArchived = false;
    }
    const categoryVariants = getCategoryVariants(category);
    if (categoryVariants.length > 0) {
      where.category = { in: categoryVariants };
    }
    Object.assign(where, buildPostSearchWhere(query ?? undefined));
    if (tagNames.length > 0) {
      where.tags = { some: { tag: { name: { in: tagNames } } } };
    }

    const include = { tags: { include: { tag: true } } };

    if (!paginate) {
      const posts = await prisma.post.findMany({
        where,
        orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }, { id: "desc" }],
        include,
        // Unpaged callers (category page, collection picker) never read the note HTML.
        omit: { content: true },
      });

      return NextResponse.json(posts.map(transformPostTags));
    }

    /* Pinned notes lead the main list, as the "Sabitle" button promises (?pinned=first):
       the first page carries every pinned match, the date-ordered cursor stream skips them.
       The pinned read has no `take`: the stream never returns a pinned note, so a cap
       would hide every pinned note past it from /notes for good. */
    const pinnedFirst = !draftsOnly && !archivedOnly && searchParams.get("pinned") === "first";
    const streamWhere: Prisma.PostWhereInput = pinnedFirst
      ? { AND: [where, { isPinned: false }] }
      : where;

    const decodedCursor = decodePostsCursor(cursor);
    const paginatedWhere: Prisma.PostWhereInput = decodedCursor
      ? {
          AND: [
            streamWhere,
            {
              OR: [
                { createdAt: { lt: decodedCursor.createdAt } },
                {
                  AND: [{ createdAt: decodedCursor.createdAt }, { id: { lt: decodedCursor.id } }],
                },
              ],
            },
          ],
        }
      : streamWhere;

    // The header numbers describe the whole list, not the loaded page (?summary=1, first page).
    const wantsSummary = !decodedCursor && searchParams.get("summary") === "1";

    const [pinned, posts, summary] = await Promise.all([
      pinnedFirst && !decodedCursor
        ? prisma.post.findMany({
            where: { AND: [where, { isPinned: true }] },
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            include,
          })
        : Promise.resolve([]),
      prisma.post.findMany({
        where: paginatedWhere,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: limit + 1,
        include,
      }),
      wantsSummary
        ? Promise.all([
            prisma.post.count({ where }),
            prisma.post.aggregate({
              where: { AND: [where, { rating: { gt: 0 } }] },
              _avg: { rating: true },
            }),
            prisma.post.count({
              where: { AND: [where, { createdAt: { gte: getIstanbulMonthStart() } }] },
            }),
          ]).then(([total, ratingAggregate, thisMonth]) => ({
            total,
            avgRating: Math.round((ratingAggregate._avg.rating ?? 0) * 10) / 10,
            thisMonth,
          }))
        : Promise.resolve(null),
    ]);

    let nextCursor: string | null = null;
    if (posts.length > limit) {
      posts.pop();
      nextCursor = posts[posts.length - 1] ? encodePostsCursor(posts[posts.length - 1]) : null;
    }

    return NextResponse.json({
      items: [...pinned, ...posts].map(transformPostTags),
      nextCursor,
      ...(summary ? { summary } : {}),
    });
  } catch (error) {
    return handleApiError(error, "Notlar yüklenirken bir hata oluştu.");
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimit = await consumeRateLimit({
      action: "post-create",
      req: request,
      userId,
      limit: 20,
      windowMs: 10 * 60_000,
    });
    if (!rateLimit.success) {
      return createRateLimitErrorResponse(
        rateLimit,
        "Çok fazla not oluşturdunuz. Lütfen biraz sonra tekrar deneyin."
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

    // Yalnızca başlık, kategori ve içerik zorunlu; kapak, yaratıcı ve yıl sonradan eklenebilir.
    const sanitizedContent = sanitizePostContent(typeof content === "string" ? content : "");
    const missing = getMissingPostFields({
      title: typeof title === "string" ? title : "",
      category: normalizedCategory,
      hasContent: hasMeaningfulContent(sanitizedContent),
    });
    if (missing.length > 0) {
      return NextResponse.json({ error: formatMissingFieldsMessage(missing) }, { status: 400 });
    }

    // Input uzunluk kontrolleri
    if (typeof title === "string" && title.length > 500) {
      return NextResponse.json({ error: "Başlık çok uzun (max 500 karakter)" }, { status: 400 });
    }
    if (typeof excerpt === "string" && excerpt.length > 2000) {
      return NextResponse.json({ error: "Özet çok uzun (max 2000 karakter)" }, { status: 400 });
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

    const post = await prisma.post.create({
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
        date: new Date().toLocaleDateString("tr-TR", {
          year: "numeric",
          month: "long",
          day: "numeric",
          timeZone: "Europe/Istanbul",
        }),
        userId,
        tags: {
          create: upsertedTags.map((tag) => ({ tagId: tag.id })),
        },
      },
      include: { tags: { include: { tag: true } } },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: "post.create",
        metadata: { postId: post.id, title: post.title, category: post.category },
      },
    });

    return NextResponse.json(transformPostTags(post), { status: 201 });
  } catch (error) {
    return handleApiError(error, "Not oluşturulurken bir hata oluştu.");
  }
}
