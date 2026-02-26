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

export async function POST(request: NextRequest) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { action, userIds } = body as { action: string; userIds: string[] };

  if (!action || !Array.isArray(userIds) || userIds.length === 0) {
    return NextResponse.json({ error: "action ve userIds gerekli" }, { status: 400 });
  }

  // Prevent acting on self
  const safeIds = userIds.filter((id) => id !== adminId);
  if (safeIds.length === 0) {
    return NextResponse.json({ error: "Kendi hesabın üzerinde toplu işlem yapılamaz" }, { status: 400 });
  }

  if (action === "ban") {
    await prisma.user.updateMany({
      where: { id: { in: safeIds } },
      data: { isBanned: true },
    });
    return NextResponse.json({ success: true, affected: safeIds.length });
  }

  if (action === "unban") {
    await prisma.user.updateMany({
      where: { id: { in: safeIds } },
      data: { isBanned: false },
    });
    return NextResponse.json({ success: true, affected: safeIds.length });
  }

  if (action === "delete") {
    await prisma.user.deleteMany({
      where: { id: { in: safeIds } },
    });
    return NextResponse.json({ success: true, affected: safeIds.length });
  }

  return NextResponse.json({ error: "Geçersiz işlem" }, { status: 400 });
}
