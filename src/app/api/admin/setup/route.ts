import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Tek seferlik setup: hiç admin yoksa oturum açık kullanıcıyı admin yapar
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Giriş yapmalısın" }, { status: 401 });
  }

  const existingAdmin = await prisma.user.findFirst({ where: { isAdmin: true } });
  if (existingAdmin) {
    return NextResponse.json({ error: "Zaten bir admin var" }, { status: 403 });
  }

  const userId = (session.user as { id: string }).id;
  const user = await prisma.user.update({
    where: { id: userId },
    data: { isAdmin: true },
    select: { id: true, name: true, email: true, isAdmin: true },
  });

  return NextResponse.json({ success: true, user });
}
