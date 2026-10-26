import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleApiError } from "@/lib/api-server";

export async function POST(
  _req: Request,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  const params = await paramsPromise;
  try {
    const [userId, authError] = await requireAuth();
    if (authError) return authError;

    const notification = await prisma.notification.findFirst({
      where: {
        id: params.id,
        userId,
      },
      select: {
        id: true,
        read: true,
      },
    });

    if (!notification) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    if (!notification.read) {
      await prisma.notification.update({
        where: { id: notification.id },
        data: { read: true },
      });
    }

    return NextResponse.json({ success: true, read: true });
  } catch (error) {
    return handleApiError(error, "Bildirim okundu olarak işaretlenemedi.");
  }
}
