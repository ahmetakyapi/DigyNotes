import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, safeParseBody } from "@/lib/api-server";
import { consumeRateLimit, createRateLimitErrorResponse } from "@/lib/rate-limit";
import { isReservedUsername } from "@/lib/usernames";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/* Same limit as the settings page counter; the bio shows on Keşfet cards and follow lists. */
const BIO_MAX_LENGTH = 200;

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

    const body = await safeParseBody<{
      username?: unknown;
      bio?: unknown;
      avatarUrl?: unknown;
      isPublic?: unknown;
    }>(request);
    if (!body) {
      return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
    }
    const { username, bio, avatarUrl, isPublic } = body;
    const normalizedUsername =
      typeof username === "string" ? username.trim().toLowerCase() : undefined;
    const normalizedBio = typeof bio === "string" ? bio.trim() : undefined;
    const normalizedAvatarUrl = typeof avatarUrl === "string" ? avatarUrl.trim() : undefined;

    if (normalizedBio && normalizedBio.length > BIO_MAX_LENGTH) {
      return NextResponse.json(
        { error: `Hakkında en fazla ${BIO_MAX_LENGTH} karakter olabilir.` },
        { status: 400 }
      );
    }

    // avatarUrl validation: HTTPS only, max 2000 chars
    if (normalizedAvatarUrl) {
      if (normalizedAvatarUrl.length > 2000) {
        return NextResponse.json(
          { error: "Avatar URL çok uzun (maks 2000 karakter)." },
          { status: 400 }
        );
      }
      try {
        const parsed = new URL(normalizedAvatarUrl);
        if (parsed.protocol !== "https:") {
          return NextResponse.json(
            { error: "Avatar URL yalnızca HTTPS olabilir." },
            { status: 400 }
          );
        }
      } catch {
        return NextResponse.json({ error: "Geçersiz avatar URL." }, { status: 400 });
      }
    }

    /* The settings page always sends the username; only a real change is validated and
       written, so a name that predates a rule (or a reserved one) never blocks other edits. */
    const currentUser =
      normalizedUsername !== undefined
        ? await prisma.user.findUnique({ where: { id: userId }, select: { username: true } })
        : null;
    const usernameChanged =
      normalizedUsername !== undefined && normalizedUsername !== currentUser?.username;

    if (usernameChanged) {
      if (!normalizedUsername) {
        return NextResponse.json({ error: "Kullanıcı adı boş bırakılamaz" }, { status: 400 });
      }

      /* Same rule as register. */
      const usernameRegex = /^[a-z0-9_]{3,30}$/;
      if (!usernameRegex.test(normalizedUsername)) {
        return NextResponse.json(
          {
            error:
              "Kullanıcı adı 3-30 karakter, yalnızca küçük harf, rakam veya alt çizgi içerebilir",
          },
          { status: 400 }
        );
      }

      if (isReservedUsername(normalizedUsername)) {
        return NextResponse.json({ error: "Bu kullanıcı adı kullanılamaz" }, { status: 400 });
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
        ...(usernameChanged ? { username: normalizedUsername } : {}),
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
    /* Username is the only unique field written here: a concurrent rename to the same name. */
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Bu kullanıcı adı zaten kullanılıyor" }, { status: 409 });
    }
    return handleApiError(error, "Profil güncellenemedi.");
  }
}
