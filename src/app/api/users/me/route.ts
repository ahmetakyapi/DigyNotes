import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-server";
import { consumeRateLimit, createRateLimitErrorResponse } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
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
        isAdmin: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    return handleApiError(error, "Kullanıcı bilgileri alınamadı.");
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit: 10 requests per 5 minutes
    const rl = await consumeRateLimit({
      action: "profile-update",
      req: request,
      userId,
      limit: 10,
      windowMs: 5 * 60_000,
    });
    if (!rl.success) {
      return createRateLimitErrorResponse(rl, "Çok fazla güncelleme denemesi. Lütfen bekleyin.");
    }

    const body = await request.json();
    const { username, bio, avatarUrl, isPublic } = body;
    const normalizedUsername =
      typeof username === "string" ? username.trim().toLowerCase() : undefined;
    const normalizedBio = typeof bio === "string" ? bio.trim() : undefined;
    const normalizedAvatarUrl = typeof avatarUrl === "string" ? avatarUrl.trim() : undefined;

    // avatarUrl validation: HTTPS only, max 2000 chars
    if (normalizedAvatarUrl) {
      if (normalizedAvatarUrl.length > 2000) {
        return NextResponse.json({ error: "Avatar URL çok uzun (maks 2000 karakter)." }, { status: 400 });
      }
      try {
        const parsed = new URL(normalizedAvatarUrl);
        if (parsed.protocol !== "https:") {
          return NextResponse.json({ error: "Avatar URL yalnızca HTTPS olabilir." }, { status: 400 });
        }
      } catch {
        return NextResponse.json({ error: "Geçersiz avatar URL." }, { status: 400 });
      }
    }

    if (normalizedUsername !== undefined) {
      if (!normalizedUsername) {
        return NextResponse.json({ error: "Kullanıcı adı boş bırakılamaz" }, { status: 400 });
      }

      const usernameRegex = /^[a-z0-9_]{3,20}$/;
      if (!usernameRegex.test(normalizedUsername)) {
        return NextResponse.json(
          {
            error:
              "Kullanıcı adı 3-20 karakter, yalnızca küçük harf, rakam veya alt çizgi içerebilir",
          },
          { status: 400 }
        );
      }

      const existing = await prisma.user.findFirst({
        where: { username: normalizedUsername, id: { not: userId } },
      });

      if (existing) {
        return NextResponse.json({ error: "Bu kullanıcı adı zaten kullanılıyor" }, { status: 409 });
      }
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(normalizedUsername !== undefined ? { username: normalizedUsername } : {}),
        bio: normalizedBio === undefined ? undefined : normalizedBio || null,
        avatarUrl: normalizedAvatarUrl === undefined ? undefined : normalizedAvatarUrl || null,
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
  } catch (error) {
    return handleApiError(error, "Profil güncellenemedi.");
  }
}
