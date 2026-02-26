import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const { name, email, password, username } = await request.json();

  if (!name?.trim() || !email?.trim() || !password || !username?.trim()) {
    return NextResponse.json({ error: "Tüm alanları doldurun." }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: "Şifre en az 6 karakter olmalı." }, { status: 400 });
  }

  const cleanUsername = username.trim().toLowerCase();

  if (!/^[a-z0-9_]{3,30}$/.test(cleanUsername)) {
    return NextResponse.json(
      { error: "Kullanıcı adı 3-30 karakter, sadece harf, rakam ve _ içerebilir." },
      { status: 400 }
    );
  }

  const existingUsername = await prisma.user.findUnique({ where: { username: cleanUsername } });
  if (existingUsername) {
    return NextResponse.json({ error: "Bu kullanıcı adı zaten alınmış." }, { status: 409 });
  }

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    return NextResponse.json({ error: "Bu e-posta adresi zaten kayıtlı." }, { status: 409 });
  }

  const hashed = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: { name: name.trim(), email: email.toLowerCase(), password: hashed, username: cleanUsername },
  });

  await prisma.category.createMany({
    data: [
      { name: "Film", userId: user.id },
      { name: "Dizi", userId: user.id },
      { name: "Kitap", userId: user.id },
    ],
  });

  await prisma.activityLog.create({
    data: { userId: user.id, action: "user.register", metadata: { name: user.name, email: user.email } },
  });

  return NextResponse.json({ id: user.id, name: user.name, email: user.email }, { status: 201 });
}
