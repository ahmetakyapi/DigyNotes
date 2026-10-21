import { normalizeCategory } from "./categories";

/**
 * `externalRating` (Post and Wishlist) holds the public score MediaSearch found: TMDB's vote
 * average (0–10) for films and series, RAWG's Metacritic score divided by 20 (0–5) for games.
 * One column, two scales, so the category says which one a value is on (tests/external-rating.test.mjs).
 */
export interface ExternalRatingMeta {
  source: "TMDB" | "Metacritic";
  scale: 5 | 10;
}

export function getExternalRatingMeta(category?: string | null): ExternalRatingMeta {
  return normalizeCategory(category) === "game"
    ? { source: "Metacritic", scale: 5 }
    : { source: "TMDB", scale: 10 };
}
