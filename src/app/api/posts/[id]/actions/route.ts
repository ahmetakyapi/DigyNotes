import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const ALLOWED_ACTIONS = ["pin", "unpin", "archive", "unarchive", "restore"] as const;
type PostAction = (typeof ALLOWED_ACTIONS)[number];

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as { id: string }).id;

    const body = await request.json();
    const action = body.action as PostAction;

    if (!ALLOWED_ACTIONS.includes(action)) {
      return NextResponse.json({ error: "Geçersiz işlem" }, { status: 400 });
    }

    const post = await prisma.post.findUnique({
      where: { id: params.id },
      select: { id: true, userId: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Not bulunamadı" }, { status: 404 });
    }

    if (post.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const dataMap: Record<PostAction, Record<string, unknown>> = {
      pin: { isPinned: true },
      unpin: { isPinned: false },
      archive: { isArchived: true },
      unarchive: { isArchived: false },
      restore: { isDeleted: false, deletedAt: null },
    };

    await prisma.post.update({
      where: { id: params.id },
      data: dataMap[action],
    });

    return NextResponse.json({ success: true, action });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[POST /api/posts/[id]/actions] error:", error);
    }
    return NextResponse.json({ error: "Bir hata oluştu" }, { status: 500 });
  }
}
