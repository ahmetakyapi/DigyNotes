import { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/metadata";

const siteUrl = getSiteUrl();

/*
  Only what must not be fetched is disallowed. Private pages (notes, feed, settings,
  admin, …) are NOT listed: a disallowed URL can still be indexed from links (public
  notes link to /notes and /category), and a crawler that may not fetch it never sees
  the noindex. Anonymous crawlers are redirected to /login (noindex) by the middleware,
  which also sends `X-Robots-Tag: noindex` on every private page.
  /api/ stays closed: JSON endpoints are not pages, and public pages are rendered on
  the server, so crawlers don't need them to see the content. Share cards
  (`…/opengraph-image`) are not under /api/ and stay reachable.
*/
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
