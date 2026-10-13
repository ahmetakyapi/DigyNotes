import assert from "node:assert/strict";
import test from "node:test";

import {
  decodeOffsetCursor,
  decodeTimeCursor,
  encodeTimeCursor,
  formatRelativeTime,
  parseFeedLimit,
  parseFeedOwn,
  parseFeedTab,
  rankFeedPosts,
  scoreFeedPost,
} from "../src/lib/feed.ts";

const NOW = new Date("2026-10-13T12:00:00.000Z");
const daysAgo = (days) => new Date(NOW.getTime() - days * 86_400_000);

test("parseFeedTab falls back to following", () => {
  assert.equal(parseFeedTab("popular"), "popular");
  assert.equal(parseFeedTab("latest"), "latest");
  assert.equal(parseFeedTab("following"), "following");
  assert.equal(parseFeedTab(null), "following");
  assert.equal(parseFeedTab("bogus"), "following");
});

test("parseFeedLimit clamps to 1..50 with a default of 20", () => {
  assert.equal(parseFeedLimit(null), 20);
  assert.equal(parseFeedLimit("abc"), 20);
  assert.equal(parseFeedLimit("0"), 1);
  assert.equal(parseFeedLimit("12"), 12);
  assert.equal(parseFeedLimit("500"), 50);
});

test("parseFeedOwn defaults to on", () => {
  assert.equal(parseFeedOwn(null), true);
  assert.equal(parseFeedOwn("1"), true);
  assert.equal(parseFeedOwn("0"), false);
  assert.equal(parseFeedOwn("false"), false);
});

test("time cursor round-trips and rejects garbage", () => {
  const createdAt = new Date("2026-10-01T08:30:00.000Z");
  const cursor = encodeTimeCursor({ id: "clx123", createdAt });
  assert.deepEqual(decodeTimeCursor(cursor), { createdAt, id: "clx123" });
  assert.equal(decodeTimeCursor(null), null);
  assert.equal(decodeTimeCursor("nope"), null);
  assert.equal(decodeTimeCursor("not-a-date_abc"), null);
  assert.equal(decodeTimeCursor("2026-10-01T08:30:00.000Z_"), null);
});

test("offset cursor accepts only non-negative integers", () => {
  assert.equal(decodeOffsetCursor(null), 0);
  assert.equal(decodeOffsetCursor("20"), 20);
  assert.equal(decodeOffsetCursor("-3"), 0);
  assert.equal(decodeOffsetCursor("1e3"), 0);
  assert.equal(decodeOffsetCursor("99999"), 300);
});

test("scoreFeedPost weighs engagement and decays with age", () => {
  const base = { id: "a", likes: 4, comments: 1, bookmarks: 1 };
  const fresh = scoreFeedPost({ ...base, createdAt: NOW }, NOW);
  const weekOld = scoreFeedPost({ ...base, createdAt: daysAgo(7) }, NOW);
  assert.equal(fresh, 4 + 2 + 3 + 0.25);
  assert.ok(Math.abs(weekOld - fresh / 2) < 1e-9);

  const liked = scoreFeedPost(
    { id: "b", createdAt: NOW, likes: 1, comments: 0, bookmarks: 0 },
    NOW
  );
  const commented = scoreFeedPost(
    { id: "c", createdAt: NOW, likes: 0, comments: 1, bookmarks: 0 },
    NOW
  );
  assert.ok(commented > liked);
  // Future timestamps don't inflate the score.
  assert.equal(
    scoreFeedPost({ ...base, createdAt: new Date(NOW.getTime() + 86_400_000) }, NOW),
    fresh
  );
});

test("rankFeedPosts orders by score, then recency, then id", () => {
  const posts = [
    { id: "quiet-new", createdAt: daysAgo(0.1), likes: 0, comments: 0, bookmarks: 0 },
    { id: "loved-old", createdAt: daysAgo(20), likes: 40, comments: 5, bookmarks: 4 },
    { id: "busy-fresh", createdAt: daysAgo(1), likes: 6, comments: 2, bookmarks: 1 },
    { id: "quiet-old", createdAt: daysAgo(10), likes: 0, comments: 0, bookmarks: 0 },
    { id: "tie-a", createdAt: daysAgo(2), likes: 1, comments: 0, bookmarks: 0 },
    { id: "tie-b", createdAt: daysAgo(2), likes: 1, comments: 0, bookmarks: 0 },
  ];
  assert.deepEqual(
    rankFeedPosts(posts, NOW).map((p) => p.id),
    ["busy-fresh", "loved-old", "tie-b", "tie-a", "quiet-new", "quiet-old"]
  );
});

test("formatRelativeTime spells out Turkish relative times", () => {
  const ago = (ms) => new Date(NOW.getTime() - ms);
  assert.equal(formatRelativeTime(ago(20_000), NOW), "Az önce");
  assert.equal(formatRelativeTime(ago(5 * 60_000), NOW), "5 dakika önce");
  assert.equal(formatRelativeTime(ago(3 * 3_600_000), NOW), "3 saat önce");
  assert.equal(formatRelativeTime(daysAgo(1), NOW), "Dün");
  assert.equal(formatRelativeTime(daysAgo(4), NOW), "4 gün önce");
  assert.equal(formatRelativeTime(daysAgo(15), NOW), "2 hafta önce");
  assert.equal(formatRelativeTime(daysAgo(70), NOW), "2 ay önce");
  assert.equal(formatRelativeTime(daysAgo(800), NOW), "2 yıl önce");
  assert.equal(formatRelativeTime("invalid", NOW), "");
});
