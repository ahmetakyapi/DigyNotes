import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { serializePost } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { buildPostSearchWhere } from "@/lib/search";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

    return NextResponse.json(posts.map(serializePost));
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

  return NextResponse.json(posts.map(serializePost));
}
