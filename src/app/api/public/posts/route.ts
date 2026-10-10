import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  decodeCursor,
  encodeCursor,
  getPaginationConfig,
  publicPostInclude,
  publicPostsWhere,
  serializePublicPost,
  type SortOption,
} from "@/lib/public-posts";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const tag = searchParams.get("tag");
  const sort = (searchParams.get("sort") ?? "newest") as SortOption;
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") ?? "20", 10) || 20, 1), 50);
  const offset = Math.max(parseInt(searchParams.get("offset") ?? "0", 10) || 0, 0);
  const paginate = searchParams.get("paginate") === "1";
  const cursor = decodeCursor(searchParams.get("cursor"));

  const { orderBy, cursorWhere } = getPaginationConfig(sort, cursor);
  const where = publicPostsWhere(tag);

  if (cursorWhere) {
    where.AND = [cursorWhere];
  }

  if (!paginate) {
    const posts = await prisma.post.findMany({
      where,
      orderBy,
      take: limit,
      skip: offset,
      include: publicPostInclude,
    });

    return NextResponse.json(posts.map(serializePublicPost));
  }

  const posts = await prisma.post.findMany({
    where,
    orderBy,
    take: limit + 1,
    include: publicPostInclude,
  });

  let nextCursor: string | null = null;
  if (posts.length > limit) {
    posts.pop();
    const lastItem = posts[posts.length - 1];
    nextCursor = lastItem ? encodeCursor(lastItem) : null;
  }

  return NextResponse.json({
    items: posts.map(serializePublicPost),
    nextCursor,
  });
}
