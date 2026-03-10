import { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin",
          "/category/",
          "/collections",
          "/feed",
          "/maintenance",
          "/new-post",
          "/notes",
          "/notifications",
          "/posts/*/edit",
          "/profile/settings",
          "/recommended",
          "/stats",
          "/watchlist",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
