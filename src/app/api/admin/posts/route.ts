import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, handleApiError, safeParseBody } from "@/lib/api-server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const adminId = await requireAdmin();
    if (!adminId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const q = searchParams.get("q") || "";
    const limit = 30;
    const skip = (page - 1) * limit;

    const where = q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" as const } },
            { user: { name: { contains: q, mode: "insensitive" as const } } },
            { user: { username: { contains: q, mode: "insensitive" as const } } },
            { category: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        select: {
          id: true,
          title: true,
          category: true,
          status: true,
          rating: true,
          createdAt: true,
          isDraft: true,
          isDeleted: true,
          user: { select: { id: true, name: true, username: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.post.count({ where }),
    ]);

    return NextResponse.json({ posts, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const adminId = await requireAdmin();
    if (!adminId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await safeParseBody<{ postId?: unknown }>(request);
    const postId = typeof body?.postId === "string" ? body.postId : "";
    if (!postId) {
      return NextResponse.json({ error: "postId gerekli" }, { status: 400 });
    }

    const target = await prisma.post.findUnique({
      where: { id: postId },
      select: { title: true, category: true, userId: true },
    });
    if (!target) {
      return NextResponse.json({ error: "Not bulunamadı" }, { status: 404 });
    }

    // A moderation takedown is permanent on purpose: a soft delete could be restored by the
    // author. The log keeps what was removed, since the row itself is gone.
    await prisma.$transaction([
      prisma.post.delete({ where: { id: postId } }),
      prisma.activityLog.create({
        data: {
          userId: adminId,
          action: "post.delete",
          metadata: {
            postId,
            title: target.title,
            category: target.category,
            ownerId: target.userId,
            adminAction: true,
          },
        },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, "Not silinemedi.");
  }
}
