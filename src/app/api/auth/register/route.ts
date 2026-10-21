import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { handleApiError, safeParseBody } from "@/lib/api-server";
import { FIXED_CATEGORIES } from "@/lib/categories";
import { prisma } from "@/lib/prisma";
import {
  applyRateLimitHeaders,
  consumeRateLimit,
  createRateLimitErrorResponse,
} from "@/lib/rate-limit";
import { getSiteSetting } from "@/lib/site-settings";
import { isReservedUsername } from "@/lib/usernames";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// The name can't be edited later and shows on every public surface.
const NAME_MAX = 80;
// Same policy as reset-password and the settings password change.
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 128;

export async function POST(request: NextRequest) {
  try {
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

    const fail = (error: string, status: number) =>
      applyRateLimitHeaders(NextResponse.json({ error }, { status }), rateLimit);

    // Check if registration is enabled
    const regSetting = await getSiteSetting("registrationEnabled");
    if (regSetting === "false") {
      return fail("Yeni kayıt şu anda kapalıdır.", 403);
    }

    const body = await safeParseBody<Record<string, unknown>>(request);
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    const cleanUsername =
      typeof body?.username === "string" ? body.username.trim().toLowerCase() : "";

    if (!name || !email || !password || !cleanUsername) {
      return fail("Tüm alanları doldurun.", 400);
    }

    if (name.length > NAME_MAX) {
      return fail(`Ad en fazla ${NAME_MAX} karakter olabilir.`, 400);
    }

    if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
      return fail("Geçerli bir e-posta adresi gir.", 400);
    }

    if (password.length < PASSWORD_MIN) {
      return fail(`Şifre en az ${PASSWORD_MIN} karakter olmalı.`, 400);
    }

    if (password.length > PASSWORD_MAX) {
      return fail(`Şifre en fazla ${PASSWORD_MAX} karakter olabilir.`, 400);
    }

    if (!/^[a-z0-9_]{3,30}$/.test(cleanUsername)) {
      return fail("Kullanıcı adı 3-30 karakter, sadece harf, rakam ve _ içerebilir.", 400);
    }

    if (isReservedUsername(cleanUsername)) {
      return fail("Bu kullanıcı adı kullanılamaz.", 400);
    }

    const existingUsername = await prisma.user.findUnique({
      where: { username: cleanUsername },
      select: { id: true },
    });
    if (existingUsername) {
      return fail("Bu kullanıcı adı zaten alınmış.", 409);
    }

    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) {
      return fail("Bu e-posta adresi zaten kayıtlı.", 409);
    }

    const hashed = await bcrypt.hash(password, 12);

    // One nested write (one transaction): the account never exists without its
    // categories and its activity log entry.
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        username: cleanUsername,
        categories: {
          createMany: {
            data: FIXED_CATEGORIES.map((categoryName) => ({ name: categoryName })),
            skipDuplicates: true,
          },
        },
        activityLogs: {
          create: { action: "user.register", metadata: { name } },
        },
      },
      select: { id: true, name: true, email: true },
    });

    return applyRateLimitHeaders(
      NextResponse.json({ id: user.id, name: user.name, email: user.email }, { status: 201 }),
      rateLimit
    );
  } catch (error) {
    // Two sign-ups racing for the same username or address: the unique index decides.
    if ((error as { code?: string })?.code === "P2002") {
      return NextResponse.json(
        { error: "Bu kullanıcı adı veya e-posta zaten kayıtlı." },
        { status: 409 }
      );
    }
    return handleApiError(error, "Hesap şu anda oluşturulamadı. Lütfen tekrar dene.");
  }
}
