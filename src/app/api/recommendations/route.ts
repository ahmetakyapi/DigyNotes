import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
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

/* Candidate pools the ranking picks 12 from: tag matches first, category-only matches after. */
const TAG_POOL = 200;
const CATEGORY_POOL = 100;

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

    /* Published notes by other public, non-banned authors. Two pools: notes that share a
       tag, and notes that only share a category. One OR query ordered by date was in
       effect "the newest notes of the site" (almost every note shares a category), so an
       older note with your exact tags never reached the ranking. */
    const candidateBase = {
      userId: { not: userId },
      user: { isPublic: true, isBanned: false },
      isDeleted: false,
      isDraft: false,
    } satisfies Prisma.PostWhereInput;
    const candidateInclude = {
      tags: { include: { tag: true } },
      user: { select: { id: true, name: true, username: true, avatarUrl: true } },
    } satisfies Prisma.PostInclude;
    const candidateOrder: Prisma.PostOrderByWithRelationInput[] = [
      { createdAt: "desc" },
      { id: "desc" },
    ];

    const [tagPool, categoryPool] = await Promise.all([
      ownTagIds.length > 0
        ? prisma.post.findMany({
            where: { ...candidateBase, tags: { some: { tagId: { in: ownTagIds } } } },
            orderBy: candidateOrder,
            take: TAG_POOL,
            include: candidateInclude,
          })
        : Promise.resolve([]),
      prisma.post.findMany({
        where: {
          ...candidateBase,
          category: { in: ownCategories },
          ...(ownTagIds.length > 0
            ? { NOT: { tags: { some: { tagId: { in: ownTagIds } } } } }
            : {}),
        },
        orderBy: candidateOrder,
        take: CATEGORY_POOL,
        include: candidateInclude,
      }),
    ]);
    const candidates = [...tagPool, ...categoryPool];

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
