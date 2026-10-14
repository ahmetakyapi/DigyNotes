import { getCategoryLabel, normalizeCategory } from "@/lib/categories";
import { foldSearchText } from "@/lib/text";

/**
 * "Sana Önerilenler" ranking. Pure (tests/recommendations.test.mjs); the API route loads
 * the rows. The old version only looked at the user's five most-used tags, and ties
 * between equally used tags dropped matches at random, so an active archive could get
 * no suggestions at all. Now every tag counts (weighted), the category mix counts, and
 * each suggestion says why it was picked.
 */

export interface TasteNote {
  title: string;
  category: string;
  rating: number;
  tags: string[];
}

export interface RecommendationCandidate {
  id: string;
  title: string;
  category: string;
  rating: number;
  createdAt: Date | string;
  tags: string[];
  authorId: string | null;
}

export type RecommendationReason =
  | { kind: "tag"; tag: string }
  | { kind: "category"; category: string };

export interface TasteProfile {
  /** Tag → weight; notes rated 4+ count double, they say more about taste. */
  tagWeights: Map<string, number>;
  /** Normalised category → share of the user's notes (0–1). */
  categoryShare: Map<string, number>;
  /** Folded titles the user already has a note for. */
  ownTitles: Set<string>;
}

export interface RankedRecommendation<T extends RecommendationCandidate> {
  candidate: T;
  score: number;
  reason: RecommendationReason;
}

const MAX_PER_AUTHOR = 4;

export function foldTitle(title: string) {
  return foldSearchText(title).replace(/\s+/g, " ").trim();
}

export function buildTasteProfile(notes: TasteNote[]): TasteProfile {
  const tagWeights = new Map<string, number>();
  const categoryCounts = new Map<string, number>();
  const ownTitles = new Set<string>();

  for (const note of notes) {
    const weight = note.rating >= 4 ? 2 : 1;
    for (const tag of note.tags) {
      tagWeights.set(tag, (tagWeights.get(tag) ?? 0) + weight);
    }
    const category = normalizeCategory(note.category);
    categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
    ownTitles.add(foldTitle(note.title));
  }

  const categoryShare = new Map<string, number>();
  categoryCounts.forEach((count, category) => {
    categoryShare.set(category, notes.length > 0 ? count / notes.length : 0);
  });

  return { tagWeights, categoryShare, ownTitles };
}

export function scoreCandidate(
  candidate: RecommendationCandidate,
  profile: TasteProfile
): { score: number; reason: RecommendationReason } | null {
  let tagScore = 0;
  let bestTag: string | null = null;
  let bestTagWeight = 0;
  for (const tag of candidate.tags) {
    const weight = profile.tagWeights.get(tag) ?? 0;
    tagScore += weight;
    if (weight > bestTagWeight) {
      bestTag = tag;
      bestTagWeight = weight;
    }
  }

  const category = normalizeCategory(candidate.category);
  const categoryShare = profile.categoryShare.get(category) ?? 0;

  // Nothing in common with the archive: not a suggestion, just a random note.
  if (tagScore === 0 && categoryShare === 0) return null;

  const score = tagScore * 3 + categoryShare * 4 + Math.max(0, candidate.rating) * 0.5;
  const reason: RecommendationReason = bestTag
    ? { kind: "tag", tag: bestTag }
    : { kind: "category", category };

  return { score, reason };
}

/**
 * Best matches first; notes the user already wrote about are skipped, the same title
 * from two people shows once, and one prolific author can't fill the whole page.
 */
export function rankRecommendations<T extends RecommendationCandidate>(
  candidates: T[],
  profile: TasteProfile,
  limit = 12
): RankedRecommendation<T>[] {
  const scored: RankedRecommendation<T>[] = [];
  for (const candidate of candidates) {
    if (profile.ownTitles.has(foldTitle(candidate.title))) continue;
    const result = scoreCandidate(candidate, profile);
    if (result) scored.push({ candidate, ...result });
  }

  scored.sort(
    (a, b) =>
      b.score - a.score ||
      b.candidate.rating - a.candidate.rating ||
      new Date(b.candidate.createdAt).getTime() - new Date(a.candidate.createdAt).getTime()
  );

  const seenTitles = new Set<string>();
  const perAuthor = new Map<string, number>();
  const picked: RankedRecommendation<T>[] = [];

  for (const entry of scored) {
    if (picked.length >= limit) break;
    const title = foldTitle(entry.candidate.title);
    if (seenTitles.has(title)) continue;
    const author = entry.candidate.authorId ?? "";
    const count = perAuthor.get(author) ?? 0;
    if (author && count >= MAX_PER_AUTHOR) continue;
    seenTitles.add(title);
    perAuthor.set(author, count + 1);
    picked.push(entry);
  }

  return picked;
}

/** The one-line "why" under a suggestion, sentence case. */
export function describeRecommendationReason(reason: RecommendationReason): string {
  return reason.kind === "tag"
    ? `#${reason.tag} etiketli notlarına benziyor`
    : `${getCategoryLabel(reason.category)} notlarına göre`;
}
