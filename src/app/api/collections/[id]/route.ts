import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { collectionWithPostsInclude, serializeCollection } from "@/lib/collections";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const TITLE_MAX_LENGTH = 80;
const DESCRIPTION_MAX_LENGTH = 400;

async function getCollection(id: string) {
  return prisma.collection.findUnique({
    where: { id },
    include: collectionWithPostsInclude,
  });
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const viewerId = (session?.user as { id?: string; isAdmin?: boolean } | undefined)?.id;
  const isAdmin = Boolean(
    (session?.user as { id?: string; isAdmin?: boolean } | undefined)?.isAdmin
  );

  const collection = await getCollection(params.id);

  if (!collection) {
    return NextResponse.json({ error: "Koleksiyon bulunamadı" }, { status: 404 });
  }

  const isOwner = viewerId === collection.userId;
  const canRead = isOwner || isAdmin || collection.user.isPublic;

  if (!canRead) {
    return NextResponse.json({ error: "Koleksiyon bulunamadı" }, { status: 404 });
  }

  return NextResponse.json({
    collection: serializeCollection(collection),
    isOwner,
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.collection.findUnique({
    where: { id: params.id },
    select: { id: true, userId: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Koleksiyon bulunamadı" }, { status: 404 });
  }

  if (existing.userId !== userId) {
    return NextResponse.json({ error: "Bu işlem için yetkiniz yok" }, { status: 403 });
  }

  const body = await req.json();
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description =
    typeof body.description === "string"
      ? body.description.trim().slice(0, DESCRIPTION_MAX_LENGTH)
      : "";

  if (!title) {
    return NextResponse.json({ error: "Koleksiyon başlığı gerekli" }, { status: 400 });
  }

  if (title.length > TITLE_MAX_LENGTH) {
    return NextResponse.json({ error: "Koleksiyon başlığı çok uzun" }, { status: 400 });
  }

  const collection = await prisma.collection.update({
    where: { id: params.id },
    data: {
      title,
      description: description || null,
    },
    include: collectionWithPostsInclude,
  });

  return NextResponse.json(serializeCollection(collection));
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.collection.findUnique({
    where: { id: params.id },
    select: { id: true, userId: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Koleksiyon bulunamadı" }, { status: 404 });
  }

  if (existing.userId !== userId) {
    return NextResponse.json({ error: "Bu işlem için yetkiniz yok" }, { status: 403 });
  }

  await prisma.collection.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}
