/**
 * Server-only API yardımcıları
 * Next.js / NextAuth / Prisma bağımlılıkları olan fonksiyonlar.
 * Test edilemeyen (side-effect'li) yardımcılar burada yaşar.
 */

import { cache } from "react";
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

// İsteğin kendisinin yol açabileceği Prisma kodları. Diğerleri (P1xxx bağlantı,
// P2021/P2022 şema farkı, …) sunucu hatasıdır ve 500 döner.
const CLIENT_PRISMA_STATUS: Record<string, number> = { P2002: 400, P2003: 400, P2025: 404 };

/**
 * API route'larında yakalanan hataları tutarlı JSON yanıtına çevirir.
 * Hatayı her ortamda sunucu loguna yazar (Vercel function logs); istemci yalnızca
 * genel Türkçe mesajı görür.
 */
export function handleApiError(
  error: unknown,
  fallbackMessage = "Bir hata oluştu. Lütfen tekrar deneyin."
) {
  // Next's own control-flow signals (dynamic usage during build, redirect(), notFound())
  // must reach the framework, not turn into a logged 500.
  if (isNextInternalError(error)) throw error;

  console.error("[API Error]", error);

  if (isKnownPrismaError(error)) {
    const status = CLIENT_PRISMA_STATUS[error.code];
    if (status) {
      return NextResponse.json({ error: getPrismaErrorMessage(error) }, { status });
    }
  }

  return NextResponse.json({ error: fallbackMessage }, { status: 500 });
}

// ── Auth helpers ────────────────────────────────────────────────────

/**
 * Oturumu sunucu render'ı başına bir kez çözer: layout, generateMetadata ve sayfa aynı
 * sonucu paylaşır (session callback'i her çağrıda veritabanına gider). Route
 * handler'larda React cache kapsamı yoktur, her çağrı doğrudan çalışır.
 */
export const getServerAuthSession = cache(() => getServerSession(authOptions));

/**
 * Oturum kontrolü yaparak kullanıcı ID'sini döner.
 * Oturum yoksa null döner.
 */
export async function getSessionUserId(): Promise<string | null> {
  const session = await getServerAuthSession();
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
  const session = await getServerAuthSession();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return null;

  const { prisma } = await import("@/lib/prisma");
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isAdmin: true },
  });

  return user?.isAdmin ? userId : null;
}

// ── Next.js internal errors ─────────────────────────────────────────

function isNextInternalError(error: unknown) {
  const digest =
    typeof error === "object" && error !== null && "digest" in error
      ? (error as { digest?: unknown }).digest
      : undefined;
  return (
    typeof digest === "string" && (digest === "DYNAMIC_SERVER_USAGE" || digest.startsWith("NEXT_"))
  );
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
