import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

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
