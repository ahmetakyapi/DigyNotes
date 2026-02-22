import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const tag = searchParams.get("tag");
  const sort = searchParams.get("sort") ?? "newest";
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50);
  const offset = parseInt(searchParams.get("offset") ?? "0");

  const orderBy =
    sort === "rating"
      ? { rating: "desc" as const }
      : sort === "oldest"
        ? { createdAt: "asc" as const }
        : { createdAt: "desc" as const };

  const posts = await prisma.post.findMany({
    where: {
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
    },
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
