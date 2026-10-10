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

/**
 * Canonical tag name, used by `TagInput` and every API that saves or filters tags so
 * the same tag can't end up as two rows. Turkish lower-casing (`İ → i`, `I → ı`):
 * plain `toLowerCase()` turned "İ" into "i̇" (i + combining dot) and disagreed with
 * what the editor stored. Whitespace runs become a single hyphen.
 */
export function normalizeTagName(raw: string) {
  return raw.toLocaleLowerCase("tr-TR").trim().replace(/\s+/g, "-");
}
