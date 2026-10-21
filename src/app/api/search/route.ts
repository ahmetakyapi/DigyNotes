import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { serializePost } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { publicPostsWhere } from "@/lib/public-posts";
import { buildPostSearchWhere } from "@/lib/search";
import { handleApiError } from "@/lib/api-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id;
    const q = request.nextUrl.searchParams.get("q");
    const scope = request.nextUrl.searchParams.get("scope") ?? "me";
    const parsedLimit = Number.parseInt(request.nextUrl.searchParams.get("limit") ?? "20", 10);
    const limit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 50) : 20;

    if (!q?.trim() || q.length > 500) {
      return NextResponse.json([]);
    }

    if (scope === "public") {
      const posts = await prisma.post.findMany({
        // Published notes of public authors only: never drafts or trashed notes.
        where: {
          AND: [publicPostsWhere(), buildPostSearchWhere(q, { includeUserFields: true })],
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
        isDeleted: false,
        ...buildPostSearchWhere(q),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        tags: { include: { tag: true } },
      },
    });

    return NextResponse.json(posts.map(serializePost));
  } catch (error) {
    return handleApiError(error, "Arama yapılırken bir hata oluştu.");
  }
}
