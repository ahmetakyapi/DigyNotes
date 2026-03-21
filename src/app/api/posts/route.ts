import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { transformPostTags, sanitizeRating, sanitizePostContent } from "@/lib/api-utils";
import { getCategoryVariants, normalizeCategory } from "@/lib/categories";
import { prisma } from "@/lib/prisma";
import { buildPostSearchWhere } from "@/lib/search";
import { categorySupportsSpoiler } from "@/lib/post-config";
import {
  consumeRateLimit,
  createRateLimitErrorResponse,
} from "@/lib/rate-limit";

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
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean)
    : [];

  const where: Prisma.PostWhereInput = {};
  where.userId = userId;
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
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      include,
    });

    return NextResponse.json(posts.map(transformPostTags));
  }

  const decodedCursor = decodePostsCursor(cursor);
  const paginatedWhere: Prisma.PostWhereInput = decodedCursor
    ? {
        AND: [
          where,
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
    : where;

  const posts = await prisma.post.findMany({
    where: paginatedWhere,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    include,
  });

  let nextCursor: string | null = null;
  if (posts.length > limit) {
    posts.pop();
    nextCursor = posts[posts.length - 1] ? encodePostsCursor(posts[posts.length - 1]) : null;
  }

  return NextResponse.json({
    items: posts.map(transformPostTags),
    nextCursor,
  });
}

export async function POST(request: NextRequest) {
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

  if (!title || !normalizedCategory || !image || !excerpt || !content) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Input uzunluk kontrolleri
  if (typeof title === "string" && title.length > 500) {
    return NextResponse.json({ error: "Başlık çok uzun (max 500 karakter)" }, { status: 400 });
  }
  if (typeof excerpt === "string" && excerpt.length > 2000) {
    return NextResponse.json({ error: "Özet çok uzun (max 2000 karakter)" }, { status: 400 });
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

  const post = await prisma.post.create({
    data: {
      title: String(title).slice(0, 500),
      category: normalizedCategory,
      image,
      excerpt: String(excerpt).slice(0, 2000),
      content: sanitizedContent,
      creator: creator || null,
      years: years || null,
      rating: sanitizeRating(rating),
      externalRating: typeof externalRating === "number" ? externalRating : null,
      status: status || null,
      hasSpoiler: categorySupportsSpoiler(normalizedCategory) ? Boolean(hasSpoiler) : false,
      lat: typeof lat === "number" ? lat : null,
      lng: typeof lng === "number" ? lng : null,
      imagePosition: imagePosition || "center",
      date: new Date().toLocaleDateString("tr-TR", {
        year: "numeric",
        month: "long",
        day: "numeric",
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
}
