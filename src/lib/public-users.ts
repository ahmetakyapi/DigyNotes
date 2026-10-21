import { prisma } from "@/lib/prisma";

const publishedNote = { isDeleted: false, isDraft: false } as const;

/**
 * Public profiles for Keşfet, most notes first (`/api/users/search` and /discover).
 * Counts only published notes (drafts and trashed notes used to inflate "34 Not"), and
 * `lastNoteAt` is the newest of them: the exact last sign-in time was shown to anyone
 * and said little about the archive.
 */
export async function searchPublicUsers(query?: string | null) {
  const q = query?.trim();
  const users = await prisma.user.findMany({
    where: {
      isPublic: true,
      isBanned: false,
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { username: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      name: true,
      username: true,
      bio: true,
      avatarUrl: true,
      _count: { select: { posts: { where: publishedNote } } },
      posts: {
        where: publishedNote,
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true },
      },
    },
    orderBy: { posts: { _count: "desc" } },
    take: 30,
  });

  return users.map((u) => ({
    id: u.id,
    name: u.name,
    username: u.username,
    bio: u.bio,
    avatarUrl: u.avatarUrl,
    lastNoteAt: u.posts[0]?.createdAt.toISOString() ?? null,
    postCount: u._count.posts,
  }));
}

/** Every public profile Keşfet can list; `searchPublicUsers` returns at most 30 of them. */
export function countPublicUsers() {
  return prisma.user.count({ where: { isPublic: true, isBanned: false } });
}
