import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError, safeParseBody } from "@/lib/api-server";
import { createPasswordResetToken } from "@/lib/password-reset";
import { sendPasswordResetEmail } from "@/lib/email";
import { consumeRateLimit, createRateLimitErrorResponse } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const WINDOW_MS = 15 * 60_000;
const RATE_LIMIT_MESSAGE = "Çok fazla deneme yaptın. Lütfen 15 dakika sonra tekrar dene.";
// Same answer whether or not the address has an account (no user enumeration).
const SENT_MESSAGE = "Bu adrese kayıtlı bir hesap varsa şifre sıfırlama bağlantısı gönderdik.";
// Same answer time too: sending the mail takes a Resend round trip, an unknown address
// none, so every accepted request takes at least this long.
const MIN_RESPONSE_MS = 1000;

export async function POST(request: NextRequest) {
  try {
    const ipLimit = await consumeRateLimit({
      action: "auth-forgot-password",
      req: request,
      limit: 5,
      windowMs: WINDOW_MS,
    });
    if (!ipLimit.success) return createRateLimitErrorResponse(ipLimit, RATE_LIMIT_MESSAGE);

    const body = await safeParseBody<{ email?: unknown }>(request);
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email || email.length > 254 || !EMAIL_PATTERN.test(email)) {
      return NextResponse.json({ error: "Geçerli bir e-posta adresi gir." }, { status: 400 });
    }

    // Keyed by address so one inbox can't be flooded from many IPs.
    const emailLimit = await consumeRateLimit({
      action: "auth-forgot-password-email",
      req: request,
      userId: `email:${email}`,
      limit: 5,
      windowMs: WINDOW_MS,
    });
    if (!emailLimit.success) return createRateLimitErrorResponse(emailLimit, RATE_LIMIT_MESSAGE);

    const startedAt = Date.now();

    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      console.error("[forgot-password] NEXTAUTH_SECRET is not set");
      return NextResponse.json(
        { error: "Şu anda bağlantı gönderilemiyor. Lütfen daha sonra tekrar dene." },
        { status: 500 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, password: true, isBanned: true },
    });

    if (user && !user.isBanned) {
      const token = createPasswordResetToken({
        userId: user.id,
        passwordHash: user.password,
        secret,
      });
      await sendPasswordResetEmail({ to: user.email, name: user.name, token });
    }

    const remaining = MIN_RESPONSE_MS - (Date.now() - startedAt);
    if (remaining > 0) {
      await new Promise((resolve) => setTimeout(resolve, remaining + Math.random() * 150));
    }

    return NextResponse.json({ ok: true, message: SENT_MESSAGE });
  } catch (error) {
    return handleApiError(error, "Şu anda bağlantı gönderilemiyor. Lütfen daha sonra tekrar dene.");
  }
}
