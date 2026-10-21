const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

/** Plain text of Quill HTML: tags dropped, entities (`&amp;`, `&nbsp;`, `&#39;`) decoded. */
export function stripHtml(html: string) {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
      if (entity[0] === "#") {
        const code =
          entity[1] === "x" || entity[1] === "X"
            ? Number.parseInt(entity.slice(2), 16)
            : Number.parseInt(entity.slice(1), 10);
        return Number.isFinite(code) && code > 0 && code <= 0x10ffff
          ? String.fromCodePoint(code)
          : match;
      }
      return NAMED_ENTITIES[entity.toLowerCase()] ?? match;
    })
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Plain text → safe HTML text. Quill parses string values as HTML (via innerHTML), so
 * third-party or URL text must go through this before it is wrapped in `<p>`.
 */
export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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

/**
 * Case-folding for in-page search: Turkish lower-casing, then dotted and dotless i
 * count as the same letter. "İstanbul", "ISTANBUL" and "istanbul" all match, and
 * "IMDb" still matches "imdb" (tr-TR alone would turn it into "ımdb").
 */
export function foldSearchText(value?: string | null) {
  return (value ?? "").toLocaleLowerCase("tr-TR").replaceAll("ı", "i").replaceAll("̇", "");
}
