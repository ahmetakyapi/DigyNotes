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
      return NextResponse.json(
        { error: "Kendi hesabın üzerinde toplu işlem yapılamaz" },
        { status: 400 }
      );
    }

    if (action === "ban" || action === "unban") {
      const isBanned = action === "ban";
      // Interactive transaction: the audit entry needs the count, and a failed log write
      // must roll the change back instead of reporting an applied change as failed.
      const result = await prisma.$transaction(async (tx) => {
        const updated = await tx.user.updateMany({
          where: { id: { in: safeIds } },
          data: { isBanned },
        });
        await tx.activityLog.create({
          data: {
            userId: adminId,
            action: "user.update",
            metadata: {
              targetUserIds: safeIds,
              count: updated.count,
              changes: { isBanned },
              adminAction: true,
            },
          },
        });
        return updated;
      });
      return NextResponse.json({ success: true, affected: result.count });
    }

    if (action === "delete") {
      // The accounts' own logs hold their name, e-mail and note titles, so they go too;
      // the audit entry keeps only ids.
      const [, result] = await prisma.$transaction([
        prisma.activityLog.deleteMany({ where: { userId: { in: safeIds } } }),
        prisma.user.deleteMany({ where: { id: { in: safeIds } } }),
        prisma.activityLog.create({
          data: {
            userId: adminId,
            action: "user.delete",
            metadata: { targetUserIds: safeIds, adminAction: true },
          },
        }),
      ]);
      return NextResponse.json({ success: true, affected: result.count });
    }

    return NextResponse.json({ error: "Geçersiz işlem" }, { status: 400 });
  } catch (error) {
    return handleApiError(error);
  }
}
