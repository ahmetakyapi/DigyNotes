import { withAuth, type NextRequestWithAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";

/* Next 16 renamed `middleware.ts` to `proxy.ts` (it now always runs on the Node runtime)
   and expects an exported `proxy` function. next-auth v4's `withAuth` builds the handler;
   `proxy` only forwards to it, so the token check, the `/login` redirect and the headers
   below behave exactly as they did in the middleware. */

/* Reads a public note page makes in the browser (the note, its likes, comments and
   related notes). They sit under the protected `/api/posts/:path*`, so anonymous
   visitors got the login page instead of JSON and every public note showed
   "İçerik bulunamadı". The handlers apply `getPostReadAccess` themselves; writes
   (POST/PUT/DELETE) still need a session here. */
const PUBLIC_POST_READ = /^\/api\/posts\/[^/]+(?:\/(?:likes|comments))?$/;

const authProxy = withAuth(
  function addRequestHeaders(req: NextRequest) {
    const res = NextResponse.next();
    // Inject pathname header so server components (MaintenanceGuard) can read it
    res.headers.set("x-pathname", req.nextUrl.pathname);
    if (req.nextUrl.search) res.headers.set("x-search", req.nextUrl.search);
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
      /* A token without `pwv` predates session binding to the password (src/lib/auth.ts)
         and no longer resolves to a session: send it to /login instead of an empty shell. */
      authorized: ({ token, req }) =>
        Boolean(token?.pwv) ||
        (req.method === "GET" && PUBLIC_POST_READ.test(req.nextUrl.pathname)),
    },
  }
);

export function proxy(req: NextRequest, event: NextFetchEvent) {
  return authProxy(req as NextRequestWithAuth, event);
}

export const config = {
  matcher: [
    "/notes/:path*",
    "/saved",
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
