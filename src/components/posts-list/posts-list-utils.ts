import type { Post } from "@/types";
import { getCategoryLabel } from "@/lib/categories";
import { categorySupportsSpoiler } from "@/lib/post-config";

/**
 * Arama metni normalize eder — HTML strip, lowercase, whitespace collapse.
 */
export function normalizeSearchText(value?: string | null): string {
  return (value ?? "")
    .replaceAll(/<[^>]*>/g, " ")
    .replaceAll(/\s+/g, " ")
    .toLowerCase();
}

/**
 * Post'un arama sorgusuna uyup uymadığını kontrol eder.
 */
export function matchesQuery(post: Post, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const haystacks = [
    normalizeSearchText(post.title),
    normalizeSearchText(post.creator),
    normalizeSearchText(post.excerpt),
    normalizeSearchText(post.content),
    normalizeSearchText(post.category),
    normalizeSearchText(getCategoryLabel(post.category)),
    normalizeSearchText(post.years),
    ...(post.tags ?? []).map((tag) => normalizeSearchText(tag.name)),
  ];

  return haystacks.some((text) => text.includes(q));
}

/**
 * Spoiler olan içeriklerde excerpt'i gizle mi?
 */
export function shouldHideExcerpt(post: Post): boolean {
  return Boolean(post.hasSpoiler && categorySupportsSpoiler(post.category));
}

/**
 * Post'un aktif tag filtrelerinden en az birine uyup uymadığını kontrol eder.
 */
export function postMatchesTags(post: Post, activeTags: readonly string[]): boolean {
  if (activeTags.length === 0) return true;
  const postTagNames = new Set((post.tags ?? []).map((t) => t.name));
  return activeTags.some((at) => postTagNames.has(at));
}
