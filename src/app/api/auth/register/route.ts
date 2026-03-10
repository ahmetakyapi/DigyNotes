import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { FIXED_CATEGORIES } from "@/lib/categories";
import { prisma } from "@/lib/prisma";
import {
  applyRateLimitHeaders,
  consumeRateLimit,
  createRateLimitErrorResponse,
} from "@/lib/rate-limit";
import { getSiteSetting } from "@/lib/site-settings";

export async function POST(request: NextRequest) {
  const rateLimit = await consumeRateLimit({
    action: "auth-register",
    req: request,
    limit: 5,
    windowMs: 10 * 60_000,
  });

  if (!rateLimit.success) {
    return createRateLimitErrorResponse(
      rateLimit,
      "Çok fazla kayıt denemesi yaptınız. Lütfen biraz sonra tekrar deneyin."
    );
  }

  // Check if registration is enabled
  const regSetting = await getSiteSetting("registrationEnabled");
  if (regSetting === "false") {
    return applyRateLimitHeaders(
      NextResponse.json({ error: "Yeni kayıt şu anda kapalıdır." }, { status: 403 }),
      rateLimit
    );
  }

  const { name, email, password, username } = await request.json();

  if (!name?.trim() || !email?.trim() || !password || !username?.trim()) {
    return applyRateLimitHeaders(
      NextResponse.json({ error: "Tüm alanları doldurun." }, { status: 400 }),
      rateLimit
    );
  }

  if (password.length < 6) {
    return applyRateLimitHeaders(
      NextResponse.json({ error: "Şifre en az 6 karakter olmalı." }, { status: 400 }),
      rateLimit
    );
  }

  const cleanUsername = username.trim().toLowerCase();

  if (!/^[a-z0-9_]{3,30}$/.test(cleanUsername)) {
    return applyRateLimitHeaders(
      NextResponse.json(
        { error: "Kullanıcı adı 3-30 karakter, sadece harf, rakam ve _ içerebilir." },
        { status: 400 }
      ),
      rateLimit
    );
  }

  const existingUsername = await prisma.user.findUnique({ where: { username: cleanUsername } });
  if (existingUsername) {
    return applyRateLimitHeaders(
      NextResponse.json({ error: "Bu kullanıcı adı zaten alınmış." }, { status: 409 }),
      rateLimit
    );
  }

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    return applyRateLimitHeaders(
      NextResponse.json({ error: "Bu e-posta adresi zaten kayıtlı." }, { status: 409 }),
      rateLimit
    );
  }

  const hashed = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: email.toLowerCase(),
      password: hashed,
      username: cleanUsername,
    },
  });

  await prisma.category.createMany({
    data: FIXED_CATEGORIES.map((name) => ({ name, userId: user.id })),
    skipDuplicates: true,
  });

  await prisma.activityLog.create({
    data: {
      userId: user.id,
      action: "user.register",
      metadata: { name: user.name, email: user.email },
    },
  });

  return applyRateLimitHeaders(
    NextResponse.json({ id: user.id, name: user.name, email: user.email }, { status: 201 }),
    rateLimit
  );
}
