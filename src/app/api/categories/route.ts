import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { FIXED_CATEGORIES, normalizeCategory } from "@/lib/categories";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;

  if (userId) {
    const existingCategories = await prisma.category.findMany({
      where: { userId },
      select: { name: true },
    });
    const existingNames = new Set(existingCategories.map((category) => category.name));
    const missingCategories = FIXED_CATEGORIES.filter((name) => !existingNames.has(name));

    if (missingCategories.length > 0) {
      await prisma.category.createMany({
        data: missingCategories.map((name) => ({ name, userId })),
        skipDuplicates: true,
      });
    }
  }

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
  const normalizedName = normalizeCategory(name);

  if (!normalizedName) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  let category;
  try {
    category = await prisma.category.create({
      data: { name: normalizedName, userId },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Category already exists" }, { status: 409 });
    }

    throw error;
  }

  await prisma.activityLog.create({
    data: {
      userId,
      action: "category.create",
      metadata: { categoryId: category.id, name: category.name },
    },
  });

  return NextResponse.json(category, { status: 201 });
}
