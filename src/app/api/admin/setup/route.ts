import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import {
  applyRateLimitHeaders,
  consumeRateLimit,
  createRateLimitErrorResponse,
} from "@/lib/rate-limit";

// Tek seferlik setup: hiç admin yoksa oturum açık kullanıcıyı admin yapar
export async function POST() {
  const requestHeaders = await headers();
  const forwardedFor = requestHeaders.get("x-forwarded-for");
  const host = requestHeaders.get("host") ?? "";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  const request = new Request(`${protocol}://${host || "localhost"}/api/admin/setup`, {
    headers: forwardedFor ? { "x-forwarded-for": forwardedFor } : undefined,
  });
  const rateLimit = await consumeRateLimit({
    action: "admin-bootstrap",
    req: request,
    limit: 3,
    windowMs: 10 * 60_000,
  });

  if (!rateLimit.success) {
    return createRateLimitErrorResponse(
      rateLimit,
      "Çok fazla admin kurulum denemesi yaptınız. Lütfen biraz sonra tekrar deneyin."
    );
  }

  const bootstrapEnabled =
    process.env.ENABLE_ADMIN_BOOTSTRAP === "true" || process.env.NODE_ENV !== "production";

  if (!bootstrapEnabled) {
    return applyRateLimitHeaders(
      NextResponse.json({ error: "Admin kurulumu bu ortamda devre dışı." }, { status: 403 }),
      rateLimit
    );
  }

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return applyRateLimitHeaders(
      NextResponse.json({ error: "Giriş yapmalısın" }, { status: 401 }),
      rateLimit
    );
  }

  const existingAdmin = await prisma.user.findFirst({ where: { isAdmin: true } });
  if (existingAdmin) {
    return applyRateLimitHeaders(
      NextResponse.json({ error: "Zaten bir admin var" }, { status: 403 }),
      rateLimit
    );
  }

  const userId = (session.user as { id: string }).id;
  const user = await prisma.user.update({
    where: { id: userId },
    data: { isAdmin: true },
    select: { id: true, name: true, email: true, isAdmin: true },
  });

  return applyRateLimitHeaders(NextResponse.json({ success: true, user }), rateLimit);
}
