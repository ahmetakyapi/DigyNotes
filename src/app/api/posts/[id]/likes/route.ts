import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const { id: postId } = params;

  const count = await prisma.postLike.count({ where: { postId } });

  let liked = false;
  if (session?.user) {
    const userId = (session.user as { id: string }).id;
    const existing = await prisma.postLike.findUnique({
      where: { postId_userId: { postId, userId } },
    });
    liked = !!existing;
  }

  return NextResponse.json({ count, liked });
}

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Giriş yapmanız gerekiyor" }, { status: 401 });
  }

  const { id: postId } = params;
  const userId = (session.user as { id: string }).id;

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) {
    return NextResponse.json({ error: "Not bulunamadı" }, { status: 404 });
  }

  const existing = await prisma.postLike.findUnique({
    where: { postId_userId: { postId, userId } },
  });

  if (existing) {
    await prisma.postLike.delete({ where: { postId_userId: { postId, userId } } });
    const count = await prisma.postLike.count({ where: { postId } });
    return NextResponse.json({ liked: false, count });
  } else {
    await prisma.postLike.create({ data: { postId, userId } });
    const count = await prisma.postLike.count({ where: { postId } });
    return NextResponse.json({ liked: true, count });
  }
}
