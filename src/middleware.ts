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
    "/posts/:path*",
    "/category/:path*",
    "/api/posts/:path*",
    "/api/categories/:path*",
    "/profile/settings/:path*",
    "/profile/settings",
    "/feed",
    "/feed/:path*",
    "/recommended",
    "/recommended/:path*",
    "/api/follows/:path*",
    "/api/feed/:path*",
    "/api/recommendations/:path*",
    "/admin",
    "/admin/:path*",
  ],
};
