import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import sanitizeHtml from "sanitize-html";

const sanitizeConfig: sanitizeHtml.IOptions = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img", "h1", "h2"]),
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    img: ["src", "alt", "width", "height"],
    "*": ["class"],
  },
};

function transformPostTags(
  post: { tags: { tag: { id: string; name: string } }[] } & Record<string, unknown>
) {
  const { tags, ...rest } = post;
  return { ...rest, tags: tags.map((pt) => pt.tag) };
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const tagsParam = searchParams.get("tags");
  const tagNames = tagsParam
    ? tagsParam
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean)
    : [];

  const where: Record<string, unknown> = {};
  if (userId) where.userId = userId;
  if (category) where.category = category;
  if (tagNames.length > 0) {
    where.tags = { some: { tag: { name: { in: tagNames } } } };
  }

  const posts = await prisma.post.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { tags: { include: { tag: true } } },
  });

  return NextResponse.json(posts.map(transformPostTags));
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    title,
    category,
    image,
    excerpt,
    content,
    creator,
    years,
    rating,
    status,
    imagePosition,
    tags,
    externalRating,
  } = body;

  if (!title || !category || !image || !excerpt || !content) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const sanitizedContent = sanitizeHtml(content ?? "", sanitizeConfig);

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
      title,
      category,
      image,
      excerpt,
      content: sanitizedContent,
      creator: creator || null,
      years: years || null,
      rating: rating ?? 0,
      externalRating: typeof externalRating === "number" ? externalRating : null,
      status: status || null,
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
    data: { userId, action: "post.create", metadata: { postId: post.id, title: post.title, category: post.category } },
  });

  return NextResponse.json(transformPostTags(post), { status: 201 });
}
