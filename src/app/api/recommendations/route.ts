import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-server";
import { getCategoryVariants } from "@/lib/categories";
import {
  buildTasteProfile,
  describeRecommendationReason,
  rankRecommendations,
} from "@/lib/recommendations";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const CANDIDATE_POOL = 200;

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as { id: string }).id;

    // The user's archive is the taste profile: tags (weighted by rating) and category mix.
    const ownNotes = await prisma.post.findMany({
      where: { userId, isDeleted: false },
      select: {
        title: true,
        category: true,
        rating: true,
        tags: { select: { tag: { select: { id: true, name: true } } } },
      },
    });

    if (ownNotes.length === 0) {
      return NextResponse.json([]);
    }

    const profile = buildTasteProfile(
      ownNotes.map((note) => ({
        title: note.title,
        category: note.category,
        rating: note.rating,
        tags: note.tags.map((entry) => entry.tag.name),
      }))
    );
    const ownTagIds = Array.from(
      new Set(ownNotes.flatMap((note) => note.tags.map((entry) => entry.tag.id)))
    );
    const ownCategories = Array.from(
      new Set(ownNotes.flatMap((note) => getCategoryVariants(note.category)))
    );

    // Published notes by other public, non-banned authors that share a tag or a category.
    const candidates = await prisma.post.findMany({
      where: {
        userId: { not: userId },
        user: { isPublic: true, isBanned: false },
        isDeleted: false,
        isDraft: false,
        OR: [
          ...(ownTagIds.length > 0 ? [{ tags: { some: { tagId: { in: ownTagIds } } } }] : []),
          { category: { in: ownCategories } },
        ],
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: CANDIDATE_POOL,
      include: {
        tags: { include: { tag: true } },
        user: { select: { id: true, name: true, username: true, avatarUrl: true } },
      },
    });

    const ranked = rankRecommendations(
      candidates.map((post) => ({
        ...post,
        authorId: post.userId,
        tags: post.tags.map((entry) => entry.tag.name),
        post,
      })),
      profile
    );

    const result = ranked.map(({ candidate, reason }) => {
      const { tags, ...rest } = candidate.post;
      return {
        ...rest,
        createdAt: rest.createdAt.toISOString(),
        updatedAt: rest.updatedAt.toISOString(),
        tags: tags.map((entry) => entry.tag),
        recommendationReason: describeRecommendationReason(reason),
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error, "Öneriler yüklenirken bir hata oluştu.");
  }
}
