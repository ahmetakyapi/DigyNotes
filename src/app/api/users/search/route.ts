import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

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

  return NextResponse.json(
    users.map((u) => ({
      id: u.id,
      name: u.name,
      username: u.username,
      bio: u.bio,
      avatarUrl: u.avatarUrl,
      lastSeenAt: u.lastLoginAt?.toISOString() ?? null,
      postCount: u._count.posts,
    }))
  );
}
