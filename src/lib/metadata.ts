import type { Metadata } from "next";
import { stripHtml, truncateText } from "@/lib/text";

const DEFAULT_SITE_URL = "http://localhost:3000";

export { stripHtml, truncateText };

/**
 * Absolute origin used in canonical URLs, og:url and og:image. Link previews
 * (WhatsApp, iMessage, X) need it to be the real public domain: when neither env var
 * was set on Vercel, every shared note advertised `http://localhost:3000` and its
 * preview image could not be fetched. Vercel's own system variables are the fallback.
 * Returned without a trailing slash: sitemap.ts and robots.ts append paths to it, and a
 * `https://site.com/` value turned every entry into a redirecting `//posts/…` URL.
 */
export function getSiteUrl() {
  const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    vercelHost ? `https://${vercelHost}` : undefined,
    process.env.NEXTAUTH_URL,
  ].map((url) => url?.trim().replace(/\/+$/, ""));
  // On Vercel a localhost value is always a leftover from a copied .env, never the site.
  const usable = candidates.find(
    (url): url is string => Boolean(url) && !(process.env.VERCEL && url!.includes("localhost"))
  );
  return usable ?? DEFAULT_SITE_URL;
}

export function toAbsoluteUrl(path: string) {
  return new URL(path, getSiteUrl()).toString();
}

/** The site-wide share card (`src/app/opengraph-image.tsx`). */
export const SITE_SHARE_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  type: "image/jpeg",
  alt: "DigyNotes — Sana Kalan Her Şey, Burada",
};

/** Search engines must not index these (auth screens, offline, maintenance, 404). */
export const NO_INDEX: Metadata["robots"] = { index: false, follow: false };

/**
 * Title, description, canonical and share tags for a public page in one go. A page's
 * `openGraph`/`twitter` replace the layout's wholesale, so the share card and the
 * full title are spelled out here instead of silently falling back to "DigyNotes".
 * `title` is the bare page name (the layout template adds "| DigyNotes"); pass
 * `absoluteTitle` for the landing page.
 */
export function buildPageMetadata(input: {
  title: string;
  description: string;
  path: string;
  absoluteTitle?: boolean;
}): Metadata {
  const fullTitle = input.absoluteTitle ? input.title : `${input.title} | DigyNotes`;
  return {
    title: input.absoluteTitle ? { absolute: input.title } : input.title,
    description: input.description,
    alternates: { canonical: input.path },
    openGraph: {
      type: "website",
      siteName: "DigyNotes",
      locale: "tr_TR",
      url: toAbsoluteUrl(input.path),
      title: fullTitle,
      description: input.description,
      images: [SITE_SHARE_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: input.description,
      images: [SITE_SHARE_IMAGE.url],
    },
  };
}

export function buildPostMetadataDescription(input: {
  excerpt?: string | null;
  content?: string | null;
  category?: string | null;
  creator?: string | null;
  years?: string | null;
}) {
  const baseText = input.excerpt?.trim() || stripHtml(input.content ?? "");
  const summary = truncateText(baseText, 180);
  const context = [input.category, input.creator, input.years].filter(Boolean).join(" • ");

  if (!summary) {
    return context || "DigyNotes notu";
  }

  return context ? `${context} • ${summary}` : summary;
}
