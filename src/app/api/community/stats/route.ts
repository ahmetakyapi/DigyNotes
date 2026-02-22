import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const title = searchParams.get("title");
  const creator = searchParams.get("creator");

  if (!title) return NextResponse.json({ count: 0, avgRating: 0 });

  const posts = await prisma.post.findMany({
    where: {
      title: { equals: title, mode: "insensitive" },
      ...(creator ? { creator: { equals: creator, mode: "insensitive" } } : {}),
      user: { isPublic: true },
    },
    select: { rating: true },
  });

  const count = posts.length;
  const avgRating =
    count > 0 ? Math.round((posts.reduce((s, p) => s + p.rating, 0) / count) * 10) / 10 : 0;

  return NextResponse.json({ count, avgRating });
}
