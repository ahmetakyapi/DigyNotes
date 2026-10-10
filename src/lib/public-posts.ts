import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { normalizeTagName } from "@/lib/text";

/* Public notes (published, author profile public): `/api/public/posts` and the
   server-rendered tag and discover pages read them through here. */

export type SortOption = "newest" | "oldest" | "rating";

interface PublicPostsCursor {
  id: string;
  createdAt: string;
  rating: number;
}

export function encodeCursor(post: { id: string; createdAt: Date; rating: number }) {
  return Buffer.from(
    JSON.stringify({
      id: post.id,
      createdAt: post.createdAt.toISOString(),
      rating: post.rating,
    })
  ).toString("base64url");
}

export function decodeCursor(value: string | null): PublicPostsCursor | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8")
    ) as PublicPostsCursor;
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

export function getPaginationConfig(sort: SortOption, cursor: PublicPostsCursor | null) {
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
      orderBy: [
        { createdAt: "asc" },
        { id: "asc" },
      ] satisfies Prisma.PostOrderByWithRelationInput[],
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
    orderBy: [
      { createdAt: "desc" },
      { id: "desc" },
    ] satisfies Prisma.PostOrderByWithRelationInput[],
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

export function publicPostsWhere(tag?: string | null): Prisma.PostWhereInput {
  return {
    user: { isPublic: true },
    isDeleted: false,
    isDraft: false,
    ...(tag
      ? {
          tags: {
            some: {
              tag: { name: { equals: normalizeTagName(tag), mode: "insensitive" } },
            },
          },
        }
      : {}),
  };
}

export const publicPostInclude = {
  tags: { include: { tag: true } },
  user: { select: { id: true, name: true, username: true, avatarUrl: true } },
} satisfies Prisma.PostInclude;

export function serializePublicPost(
  post: Prisma.PostGetPayload<{ include: typeof publicPostInclude }>
) {
  const { tags, ...rest } = post;
  return {
    ...rest,
    createdAt: rest.createdAt.toISOString(),
    updatedAt: rest.updatedAt.toISOString(),
    tags: tags.map((pt) => pt.tag),
  };
}

/** First page of public notes, same shape as the API's non-paginated response. */
export async function listPublicPosts(options: {
  tag?: string | null;
  sort?: SortOption;
  limit: number;
}) {
  const { orderBy } = getPaginationConfig(options.sort ?? "newest", null);
  const posts = await prisma.post.findMany({
    where: publicPostsWhere(options.tag),
    orderBy,
    take: options.limit,
    include: publicPostInclude,
  });
  return posts.map(serializePublicPost);
}
