import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { collectionWithPostsInclude, serializeCollection } from "@/lib/collections";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getOwnedCollection(id: string, userId: string) {
  const collection = await prisma.collection.findUnique({
    where: { id },
    select: { id: true, userId: true },
  });

  if (!collection || collection.userId !== userId) {
    return null;
  }

  return collection;
}

async function getSerializedCollection(id: string) {
  const collection = await prisma.collection.findUnique({
    where: { id },
    include: collectionWithPostsInclude,
  });

  return collection ? serializeCollection(collection) : null;
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const collection = await getOwnedCollection(params.id, userId);

  if (!collection) {
    return NextResponse.json({ error: "Koleksiyon bulunamadı" }, { status: 404 });
  }

  const body = await req.json();
  const postId = typeof body.postId === "string" ? body.postId.trim() : "";

  if (!postId) {
    return NextResponse.json({ error: "Not seçilmedi" }, { status: 400 });
  }

  const post = await prisma.post.findFirst({
    where: {
      id: postId,
      userId,
    },
    select: { id: true },
  });

  if (!post) {
    return NextResponse.json(
      { error: "Koleksiyona sadece kendi notlarınızı ekleyebilirsiniz" },
      { status: 400 }
    );
  }

  const currentMax = await prisma.collectionPost.aggregate({
    where: { collectionId: params.id },
    _max: { position: true },
  });

  await prisma.collectionPost.upsert({
    where: {
      collectionId_postId: {
        collectionId: params.id,
        postId,
      },
    },
    create: {
      collectionId: params.id,
      postId,
      position: (currentMax._max.position ?? -1) + 1,
    },
    update: {},
  });

  const serialized = await getSerializedCollection(params.id);

  return NextResponse.json(serialized);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const collection = await getOwnedCollection(params.id, userId);

  if (!collection) {
    return NextResponse.json({ error: "Koleksiyon bulunamadı" }, { status: 404 });
  }

  const body = await req.json();
  const postId = typeof body.postId === "string" ? body.postId.trim() : "";

  if (!postId) {
    return NextResponse.json({ error: "Not seçilmedi" }, { status: 400 });
  }

  await prisma.collectionPost.deleteMany({
    where: {
      collectionId: params.id,
      postId,
    },
  });

  const serialized = await getSerializedCollection(params.id);

  return NextResponse.json(serialized);
}
