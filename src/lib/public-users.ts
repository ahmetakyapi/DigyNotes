import { prisma } from "@/lib/prisma";

/** Public profiles for Keşfet, most notes first (`/api/users/search` and /discover). */
export async function searchPublicUsers(query?: string | null) {
  const q = query?.trim();
  const users = await prisma.user.findMany({
    where: {
      isPublic: true,
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
      lastLoginAt: true,
      _count: { select: { posts: true } },
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
    lastSeenAt: u.lastLoginAt?.toISOString() ?? null,
    postCount: u._count.posts,
  }));
}
