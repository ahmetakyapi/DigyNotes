import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.toLowerCase().trim();

  const tags = await prisma.tag.findMany({
    where: q ? { name: { contains: q } } : undefined,
    include: {
      _count: { select: { posts: true } },
    },
    orderBy: { posts: { _count: "desc" } },
    take: 20,
  });

  return NextResponse.json(
    tags.map((t) => ({ id: t.id, name: t.name, count: t._count.posts }))
  );
}
