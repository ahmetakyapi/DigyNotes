import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-server";
import { categorySupportsSpoiler } from "@/lib/post-config";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id;

    const { searchParams } = req.nextUrl;
    const title = searchParams.get("title");
    const excludePostId = searchParams.get("excludePostId");

    if (!title) return NextResponse.json([]);

    const posts = await prisma.post.findMany({
      where: {
        title: { equals: title, mode: "insensitive" },
        user: { isPublic: true, isBanned: false },
        isDraft: false,
        isDeleted: false,
        ...(userId ? { userId: { not: userId } } : {}),
        ...(excludePostId ? { id: { not: excludePostId } } : {}),
      },
      take: 10,
      orderBy: { createdAt: "desc" },
      // Only what the "Diğer Notlar" list on the note page renders: no content HTML.
      select: {
        id: true,
        excerpt: true,
        rating: true,
        category: true,
        hasSpoiler: true,
        createdAt: true,
        user: { select: { id: true, name: true, username: true, avatarUrl: true } },
      },
    });

    // A spoiler note's excerpt is the spoiler itself, so it never leaves the server.
    const result = posts.map((post) => ({
      ...post,
      excerpt: post.hasSpoiler && categorySupportsSpoiler(post.category) ? "" : post.excerpt,
      createdAt: post.createdAt.toISOString(),
    }));

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error, "İlgili notlar yüklenirken bir hata oluştu.");
  }
}
