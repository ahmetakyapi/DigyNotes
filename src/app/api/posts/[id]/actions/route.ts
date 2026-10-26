import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError, requireAuth, safeParseBody } from "@/lib/api-server";
import {
  applyRateLimitHeaders,
  consumeRateLimit,
  createRateLimitErrorResponse,
} from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const ALLOWED_ACTIONS = ["pin", "unpin", "archive", "unarchive", "restore"] as const;
type PostAction = (typeof ALLOWED_ACTIONS)[number];

function isPostAction(value: unknown): value is PostAction {
  return typeof value === "string" && (ALLOWED_ACTIONS as readonly string[]).includes(value);
}

export async function POST(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  const params = await paramsPromise;
  try {
    const [userId, authError] = await requireAuth();
    if (authError) return authError;

    const rateLimit = await consumeRateLimit({
      action: "post-action",
      req: request,
      userId,
      limit: 60,
      windowMs: 60_000,
    });
    if (!rateLimit.success) {
      return createRateLimitErrorResponse(
        rateLimit,
        "Çok fazla işlem yaptınız. Lütfen biraz sonra tekrar deneyin."
      );
    }

    const body = await safeParseBody<{ action?: unknown }>(request);
    const action = body?.action;

    if (!isPostAction(action)) {
      return NextResponse.json({ error: "Geçersiz işlem" }, { status: 400 });
    }

    const post = await prisma.post.findUnique({
      where: { id: params.id },
      select: { id: true, userId: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Not bulunamadı" }, { status: 404 });
    }

    if (post.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const dataMap: Record<PostAction, Record<string, unknown>> = {
      pin: { isPinned: true },
      unpin: { isPinned: false },
      archive: { isArchived: true },
      unarchive: { isArchived: false },
      restore: { isDeleted: false, deletedAt: null },
    };

    await prisma.post.update({
      where: { id: params.id },
      data: dataMap[action],
    });

    return applyRateLimitHeaders(NextResponse.json({ success: true, action }), rateLimit);
  } catch (error) {
    return handleApiError(error, "İşlem sırasında bir hata oluştu.");
  }
}
