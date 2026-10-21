import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-server";
import bcrypt from "bcryptjs";
import { consumeRateLimit, createRateLimitErrorResponse } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimit = await consumeRateLimit({
      action: "password-change",
      req: request,
      userId,
      limit: 5,
      windowMs: 15 * 60_000,
    });
    if (!rateLimit.success) {
      return createRateLimitErrorResponse(
        rateLimit,
        "Çok fazla deneme yaptınız. Lütfen 15 dakika sonra tekrar deneyin."
      );
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body as {
      currentPassword?: string;
      newPassword?: string;
    };

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Mevcut şifre ve yeni şifre gereklidir" }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: "Yeni şifre en az 8 karakter olmalıdır" }, { status: 400 });
    }

    if (newPassword.length > 128) {
      return NextResponse.json(
        { error: "Yeni şifre en fazla 128 karakter olabilir" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return NextResponse.json({ error: "Mevcut şifre hatalı" }, { status: 403 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: "user.password_change",
        metadata: {},
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, "Şifre değiştirilemedi. Lütfen tekrar deneyin.");
  }
}
