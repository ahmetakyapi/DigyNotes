import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SortOption = "newest" | "oldest" | "rating";

interface PublicPostsCursor {
  id: string;
  createdAt: string;
  rating: number;
}

function encodeCursor(post: { id: string; createdAt: Date; rating: number }) {
  return Buffer.from(
    JSON.stringify({
      id: post.id,
      createdAt: post.createdAt.toISOString(),
      rating: post.rating,
    })
  ).toString("base64url");
}

function decodeCursor(value: string | null): PublicPostsCursor | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as PublicPostsCursor;
    if (
      typeof parsed.id !== "string" ||
      typeof parsed.createdAt !== "string" ||
      typeof parsed.rating !== "number"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function getPaginationConfig(sort: SortOption, cursor: PublicPostsCursor | null) {
  if (sort === "rating") {
    return {
      orderBy: [
        { rating: "desc" },
        { createdAt: "desc" },
        { id: "desc" },
      ] satisfies Prisma.PostOrderByWithRelationInput[],
      cursorWhere: cursor
        ? ({
            OR: [
              { rating: { lt: cursor.rating } },
              { rating: cursor.rating, createdAt: { lt: new Date(cursor.createdAt) } },
              {
                rating: cursor.rating,
                createdAt: new Date(cursor.createdAt),
                id: { lt: cursor.id },
              },
            ],
          } satisfies Prisma.PostWhereInput)
        : undefined,
    };
  }

  if (sort === "oldest") {
    return {
      orderBy: [{ createdAt: "asc" }, { id: "asc" }] satisfies Prisma.PostOrderByWithRelationInput[],
      cursorWhere: cursor
        ? ({
            OR: [
              { createdAt: { gt: new Date(cursor.createdAt) } },
              { createdAt: new Date(cursor.createdAt), id: { gt: cursor.id } },
            ],
          } satisfies Prisma.PostWhereInput)
        : undefined,
    };
  }

  return {
    orderBy: [{ createdAt: "desc" }, { id: "desc" }] satisfies Prisma.PostOrderByWithRelationInput[],
    cursorWhere: cursor
      ? ({
          OR: [
            { createdAt: { lt: new Date(cursor.createdAt) } },
            { createdAt: new Date(cursor.createdAt), id: { lt: cursor.id } },
          ],
        } satisfies Prisma.PostWhereInput)
      : undefined,
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const tag = searchParams.get("tag");
  const sort = (searchParams.get("sort") ?? "newest") as SortOption;
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") ?? "20", 10) || 20, 1), 50);
  const offset = Math.max(parseInt(searchParams.get("offset") ?? "0", 10) || 0, 0);
  const paginate = searchParams.get("paginate") === "1";
  const cursor = decodeCursor(searchParams.get("cursor"));

  const { orderBy, cursorWhere } = getPaginationConfig(sort, cursor);
  const where: Prisma.PostWhereInput = {
    user: { isPublic: true },
    ...(tag
      ? {
          tags: {
            some: {
              tag: { name: { equals: tag.toLowerCase(), mode: "insensitive" } },
            },
          },
        }
      : {}),
  };

  if (cursorWhere) {
    where.AND = [cursorWhere];
  }

  if (!paginate) {
    const posts = await prisma.post.findMany({
      where,
      orderBy,
      take: limit,
      skip: offset,
      include: {
        tags: { include: { tag: true } },
        user: { select: { id: true, name: true, username: true, avatarUrl: true } },
      },
    });

    const result = posts.map(({ tags, ...rest }) => ({
      ...rest,
      createdAt: rest.createdAt.toISOString(),
      updatedAt: rest.updatedAt.toISOString(),
      tags: tags.map((pt) => pt.tag),
    }));

    return NextResponse.json(result);
  }

  const posts = await prisma.post.findMany({
    where,
    orderBy,
    take: limit + 1,
    include: {
      tags: { include: { tag: true } },
      user: { select: { id: true, name: true, username: true, avatarUrl: true } },
    },
  });

  const result = posts.map(({ tags, ...rest }) => ({
    ...rest,
    createdAt: rest.createdAt.toISOString(),
    updatedAt: rest.updatedAt.toISOString(),
    tags: tags.map((pt) => pt.tag),
  }));

  let nextCursor: string | null = null;
  if (posts.length > limit) {
    posts.pop();
    const lastItem = posts[posts.length - 1];
    nextCursor = lastItem ? encodeCursor(lastItem) : null;
  }

  return NextResponse.json({
    items: posts.map(({ tags, ...rest }) => ({
      ...rest,
      createdAt: rest.createdAt.toISOString(),
      updatedAt: rest.updatedAt.toISOString(),
      tags: tags.map((pt) => pt.tag),
    })),
    nextCursor,
  });
}
