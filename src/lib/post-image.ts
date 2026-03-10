import { normalizeFixedCategory, type FixedCategory } from "./categories";

export const DEFAULT_POST_IMAGE = "/default-post-cover.svg";
export const DEFAULT_POST_IMAGE_WIDE = "/default-post-cover-wide.svg";

const CATEGORY_DEFAULT_IMAGES: Record<FixedCategory, string> = {
  movies: "/defaults/movies.svg",
  series: "/defaults/series.svg",
  game: "/defaults/game.svg",
  book: "/defaults/book.svg",
  travel: "/defaults/travel.svg",
  other: "/defaults/other.svg",
};

export function getCategoryDefaultImage(category?: string | null): string {
  const normalized = normalizeFixedCategory(category);
  return CATEGORY_DEFAULT_IMAGES[normalized as FixedCategory] ?? DEFAULT_POST_IMAGE;
}

export function getPostImageSrc(image?: string | null, category?: string | null) {
  const normalized = image?.trim();
  return normalized ? normalized : getCategoryDefaultImage(category);
}

/**
 * Bozuk veya eksik görseller için yatay (landscape) placeholder döner.
 * Kart ve liste görünümlerinde kullanılmak üzere tasarlanmıştır.
 */
export function getWideFallbackSrc(): string {
  return DEFAULT_POST_IMAGE_WIDE;
}
