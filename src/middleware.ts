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
  ],
};
