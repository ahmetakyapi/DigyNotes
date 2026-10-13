import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError, requireAuth } from "@/lib/api-server";

/* The comment's author, or the note's owner moderating their own note. Replies go
   with it (onDelete: Cascade). */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; commentId: string } }
) {
  try {
    const [userId, authError] = await requireAuth();
    if (authError) return authError;

    const { commentId } = params;
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true, userId: true, postId: true, post: { select: { userId: true } } },
    });

    if (!comment || comment.postId !== params.id) {
      return NextResponse.json({ error: "Yorum bulunamadı" }, { status: 404 });
    }

    if (comment.userId !== userId && comment.post.userId !== userId) {
      return NextResponse.json({ error: "Bu yorumu silme yetkiniz yok" }, { status: 403 });
    }

    await prisma.comment.delete({ where: { id: commentId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, "Yorum silinemedi.");
  }
}
