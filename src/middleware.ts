import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/* Reads a public note page makes in the browser (the note, its likes, comments and
   related notes). They sit under the protected `/api/posts/:path*`, so anonymous
   visitors got the login page instead of JSON and every public note showed
   "İçerik bulunamadı". The handlers apply `getPostReadAccess` themselves; writes
   (POST/PUT/DELETE) still need a session here. */
const PUBLIC_POST_READ = /^\/api\/posts\/[^/]+(?:\/(?:likes|comments))?$/;

export default withAuth(
  function middleware(req: NextRequest) {
    const res = NextResponse.next();
    // Inject pathname header so server components (MaintenanceGuard) can read it
    res.headers.set("x-pathname", req.nextUrl.pathname);
    /* Everything matched here is private: keep it out of search indexes even if a
       crawler ever gets a response (robots.txt leaves these pages crawlable on
       purpose so the noindex can be seen; anonymous crawlers are sent to /login,
       which is noindex too). */
    if (!req.nextUrl.pathname.startsWith("/api/")) {
      res.headers.set("X-Robots-Tag", "noindex, nofollow");
    }
    return res;
  },
  {
    pages: {
      signIn: "/login",
    },
    callbacks: {
      authorized: ({ token, req }) =>
        Boolean(token) || (req.method === "GET" && PUBLIC_POST_READ.test(req.nextUrl.pathname)),
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
