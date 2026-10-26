import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPostReadAccess } from "@/lib/post-access";
import { handleApiError, requireAuth } from "@/lib/api-server";
import { COMMENT_USER_SELECT } from "@/lib/comments";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const MAX_SUGGESTIONS = 6;

/* `@` suggestions for the comment composer: people in this conversation first (the
   note's author, then recent commenters), then people the viewer follows, then other
   public profiles matching `q` (username or name). The viewer is never suggested. */
export async function GET(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  const params = await paramsPromise;
  try {
    const [userId, authError] = await requireAuth();
    if (authError) return authError;

    const access = await getPostReadAccess(params.id, userId);
    if (!access.post || !access.canRead) {
      return NextResponse.json({ error: "Not bulunamadı" }, { status: 404 });
    }

    const q = (req.nextUrl.searchParams.get("q") ?? "").trim().replace(/^@/, "").slice(0, 30);
    const matchesQuery = q
      ? {
          OR: [
            { username: { startsWith: q, mode: "insensitive" as const } },
            { name: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [commenters, following] = await Promise.all([
      prisma.comment.findMany({
        where: { postId: params.id },
        select: { userId: true },
        distinct: ["userId"],
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.follow.findMany({
        where: { followerId: userId },
        select: { followingId: true },
        orderBy: { createdAt: "desc" },
        take: 500,
      }),
    ]);

    /* Lower rank = shown first. */
    const rank = new Map<string, number>();
    const addRank = (id: string | null, value: number) => {
      if (id && id !== userId && !rank.has(id)) rank.set(id, value);
    };
    addRank(access.post.userId, 0);
    commenters.forEach((row, index) => addRank(row.userId, 1 + index / 1000));
    following.forEach((row) => addRank(row.followingId, 2));

    /* No `take`: the id list is already bounded (author + 100 commenters + 500 follows)
       and the ranking has to see all of them. */
    const close =
      rank.size > 0
        ? await prisma.user.findMany({
            where: { id: { in: Array.from(rank.keys()) }, isBanned: false, ...matchesQuery },
            select: COMMENT_USER_SELECT,
          })
        : [];
    close.sort(
      (a, b) => (rank.get(a.id) ?? 9) - (rank.get(b.id) ?? 9) || a.name.localeCompare(b.name, "tr")
    );

    const users = close.slice(0, MAX_SUGGESTIONS);
    if (q && users.length < MAX_SUGGESTIONS) {
      const others = await prisma.user.findMany({
        where: {
          isPublic: true,
          isBanned: false,
          id: { notIn: [userId, ...users.map((user) => user.id)] },
          ...matchesQuery,
        },
        select: COMMENT_USER_SELECT,
        orderBy: { username: "asc" },
        take: MAX_SUGGESTIONS - users.length,
      });
      users.push(...others);
    }

    return NextResponse.json({ users });
  } catch (error) {
    return handleApiError(error, "Kişiler yüklenemedi.");
  }
}
