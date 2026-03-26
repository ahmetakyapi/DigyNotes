import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, handleApiError } from "@/lib/api-server";
import { prisma } from "@/lib/prisma";

const DEFAULTS: Record<string, string> = {
  registrationEnabled: "true",
  maintenanceMode: "false",
  maintenanceMessage: "Site şu anda bakımda. Lütfen daha sonra tekrar deneyin.",
};

export async function GET() {
  try {
    const adminId = await requireAdmin();
    if (!adminId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const rows = await prisma.siteSettings.findMany();
    const settings: Record<string, string> = { ...DEFAULTS };
    for (const row of rows) {
      settings[row.key] = row.value;
    }

    return NextResponse.json(settings);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const adminId = await requireAdmin();
    if (!adminId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    if (typeof body !== "object" || body === null) {
      return NextResponse.json({ error: "Geçersiz veri" }, { status: 400 });
    }

    const allowed = Object.keys(DEFAULTS);
    const updates = Object.entries(body as Record<string, unknown>).filter(
      ([key]) => allowed.includes(key)
    );

    await Promise.all(
      updates.map(([key, value]) =>
        prisma.siteSettings.upsert({
          where: { key },
          create: { key, value: String(value) },
          update: { value: String(value) },
        })
      )
    );

    const rows = await prisma.siteSettings.findMany();
    const settings: Record<string, string> = { ...DEFAULTS };
    for (const row of rows) {
      settings[row.key] = row.value;
    }

    return NextResponse.json(settings);
  } catch (error) {
    return handleApiError(error);
  }
}
