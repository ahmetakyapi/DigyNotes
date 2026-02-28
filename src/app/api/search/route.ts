import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildPostSearchWhere } from "@/lib/search";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function transformPost(
  post: {
    createdAt: Date;
    updatedAt: Date;
    tags: { tag: { id: string; name: string } }[];
    user?: {
      id: string;
      name: string;
      username: string | null;
      avatarUrl: string | null;
    } | null;
  } & Record<string, unknown>
) {
  const { tags, ...rest } = post;
  return {
    ...rest,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
    user: post.user ?? undefined,
    tags: tags.map((entry) => entry.tag),
  };
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  const q = request.nextUrl.searchParams.get("q");
  const scope = request.nextUrl.searchParams.get("scope") ?? "me";
  const limit = Math.min(parseInt(request.nextUrl.searchParams.get("limit") ?? "20", 10), 50);

  if (!q?.trim()) {
    return NextResponse.json([]);
  }

  if (scope === "public") {
    const posts = await prisma.post.findMany({
      where: {
        user: { isPublic: true },
        ...buildPostSearchWhere(q, { includeUserFields: true }),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        tags: { include: { tag: true } },
        user: { select: { id: true, name: true, username: true, avatarUrl: true } },
      },
    });

    return NextResponse.json(posts.map(transformPost));
  }

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const posts = await prisma.post.findMany({
    where: {
      userId,
      ...buildPostSearchWhere(q),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      tags: { include: { tag: true } },
    },
  });

  return NextResponse.json(posts.map(transformPost));
}
