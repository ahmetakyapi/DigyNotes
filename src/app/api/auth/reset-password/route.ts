import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { handleApiError, safeParseBody } from "@/lib/api-server";
import { verifyPasswordResetToken } from "@/lib/password-reset";
import { consumeRateLimit, createRateLimitErrorResponse } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const INVALID_LINK = "Bağlantının süresi dolmuş ya da geçersiz. Yeni bir bağlantı iste.";

async function getActivePasswordHash(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { password: true, isBanned: true },
  });
  return user && !user.isBanned ? user.password : null;
}

/**
 * GET ?token=… — lets the reset page show "link expired" before the user types a
 * password. Answers only valid/invalid, never who the token belongs to.
 */
export async function GET(request: NextRequest) {
  try {
    const rateLimit = await consumeRateLimit({
      action: "auth-reset-password-check",
      req: request,
      limit: 30,
      windowMs: 15 * 60_000,
    });
    if (!rateLimit.success) {
      return createRateLimitErrorResponse(rateLimit, "Çok fazla deneme yaptın. Biraz sonra dene.");
    }

    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) return NextResponse.json({ valid: false });

    const result = await verifyPasswordResetToken(request.nextUrl.searchParams.get("token"), {
      secret,
      getPasswordHash: getActivePasswordHash,
    });
    return NextResponse.json({ valid: result.ok });
  } catch (error) {
    return handleApiError(error, "Bağlantı kontrol edilemedi. Lütfen tekrar dene.");
  }
}

export async function POST(request: NextRequest) {
  try {
    const rateLimit = await consumeRateLimit({
      action: "auth-reset-password",
      req: request,
      limit: 10,
      windowMs: 15 * 60_000,
    });
    if (!rateLimit.success) {
      return createRateLimitErrorResponse(
        rateLimit,
        "Çok fazla deneme yaptın. Lütfen 15 dakika sonra tekrar dene."
      );
    }

    const body = await safeParseBody<{ token?: unknown; password?: unknown }>(request);
    const password = typeof body?.password === "string" ? body.password : "";

    if (!body?.token || !password) {
      return NextResponse.json({ error: "Yeni şifre gereklidir." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Yeni şifre en az 8 karakter olmalıdır." },
        { status: 400 }
      );
    }
    if (password.length > 128) {
      return NextResponse.json(
        { error: "Yeni şifre en fazla 128 karakter olabilir." },
        { status: 400 }
      );
    }

    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      console.error("[reset-password] NEXTAUTH_SECRET is not set");
      return NextResponse.json({ error: INVALID_LINK }, { status: 400 });
    }

    const lookup: { hash: string | null } = { hash: null };
    const result = await verifyPasswordResetToken(body.token, {
      secret,
      getPasswordHash: async (userId) => (lookup.hash = await getActivePasswordHash(userId)),
    });
    if (!result.ok || !lookup.hash) {
      return NextResponse.json({ error: INVALID_LINK }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    // Conditional on the hash the token was signed over, so two parallel requests with
    // the same link can't both succeed.
    const updated = await prisma.user.updateMany({
      where: { id: result.userId, password: lookup.hash },
      // lastLogoutAt mirrors sign-out: the reset ends the account's earlier sessions.
      data: { password: hashedPassword, lastLogoutAt: new Date() },
    });
    if (updated.count === 0) {
      return NextResponse.json({ error: INVALID_LINK }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: result.userId },
      select: { email: true },
    });

    await prisma.activityLog.create({
      data: { userId: result.userId, action: "user.password_reset", metadata: {} },
    });

    return NextResponse.json({ ok: true, email: user?.email ?? null });
  } catch (error) {
    return handleApiError(error, "Şifre şu anda güncellenemedi. Lütfen tekrar dene.");
  }
}
