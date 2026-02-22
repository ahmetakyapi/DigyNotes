import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
      bio: true,
      avatarUrl: true,
      isPublic: true,
      createdAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { username, bio, avatarUrl, isPublic } = body;

  if (username !== undefined && username !== null && username !== "") {
    const usernameRegex = /^[a-z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        {
          error:
            "Kullanıcı adı 3-20 karakter, yalnızca küçük harf, rakam veya alt çizgi içerebilir",
        },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findFirst({
      where: { username, id: { not: userId } },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Bu kullanıcı adı zaten kullanılıyor" },
        { status: 409 }
      );
    }
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      username: username === "" ? null : username,
      bio: bio === "" ? null : bio,
      avatarUrl: avatarUrl === "" ? null : avatarUrl,
      isPublic: typeof isPublic === "boolean" ? isPublic : undefined,
    },
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
      bio: true,
      avatarUrl: true,
      isPublic: true,
      createdAt: true,
    },
  });

  return NextResponse.json(updated);
}
