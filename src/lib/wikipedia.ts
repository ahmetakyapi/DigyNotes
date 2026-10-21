/**
 * Wikipedia thumbnails for place search results (MediaSearch's "gezi" tab and PlaceSearch).
 * The OSM `wikipedia` tag ("tr:İstanbul") is publicly editable: its language prefix ends up
 * in the request host, so it is used only when it looks like a language code, and only
 * images served by Wikimedia come back, because a thumbnail can become a public note's cover.
 * The parsing and URL checks are pure (tests/wikipedia.test.mjs).
 */

/** Wikipedia language subdomains: "en", "tr", "simple", "zh-min-nan", "be-x-old". */
const WIKIPEDIA_LANG = /^[a-z]{2,12}(?:-[a-z]{1,12})*$/i;

/** "tr:İstanbul" → { lang: "tr", title: "İstanbul" }; anything that isn't a language → "en". */
export function parseWikipediaTag(
  wikiTag?: string | null,
  fallbackTitle?: string | null
): { lang: string; title: string } {
  let lang = "en";
  let title = fallbackTitle ?? "";

  if (wikiTag) {
    const colonIdx = wikiTag.indexOf(":");
    if (colonIdx > -1) {
      const candidate = wikiTag.slice(0, colonIdx);
      if (WIKIPEDIA_LANG.test(candidate)) lang = candidate.toLowerCase();
      title = wikiTag.slice(colonIdx + 1);
    } else {
      title = wikiTag;
    }
  }

  return { lang, title };
}

/** Only https images on Wikimedia hosts (upload.wikimedia.org) are kept. */
export function isWikimediaImageUrl(source: unknown): source is string {
  if (typeof source !== "string") return false;
  try {
    const url = new URL(source);
    return url.protocol === "https:" && url.hostname.endsWith(".wikimedia.org");
  } catch {
    return false;
  }
}

export function buildWikipediaThumbApiUrl(lang: string, title: string): string {
  return `https://${lang}.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&format=json&pithumbsize=200&origin=*`;
}

/** Never rejects: no page, no image, a network error or no answer within `timeoutMs` → undefined. */
export async function fetchWikipediaThumb(
  wikiTag?: string,
  fallbackTitle?: string,
  timeoutMs = 3000
): Promise<string | undefined> {
  const { lang, title } = parseWikipediaTag(wikiTag, fallbackTitle);
  if (!title) return undefined;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(buildWikipediaThumbApiUrl(lang, title), {
      signal: controller.signal,
    });
    if (!res.ok) return undefined;
    const data = await res.json();
    const pages = data?.query?.pages ?? {};
    const page = Object.values(pages)[0] as { thumbnail?: { source?: unknown } } | undefined;
    const source = page?.thumbnail?.source;
    return isWikimediaImageUrl(source) ? source : undefined;
  } catch {
    return undefined;
  } finally {
    clearTimeout(timer);
  }
}
