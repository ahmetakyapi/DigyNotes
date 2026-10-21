import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId, handleApiError } from "@/lib/api-server";
import { resolveProfileAccess } from "@/lib/profile-data";

/* FollowListModal has no paging; the cap keeps a popular profile from loading everyone. */
const FOLLOW_LIST_LIMIT = 200;

export async function GET(_req: NextRequest, { params }: { params: { username: string } }) {
  try {
    const currentUserId = await getSessionUserId();
    /* Same rule as the profile page: a private profile's lists open for its owner and admins. */
    const access = await resolveProfileAccess(params.username, currentUserId);
    if (!access) {
      return NextResponse.json({ error: "Profil bulunamadı." }, { status: 404 });
    }
    if (!access.canView) {
      return NextResponse.json({ error: "Bu profil gizli." }, { status: 403 });
    }
    const { user } = access;

    const follows = await prisma.follow.findMany({
      where: { followingId: user.id },
      include: {
        follower: {
          select: {
            id: true,
            name: true,
            username: true,
            bio: true,
            avatarUrl: true,
            isPublic: true,
            _count: { select: { posts: { where: { isDeleted: false, isDraft: false } } } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: FOLLOW_LIST_LIMIT,
    });

    /* A private follower shows what their own private card shows: no bio, no count. */
    const users = follows.map((f) => ({
      id: f.follower.id,
      name: f.follower.name ?? "",
      username: f.follower.username,
      bio: f.follower.isPublic ? f.follower.bio : null,
      avatarUrl: f.follower.avatarUrl,
      postCount: f.follower.isPublic ? f.follower._count.posts : null,
    }));

    const followedIds =
      currentUserId && users.length > 0
        ? new Set(
            (
              await prisma.follow.findMany({
                where: {
                  followerId: currentUserId,
                  followingId: { in: users.map((entry) => entry.id) },
                },
                select: { followingId: true },
              })
            ).map((entry) => entry.followingId)
          )
        : new Set<string>();

    return NextResponse.json({
      users: users.map((entry) => ({
        ...entry,
        isSelf: entry.id === currentUserId,
        isFollowing: currentUserId ? followedIds.has(entry.id) : false,
      })),
    });
  } catch (err) {
    return handleApiError(err, "Takipçiler yüklenemedi.");
  }
}
