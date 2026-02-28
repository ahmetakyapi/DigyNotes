import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const item = await prisma.wishlist.findUnique({
    where: { id: params.id },
    select: { id: true, userId: true },
  });

  if (!item || item.userId !== userId) {
    return NextResponse.json({ error: "Watchlist kaydı bulunamadı" }, { status: 404 });
  }

  await prisma.wishlist.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}
