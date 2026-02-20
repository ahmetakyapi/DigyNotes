import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;

  const categories = await prisma.category.findMany({
    where: userId ? { userId } : { userId: null },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(categories);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name } = await request.json();

  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const existing = await prisma.category.findFirst({
    where: { name: name.trim(), userId },
  });

  if (existing) {
    return NextResponse.json({ error: "Category already exists" }, { status: 409 });
  }

  const category = await prisma.category.create({
    data: { name: name.trim(), userId },
  });
  return NextResponse.json(category, { status: 201 });
}
