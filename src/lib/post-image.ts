import { normalizeFixedCategory, type FixedCategory } from "./categories";

export const DEFAULT_POST_IMAGE = "/default-post-cover.svg";

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
