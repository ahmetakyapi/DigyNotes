import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest, { params }: { params: { username: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const currentUserId = session?.user ? (session.user as { id: string }).id : null;

    // Hedef kullanıcıyı bul
    const targetUser = await prisma.user.findUnique({
      where: { username: params.username },
      select: { id: true, isPublic: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
    }

    // Gizli profil kontrolü: sadece kendi profilini veya admin görebilir
    const currentUserRecord = currentUserId
      ? await prisma.user.findUnique({
          where: { id: currentUserId },
          select: { id: true, isAdmin: true },
        })
      : null;

    const canView =
      targetUser.isPublic ||
      currentUserRecord?.id === targetUser.id ||
      currentUserRecord?.isAdmin === true;

    if (!canView) {
      return NextResponse.json({ error: "Profil gizli" }, { status: 403 });
    }

    // cursor-based pagination
    const url = new URL(req.url);
    const cursor = url.searchParams.get("cursor") ?? undefined;
    const parsedLimit = Number.parseInt(url.searchParams.get("limit") ?? "", 10);
    const limit = Math.min(Math.max(Number.isFinite(parsedLimit) ? parsedLimit : 20, 1), 50);

    /* Visibility lives in the query (so hasMore and the cursor stay right) and mirrors
       canReadPost: a like outlives its note being trashed, turned back into a draft or
       its author going private, and the tab must not keep showing it. Drafts and
       trashed notes never appear on this public tab, not even for admins. */
    const visiblePost: Prisma.PostWhereInput = {
      isDeleted: false,
      isDraft: false,
      ...(currentUserRecord?.isAdmin
        ? {}
        : {
            OR: [
              { userId: null },
              { user: { isPublic: true } },
              ...(currentUserId ? [{ userId: currentUserId }] : []),
            ],
          }),
    };

    const likes = await prisma.postLike.findMany({
      where: { userId: targetUser.id, post: visiblePost },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor
        ? { skip: 1, cursor: { postId_userId: { postId: cursor, userId: targetUser.id } } }
        : {}),
      include: {
        post: {
          /* The card never renders the note body. */
          omit: { content: true },
          include: {
            tags: { include: { tag: true } },
            user: { select: { id: true, name: true, username: true, avatarUrl: true } },
          },
        },
      },
    });

    const hasMore = likes.length > limit;
    const items = (hasMore ? likes.slice(0, limit) : likes).map(({ post, createdAt }) => ({
      ...post,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
      likedAt: createdAt.toISOString(),
      tags: post.tags.map((pt) => pt.tag),
    }));

    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return NextResponse.json({ posts: items, nextCursor, total: items.length });
  } catch (err) {
    return handleApiError(err, "Beğenilen notlar yüklenemedi.");
  }
}
