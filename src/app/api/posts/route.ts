import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");

  const posts = await prisma.post.findMany({
    where: category ? { category } : undefined,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(posts);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title, category, image, excerpt, content, creator, years, rating } = body;

  if (!title || !category || !image || !excerpt || !content) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const post = await prisma.post.create({
    data: {
      title,
      category,
      image,
      excerpt,
      content,
      creator: creator || null,
      years: years || null,
      rating: rating ?? 0,
      date: new Date().toLocaleDateString("tr-TR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    },
  });

  return NextResponse.json(post, { status: 201 });
}
