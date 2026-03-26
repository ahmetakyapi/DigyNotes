import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, handleApiError } from "@/lib/api-server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const adminId = await requireAdmin();
    if (!adminId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { action, userIds } = body as { action: string; userIds: string[] };

    if (!action || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: "action ve userIds gerekli" }, { status: 400 });
    }

    if (userIds.length > 100) {
      return NextResponse.json(
        { error: "Tek seferde en fazla 100 kullanıcı üzerinde işlem yapılabilir" },
        { status: 400 }
      );
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
  } catch (error) {
    return handleApiError(error);
  }
}
