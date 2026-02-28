import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;

  const { searchParams } = req.nextUrl;
  const title = searchParams.get("title");
  const excludePostId = searchParams.get("excludePostId");

  if (!title) return NextResponse.json([]);

  const posts = await prisma.post.findMany({
    where: {
      title: { equals: title, mode: "insensitive" },
      user: { isPublic: true },
      ...(userId ? { userId: { not: userId } } : {}),
      ...(excludePostId ? { id: { not: excludePostId } } : {}),
    },
    take: 10,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, username: true, avatarUrl: true } },
      tags: { include: { tag: true } },
    },
  });

  const result = posts.map(({ tags, ...rest }) => ({
    ...rest,
    createdAt: rest.createdAt.toISOString(),
    updatedAt: rest.updatedAt.toISOString(),
    tags: tags.map((pt) => pt.tag),
  }));

  return NextResponse.json(result);
}
