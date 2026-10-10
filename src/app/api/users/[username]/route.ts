import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/api-server";
import { getProfilePageData } from "@/lib/profile-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(_req: NextRequest, { params }: { params: { username: string } }) {
  try {
    const result = await getProfilePageData(params.username, await getSessionUserId());

    if (result.kind === "not-found") {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    if (result.kind === "private") {
      return NextResponse.json(
        { error: "Profile is private", isPrivate: true, profile: result.profile },
        { status: 403 }
      );
    }

    return NextResponse.json(result.data);
  } catch (err) {
    console.error("[GET /api/users/[username]] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
