const DEFAULT_SITE_URL = "http://localhost:3000";

export function stripHtml(html: string) {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function truncateText(text: string, maxLength: number) {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(0, maxLength - 1)).trimEnd()}...`;
}

export function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXTAUTH_URL ?? DEFAULT_SITE_URL;
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
