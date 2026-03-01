import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
}
