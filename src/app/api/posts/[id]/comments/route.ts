import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id: postId } = params;

  const comments = await prisma.comment.findMany({
    where: { postId },
    include: {
      user: { select: { id: true, name: true, username: true, avatarUrl: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(comments);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Giriş yapmanız gerekiyor" }, { status: 401 });
  }

  const { id: postId } = params;
  const { content } = await req.json();

  if (!content?.trim()) {
    return NextResponse.json({ error: "Yorum boş olamaz" }, { status: 400 });
  }

  if (content.trim().length > 1000) {
    return NextResponse.json({ error: "Yorum 1000 karakterden uzun olamaz" }, { status: 400 });
  }

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) {
    return NextResponse.json({ error: "Not bulunamadı" }, { status: 404 });
  }

  const userId = (session.user as { id: string }).id;

  const comment = await prisma.comment.create({
    data: {
      content: content.trim(),
      postId,
      userId,
    },
    include: {
      user: { select: { id: true, name: true, username: true, avatarUrl: true } },
    },
  });

  return NextResponse.json(comment, { status: 201 });
}
