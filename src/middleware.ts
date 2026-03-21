import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default withAuth(
  function middleware(req: NextRequest) {
    const res = NextResponse.next();
    // Inject pathname header so server components (MaintenanceGuard) can read it
    res.headers.set("x-pathname", req.nextUrl.pathname);
    return res;
  },
  {
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    "/notes/:path*",
    "/new-post/:path*",
    "/posts/:path*/edit",
    "/category/:path*",
    "/api/posts",
    "/api/posts/:path*",
    "/api/categories/:path*",
    "/api/bookmarks/:path*",
    "/api/watchlist/:path*",
    "/api/collections/:path*",
    "/api/tags/:path*",
    "/api/users/me/:path*",
    "/profile/settings/:path*",
    "/profile/settings",
    "/feed",
    "/feed/:path*",
    "/recommended",
    "/recommended/:path*",
    "/collections",
    "/watchlist",
    "/stats",
    "/stats/:path*",
    "/notifications",
    "/notifications/:path*",
    "/api/follows/:path*",
    "/api/feed/:path*",
    "/api/recommendations/:path*",
    "/api/notifications/:path*",
    "/api/admin/:path*",
    "/admin",
    "/admin/:path*",
  ],
};
