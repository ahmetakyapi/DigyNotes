import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: { username: string } }) {
  try {
    const user = await prisma.user.findUnique({
      where: { username: params.username },
      select: { id: true, isPublic: true },
    });

    if (!user || !user.isPublic) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const follows = await prisma.follow.findMany({
      where: { followerId: user.id },
      include: {
        following: {
          select: {
            id: true,
            name: true,
            username: true,
            bio: true,
            avatarUrl: true,
            _count: { select: { posts: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const users = follows.map((f) => ({
      id: f.following.id,
      name: f.following.name ?? "",
      username: f.following.username,
      bio: f.following.bio,
      avatarUrl: f.following.avatarUrl,
      postCount: f.following._count.posts,
    }));

    return NextResponse.json({ users });
  } catch (err) {
    console.error("[GET /api/users/[username]/following]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
