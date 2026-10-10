import { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/metadata";

const siteUrl = getSiteUrl();

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
