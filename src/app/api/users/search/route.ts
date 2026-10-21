import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-server";
import { searchPublicUsers } from "@/lib/public-users";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    return NextResponse.json(await searchPublicUsers(searchParams.get("q")));
  } catch (error) {
    return handleApiError(error, "Kullanıcılar yüklenemedi.");
  }
}
