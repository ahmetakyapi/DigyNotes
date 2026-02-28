import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; commentId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Giriş yapmanız gerekiyor" }, { status: 401 });
  }

  const { commentId } = params;
  const userId = (session.user as { id: string }).id;

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { id: true, userId: true, postId: true },
  });
  if (!comment) {
    return NextResponse.json({ error: "Yorum bulunamadı" }, { status: 404 });
  }

  if (comment.postId !== params.id) {
    return NextResponse.json({ error: "Yorum bulunamadı" }, { status: 404 });
  }

  if (comment.userId !== userId) {
    return NextResponse.json({ error: "Bu yorumu silme yetkiniz yok" }, { status: 403 });
  }

  await prisma.comment.delete({ where: { id: commentId } });

  return NextResponse.json({ success: true });
}
