import { stripHtml, truncateText } from "@/lib/text";

const DEFAULT_SITE_URL = "http://localhost:3000";

export { stripHtml, truncateText };

/**
 * Absolute origin used in canonical URLs, og:url and og:image. Link previews
 * (WhatsApp, iMessage, X) need it to be the real public domain: when neither env var
 * was set on Vercel, every shared note advertised `http://localhost:3000` and its
 * preview image could not be fetched. Vercel's own system variables are the fallback.
 */
export function getSiteUrl() {
  const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    vercelHost ? `https://${vercelHost}` : undefined,
    process.env.NEXTAUTH_URL,
  ];
  // On Vercel a localhost value is always a leftover from a copied .env, never the site.
  const usable = candidates.find(
    (url): url is string => Boolean(url) && !(process.env.VERCEL && url!.includes("localhost"))
  );
  return usable ?? DEFAULT_SITE_URL;
}

export function toAbsoluteUrl(path: string) {
  return new URL(path, getSiteUrl()).toString();
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
