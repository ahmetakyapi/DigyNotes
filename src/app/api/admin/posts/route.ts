import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const user = await prisma.user.findUnique({
    where: { id: (session.user as { id: string }).id },
    select: { isAdmin: true },
  });
  return user?.isAdmin ? (session.user as { id: string }).id : null;
}

export async function GET(request: NextRequest) {
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
        user: { select: { id: true, name: true, username: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.post.count({ where }),
  ]);

  return NextResponse.json({ posts, total, page, totalPages: Math.ceil(total / limit) });
}

export async function DELETE(request: NextRequest) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { postId } = await request.json();
  if (!postId) {
    return NextResponse.json({ error: "postId gerekli" }, { status: 400 });
  }

  await prisma.post.delete({ where: { id: postId } });

  await prisma.activityLog.create({
    data: {
      userId: adminId,
      action: "post.delete",
      metadata: { postId, adminAction: true },
    },
  });

  return NextResponse.json({ success: true });
}
