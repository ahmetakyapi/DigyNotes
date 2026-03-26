/**
 * Server-only API yardımcıları
 * Next.js / NextAuth / Prisma bağımlılıkları olan fonksiyonlar.
 * Test edilemeyen (side-effect'li) yardımcılar burada yaşar.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// ── Request body parsing ────────────────────────────────────────────

/**
 * Request body'yi güvenli şekilde parse eder.
 * JSON parse hatası veya boş body durumunda null döner.
 */
export async function safeParseBody<T = Record<string, unknown>>(
  request: Request
): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

// ── Error handling ──────────────────────────────────────────────────

/**
 * API route'larında yakalanan hataları tutarlı JSON yanıtına çevirir.
 * Geliştirme ortamında hatayı konsola yazar.
 */
export function handleApiError(
  error: unknown,
  fallbackMessage = "Bir hata oluştu. Lütfen tekrar deneyin."
) {
  if (process.env.NODE_ENV === "development") {
    console.error("[API Error]", error);
  }

  const status = isKnownPrismaError(error) ? 400 : 500;
  const message = isKnownPrismaError(error) ? getPrismaErrorMessage(error) : fallbackMessage;

  return NextResponse.json({ error: message }, { status });
}

// ── Auth helpers ────────────────────────────────────────────────────

/**
 * Oturum kontrolü yaparak kullanıcı ID'sini döner.
 * Oturum yoksa null döner.
 */
export async function getSessionUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return (session?.user as { id?: string })?.id ?? null;
}

/**
 * Oturum kontrolü ile birlikte 401 yanıtı döner.
 * Kullanım: `const [userId, errorResponse] = await requireAuth();`
 */
export async function requireAuth(): Promise<[string, null] | [null, NextResponse]> {
  const userId = await getSessionUserId();
  if (!userId) {
    return [null, NextResponse.json({ error: "Unauthorized" }, { status: 401 })];
  }
  return [userId, null];
}

// ── Admin auth helper ────────────────────────────────────────────────

/**
 * Admin yetki kontrolü.
 * Admin ise userId döner, değilse null.
 */
export async function requireAdmin(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  const userId = (session.user as { id: string }).id;
  const { prisma } = await import("@/lib/prisma");
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isAdmin: true },
  });

  return user?.isAdmin ? userId : null;
}

// ── Prisma error helpers ────────────────────────────────────────────

type PrismaKnownError = {
  code: string;
  meta?: { target?: string[] };
};

function isKnownPrismaError(error: unknown): error is PrismaKnownError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as PrismaKnownError).code === "string" &&
    (error as PrismaKnownError).code.startsWith("P")
  );
}

function getPrismaErrorMessage(error: PrismaKnownError): string {
  switch (error.code) {
    case "P2002":
      return "Bu kayıt zaten mevcut.";
    case "P2025":
      return "İlgili kayıt bulunamadı.";
    case "P2003":
      return "İlişkili kayıt bulunamadı.";
    default:
      return "Veritabanı işlemi sırasında bir hata oluştu.";
  }
}
