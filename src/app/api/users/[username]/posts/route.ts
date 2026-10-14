import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId, handleApiError } from "@/lib/api-server";
import { PROFILE_POST_PAGE, getProfilePostsPage } from "@/lib/profile-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/users/[username]/posts?offset=30 — the profile's notes after the first page
 * (`getProfilePageData` serves that one). Public like the profile itself: anyone for a
 * public profile, only the owner and admins for a private one.
 */
export async function GET(req: NextRequest, { params }: { params: { username: string } }) {
  try {
    const { searchParams } = req.nextUrl;
    const offset = Math.max(0, Number.parseInt(searchParams.get("offset") ?? "0", 10) || 0);
    const limit = Math.min(
      Math.max(Number.parseInt(searchParams.get("limit") ?? "", 10) || PROFILE_POST_PAGE, 1),
      PROFILE_POST_PAGE
    );

    const result = await getProfilePostsPage(
      params.username,
      await getSessionUserId(),
      offset,
      limit
    );

    if (result.kind === "not-found") {
      return NextResponse.json({ error: "Profil bulunamadı." }, { status: 404 });
    }
    if (result.kind === "private") {
      return NextResponse.json({ error: "Bu profil gizli." }, { status: 403 });
    }

    return NextResponse.json({ posts: result.posts, hasMore: result.hasMore });
  } catch (error) {
    return handleApiError(error, "Notlar yüklenirken bir hata oluştu.");
  }
}
