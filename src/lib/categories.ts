export const FIXED_CATEGORIES = ["movies", "series", "game", "book", "travel", "other"] as const;
export type FixedCategory = (typeof FIXED_CATEGORIES)[number];

export type SearchTabKey = "film" | "dizi" | "kitap" | "oyun" | "gezi";

const CATEGORY_VARIANTS: Record<FixedCategory, string[]> = {
  movies: ["movies", "movie", "Movies", "Movie", "Film"],
  series: ["series", "Series", "Dizi"],
  game: ["game", "Game", "Oyun"],
  book: ["book", "Book", "Kitap"],
  travel: ["travel", "Travel", "Gezi"],
  other: ["other", "Other", "Diğer", "Diger"],
};

const CATEGORY_LABELS: Record<FixedCategory, string> = {
  movies: "Film",
  series: "Dizi",
  game: "Oyun",
  book: "Kitap",
  travel: "Gezi",
  other: "Diğer",
};

const CATEGORY_SEARCH_TABS: Record<Exclude<FixedCategory, "other">, SearchTabKey> = {
  movies: "film",
  series: "dizi",
  book: "kitap",
  game: "oyun",
  travel: "gezi",
};

function toCategoryKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/ı/g, "i")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z]/g, "");
}

const CATEGORY_ALIAS_MAP = new Map<string, FixedCategory>(
  Object.entries(CATEGORY_VARIANTS).flatMap(([canonical, variants]) =>
    variants.map((variant) => [toCategoryKey(variant), canonical as FixedCategory] as const)
  )
);

export function normalizeFixedCategory(category?: string | null): FixedCategory | null {
  if (typeof category !== "string") return null;
  return CATEGORY_ALIAS_MAP.get(toCategoryKey(category)) ?? null;
}

export function normalizeCategory(category?: string | null): string {
  if (typeof category !== "string") return "";
  const trimmed = category.trim();
  if (!trimmed) return "";
  return normalizeFixedCategory(trimmed) ?? trimmed;
}

export function getCategoryLabel(category?: string | null): string {
  const normalized = normalizeFixedCategory(category);
  if (!normalized) return typeof category === "string" ? category.trim() : "";
  return CATEGORY_LABELS[normalized];
}

export function getCategoryVariants(category?: string | null): string[] {
  const normalized = normalizeFixedCategory(category);
  if (!normalized) {
    const trimmed = typeof category === "string" ? category.trim() : "";
    return trimmed ? [trimmed] : [];
  }

  return CATEGORY_VARIANTS[normalized];
}

export function isTravelCategory(category?: string | null) {
  return normalizeFixedCategory(category) === "travel";
}

export function isOtherCategory(category?: string | null) {
  return normalizeFixedCategory(category) === "other";
}

export function getSearchTabForCategory(category?: string | null): SearchTabKey | null {
  const normalized = normalizeFixedCategory(category);
  if (!normalized || normalized === "other") return null;
  return CATEGORY_SEARCH_TABS[normalized];
}

export function getCategoryFromSearchTab(tab?: string | null): FixedCategory | null {
  if (tab === "film") return "movies";
  if (tab === "dizi") return "series";
  if (tab === "kitap") return "book";
  if (tab === "oyun") return "game";
  if (tab === "gezi") return "travel";
  return null;
}
