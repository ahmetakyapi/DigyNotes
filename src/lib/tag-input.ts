import { normalizeTagName } from "@/lib/text";

/** Most tags a note can carry; the post APIs cut the list at the same number. */
export const TAG_LIMIT = 10;
export const TAG_MAX_LENGTH = 30;

const ALLOWED_TAG_CHAR = /[a-z0-9çğıöşüâîû-]/;

/**
 * Turns whatever the user typed into a tag the server will keep as-is: a leading `#` is
 * dropped, `normalizeTagName` lower-cases (Turkish rules) and hyphenates spaces, accented
 * letters fall back to their base letter ("café" → "cafe") and anything else is stripped
 * instead of rejecting the whole tag. The result is a fixed point of `normalizeTagName`,
 * so the server-side normalization never changes it again. Empty string = nothing usable.
 */
export function cleanTagName(raw: string) {
  const normalized = normalizeTagName(raw.replace(/^[\s#]+/, ""));
  let cleaned = "";
  for (const char of normalized) {
    if (ALLOWED_TAG_CHAR.test(char)) {
      cleaned += char;
      continue;
    }
    const base = char.normalize("NFD").charAt(0);
    if (base !== char && ALLOWED_TAG_CHAR.test(base)) cleaned += base;
    else if (char === "_" || char === "/" || char === ".") cleaned += "-";
  }
  return cleaned
    .replace(/-{2,}/g, "-")
    .replace(/^-+/, "")
    .slice(0, TAG_MAX_LENGTH)
    .replace(/-+$/, "");
}

/**
 * Splits pasted or typed text into tag candidates: commas, semicolons, line breaks and
 * tabs separate tags, and so does whitespace in front of a `#` ("#film #drama").
 */
export function splitTagInput(raw: string) {
  return raw.split(/[,;\n\r\t]+|\s+(?=#)/);
}

/** Every usable, de-duplicated tag in `raw`, in the order they were written. */
export function parseTagInput(raw: string) {
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const part of splitTagInput(raw)) {
    const tag = cleanTagName(part);
    if (!tag || seen.has(tag)) continue;
    seen.add(tag);
    tags.push(tag);
  }
  return tags;
}

/** True when the text holds a tag separator, i.e. a paste or typed comma should split it. */
export function hasTagSeparator(raw: string) {
  return /[,;\n\r\t]|\S\s+#/.test(raw);
}

export interface AddTagsResult {
  tags: string[];
  added: string[];
  duplicates: string[];
  /** Candidates dropped because the list was already full. */
  overLimit: string[];
}

/** Appends `candidates` (already cleaned) to `current`, skipping duplicates and stopping at the limit. */
export function addTagsToList(
  current: readonly string[],
  candidates: readonly string[],
  limit = TAG_LIMIT
): AddTagsResult {
  const tags = [...current];
  const added: string[] = [];
  const duplicates: string[] = [];
  const overLimit: string[] = [];
  for (const candidate of candidates) {
    if (!candidate) continue;
    if (tags.includes(candidate)) {
      if (!duplicates.includes(candidate)) duplicates.push(candidate);
      continue;
    }
    if (tags.length >= limit) {
      overLimit.push(candidate);
      continue;
    }
    tags.push(candidate);
    added.push(candidate);
  }
  return { tags, added, duplicates, overLimit };
}

/** Commits text still sitting in the tag field (e.g. when the note is saved). */
export function mergePendingTagText(current: readonly string[], pending: string) {
  if (!pending.trim()) return [...current];
  return addTagsToList(current, parseTagInput(pending)).tags;
}

/** Short Turkish feedback line for an add attempt; empty when everything went in. */
export function describeTagAddResult(result: AddTagsResult, limit = TAG_LIMIT) {
  if (result.overLimit.length > 0) return `En fazla ${limit} etiket ekleyebilirsin.`;
  if (result.duplicates.length > 0 && result.added.length === 0) {
    return result.duplicates.length === 1
      ? `#${result.duplicates[0]} zaten ekli.`
      : "Bu etiketler zaten ekli.";
  }
  return "";
}
