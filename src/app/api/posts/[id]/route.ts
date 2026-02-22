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

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const post = await prisma.post.findUnique({
    where: { id: params.id },
    include: { tags: { include: { tag: true } } },
  });
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }
  return NextResponse.json(transformPostTags(post));
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { title, category, image, excerpt, content, creator, years, rating, status, imagePosition, tags } = body;

  const existing = await prisma.post.findUnique({
    where: { id: params.id },
    select: { id: true, userId: true },
  });

  if (!existing || (existing.userId !== null && existing.userId !== userId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const sanitizedContent = sanitizeHtml(content ?? "", sanitizeConfig);

  const tagNames: string[] = Array.isArray(tags)
    ? tags.map((t: string) => t.toLowerCase().trim()).filter(Boolean).slice(0, 10)
    : [];

  const upsertedTags = await Promise.all(
    tagNames.map((name) =>
      prisma.tag.upsert({ where: { name }, create: { name }, update: {} })
    )
  );

  // Replace all existing tags
  await prisma.postTag.deleteMany({ where: { postId: params.id } });

  const post = await prisma.post.update({
    where: { id: params.id },
    data: {
      title,
      category,
      image,
      excerpt,
      content: sanitizedContent,
      creator,
      years,
      rating,
      status: status || null,
      imagePosition: imagePosition || "center",
      tags: {
        create: upsertedTags.map((tag) => ({ tagId: tag.id })),
      },
    },
    include: { tags: { include: { tag: true } } },
  });

  return NextResponse.json(transformPostTags(post));
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const deleted = await prisma.post.deleteMany({
    where: { id: params.id, userId },
  });

  if (deleted.count === 0) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ success: true });
}
