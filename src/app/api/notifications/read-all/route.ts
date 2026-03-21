import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleApiError } from "@/lib/api-server";

export async function POST() {
  try {
    const [userId, authError] = await requireAuth();
    if (authError) return authError;

    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, "Bildirimler okundu olarak işaretlenemedi.");
  }
}
