import type { Post } from "@/types";

/* Feed (`/feed`, `/api/feed`) helpers: pure, shared by the route and the client,
   tested in tests/feed.test.mjs. Database access lives in the route. */

export const FEED_TABS = ["following", "popular", "latest"] as const;
export type FeedTab = (typeof FEED_TABS)[number];

export const FEED_DEFAULT_LIMIT = 20;
export const FEED_MAX_LIMIT = 50;
/** Popular ranks at most this many recent candidates, so the query stays bounded. */
export const POPULAR_CANDIDATE_LIMIT = 300;
export const POPULAR_WINDOW_DAYS = 30;
/** Engagement loses half its weight every this many days. */
export const POPULAR_HALF_LIFE_DAYS = 7;

/** A feed item: the usual post plus the viewer-specific engagement fields. */
export interface FeedPost extends Post {
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  bookmarkedByMe: boolean;
  isOwn: boolean;
  /** Whether the viewer follows the author (always false on own notes). */
  isFollowing: boolean;
}

export interface FeedResponse {
  items: FeedPost[];
  nextCursor: string | null;
}

export function parseFeedTab(value: string | null | undefined): FeedTab {
  return FEED_TABS.includes(value as FeedTab) ? (value as FeedTab) : "following";
}

export function parseFeedLimit(value: string | null | undefined): number {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed)) return FEED_DEFAULT_LIMIT;
  return Math.min(Math.max(parsed, 1), FEED_MAX_LIMIT);
}

/** `own` defaults to on; only an explicit "0"/"false" hides the viewer's notes. */
export function parseFeedOwn(value: string | null | undefined): boolean {
  return value !== "0" && value !== "false";
}

// ── Cursors ─────────────────────────────────────────────────────────

/** Time-ordered tabs page by `createdAt` + `id` (stable tie-break). */
export function encodeTimeCursor(post: { id: string; createdAt: Date | string }): string {
  const iso = post.createdAt instanceof Date ? post.createdAt.toISOString() : post.createdAt;
  return `${iso}_${post.id}`;
}

export function decodeTimeCursor(
  value: string | null | undefined
): { createdAt: Date; id: string } | null {
  if (!value) return null;
  const separator = value.indexOf("_");
  if (separator <= 0) return null;
  const createdAt = new Date(value.slice(0, separator));
  const id = value.slice(separator + 1);
  if (Number.isNaN(createdAt.getTime()) || !id) return null;
  return { createdAt, id };
}

/** Popular pages by offset into the ranked list. */
export function decodeOffsetCursor(value: string | null | undefined): number {
  if (!value || !/^\d+$/.test(value)) return 0;
  return Math.min(Number.parseInt(value, 10), POPULAR_CANDIDATE_LIMIT);
}

// ── Popular ranking ─────────────────────────────────────────────────

export interface FeedScoreInput {
  id: string;
  createdAt: Date | string;
  likes: number;
  comments: number;
  bookmarks: number;
}

/**
 * Engagement score with a half-life decay: a comment counts double a like and a
 * bookmark triple (they take more intent). The small base keeps notes without
 * engagement ordered by freshness instead of tying at zero.
 */
export function scoreFeedPost(post: FeedScoreInput, now: Date = new Date()): number {
  const created = new Date(post.createdAt).getTime();
  const ageDays = Math.max(0, (now.getTime() - created) / 86_400_000);
  const engagement =
    Math.max(0, post.likes) + 2 * Math.max(0, post.comments) + 3 * Math.max(0, post.bookmarks);
  const decay = Math.pow(0.5, ageDays / POPULAR_HALF_LIFE_DAYS);
  return (engagement + 0.25) * decay;
}

/** Highest score first; newer, then higher id breaks ties so pages stay stable. */
export function rankFeedPosts<T extends FeedScoreInput>(posts: T[], now: Date = new Date()): T[] {
  return posts
    .map((post) => ({
      post,
      score: scoreFeedPost(post, now),
      time: new Date(post.createdAt).getTime(),
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.time !== a.time) return b.time - a.time;
      if (a.post.id === b.post.id) return 0;
      return a.post.id < b.post.id ? 1 : -1;
    })
    .map((entry) => entry.post);
}

// ── Display ─────────────────────────────────────────────────────────

/** Spelled-out Turkish relative time ("3 saat önce"). */
export function formatRelativeTime(value: Date | string, now: Date = new Date()): string {
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return "";
  const minutes = Math.floor((now.getTime() - time) / 60_000);
  if (minutes < 1) return "Az önce";
  if (minutes < 60) return `${minutes} dakika önce`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} saat önce`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Dün";
  if (days < 7) return `${days} gün önce`;
  if (days < 30) return `${Math.floor(days / 7)} hafta önce`;
  if (days < 365) return `${Math.floor(days / 30)} ay önce`;
  return `${Math.floor(days / 365)} yıl önce`;
}
