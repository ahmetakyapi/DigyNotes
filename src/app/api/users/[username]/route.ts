import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: { username: string } }) {
  const user = await prisma.user.findUnique({
    where: { username: params.username },
    select: {
      id: true,
      name: true,
      username: true,
      bio: true,
      avatarUrl: true,
      isPublic: true,
      createdAt: true,
      posts: {
        orderBy: { createdAt: "desc" },
        include: {
          tags: { include: { tag: true } },
        },
      },
    },
  });

  if (!user || !user.isPublic) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const posts = user.posts.map((post) => ({
    ...post,
    tags: post.tags.map((pt) => pt.tag),
  }));

  const ratings = posts.filter((p) => p.rating > 0).map((p) => p.rating);
  const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      isPublic: user.isPublic,
      createdAt: user.createdAt,
      postCount: posts.length,
      avgRating: Math.round(avgRating * 10) / 10,
    },
    posts,
  });
}
