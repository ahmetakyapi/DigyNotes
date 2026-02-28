import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPostReadAccess } from "@/lib/post-access";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function transformPost(bookmark: {
  createdAt: Date;
  post: {
    id: string;
    title: string;
    category: string;
    image: string;
    excerpt: string;
    content: string;
    creator: string | null;
    years: string | null;
    rating: number;
    externalRating: number | null;
    status: string | null;
    imagePosition: string | null;
    date: string;
    createdAt: Date;
    updatedAt: Date;
    user: {
      id: string;
      name: string;
      username: string | null;
      avatarUrl: string | null;
    } | null;
    tags: { tag: { id: string; name: string } }[];
  };
}) {
  const { post, createdAt } = bookmark;
  return {
    ...post,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
    savedAt: createdAt.toISOString(),
    tags: post.tags.map((entry) => entry.tag),
  };
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const postId = request.nextUrl.searchParams.get("postId");
  const paginate = request.nextUrl.searchParams.get("paginate") === "1";
  const cursor = request.nextUrl.searchParams.get("cursor");
  const limit = Math.min(
    Math.max(parseInt(request.nextUrl.searchParams.get("limit") ?? "12", 10) || 12, 1),
    24
  );
  if (postId) {
    const access = await getPostReadAccess(postId, userId);
    if (!access.post || !access.canRead) {
      return NextResponse.json({ bookmarked: false });
    }

    const bookmark = await prisma.bookmark.findUnique({
      where: { userId_postId: { userId, postId } },
      select: { postId: true },
    });

    return NextResponse.json({ bookmarked: !!bookmark });
  }

  const where = {
    userId,
    OR: [{ post: { userId: null } }, { post: { user: { isPublic: true } } }],
  };

  const include = {
    post: {
      include: {
        tags: { include: { tag: true } },
        user: { select: { id: true, name: true, username: true, avatarUrl: true } },
      },
    },
  };

  if (!paginate) {
    const bookmarks = await prisma.bookmark.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include,
    });

    return NextResponse.json(bookmarks.map(transformPost));
  }

  const bookmarks = await prisma.bookmark.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { postId: "desc" }],
    take: limit + 1,
    ...(cursor
      ? {
          cursor: {
            userId_postId: {
              userId,
              postId: cursor,
            },
          },
          skip: 1,
        }
      : {}),
    include,
  });

  let nextCursor: string | null = null;
  if (bookmarks.length > limit) {
    bookmarks.pop();
    nextCursor = bookmarks[bookmarks.length - 1]?.postId ?? null;
  }

  return NextResponse.json({
    items: bookmarks.map(transformPost),
    nextCursor,
  });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { postId } = await request.json();
  if (!postId || typeof postId !== "string") {
    return NextResponse.json({ error: "postId gerekli" }, { status: 400 });
  }

  const access = await getPostReadAccess(postId, userId);
  const post = access.post;

  if (!post || !access.canRead) {
    return NextResponse.json({ error: "Not bulunamadı" }, { status: 404 });
  }

  if (post.userId === userId) {
    return NextResponse.json({ error: "Kendi notunuzu kaydedemezsiniz" }, { status: 400 });
  }

  await prisma.bookmark.upsert({
    where: { userId_postId: { userId, postId } },
    create: { userId, postId },
    update: {},
  });

  return NextResponse.json({ success: true, bookmarked: true });
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { postId } = await request.json();
  if (!postId || typeof postId !== "string") {
    return NextResponse.json({ error: "postId gerekli" }, { status: 400 });
  }

  await prisma.bookmark.deleteMany({
    where: { userId, postId },
  });

  return NextResponse.json({ success: true, bookmarked: false });
}
