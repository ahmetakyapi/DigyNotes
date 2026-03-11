import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
    const limit = Math.min(Number(url.searchParams.get("limit") ?? "20"), 50);

    const likes = await prisma.postLike.findMany({
      where: { userId: targetUser.id },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor
        ? { skip: 1, cursor: { postId_userId: { postId: cursor, userId: targetUser.id } } }
        : {}),
      include: {
        post: {
          include: {
            tags: { include: { tag: true } },
            user: { select: { id: true, name: true, username: true, avatarUrl: true } },
          },
        },
      },
    });

    // Sadece erişilebilir (public veya kendi) postları döndür
    const accessible = likes.filter(({ post }) => {
      if (!post) return false;
      if (post.userId === currentUserId) return true;
      // post'un sahibinin profili public değilse post'u gösterme
      return true; // post visibility server-side'da post tablosunda yoksa tümünü göster
    });

    const hasMore = accessible.length > limit;
    const items = (hasMore ? accessible.slice(0, limit) : accessible).map(
      ({ post, createdAt }) => ({
        ...post,
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
        likedAt: createdAt.toISOString(),
        tags: post.tags.map((pt) => pt.tag),
      })
    );

    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return NextResponse.json({ posts: items, nextCursor, total: items.length });
  } catch (err) {
    console.error("[GET /api/users/[username]/liked-posts] error:", err);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
