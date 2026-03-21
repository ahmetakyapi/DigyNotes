import assert from "node:assert/strict";
import test from "node:test";

/**
 * posts-list-utils.ts `@/` path alias'ları kullandığı için
 * Node.js native runner ile doğrudan import edilemez.
 * Burada fonksiyon mantığını inline olarak test ediyoruz.
 */

// ── normalizeSearchText (inlined) ───────────────────────────────────

function normalizeSearchText(value) {
  return (value ?? "")
    .replaceAll(/<[^>]*>/g, " ")
    .replaceAll(/\s+/g, " ")
    .toLowerCase();
}

test("normalizeSearchText strips HTML and normalizes whitespace", () => {
  assert.equal(normalizeSearchText("<p>Merhaba  <b>Dünya</b></p>"), " merhaba dünya ");
});

test("normalizeSearchText handles null / undefined", () => {
  assert.equal(normalizeSearchText(null), "");
  assert.equal(normalizeSearchText(undefined), "");
  assert.equal(normalizeSearchText(""), "");
});

// ── postMatchesTags (inlined) ───────────────────────────────────────

function postMatchesTags(post, activeTags) {
  if (activeTags.length === 0) return true;
  const postTagNames = new Set((post.tags ?? []).map((t) => t.name));
  return activeTags.some((at) => postTagNames.has(at));
}

const basePost = {
  id: "1",
  title: "Inception",
  creator: "Christopher Nolan",
  excerpt: "Rüya içinde rüya",
  content: "<p>Harika bir film</p>",
  category: "movies",
  years: "2010",
  tags: [{ id: "t1", name: "Bilim Kurgu" }],
  rating: 5,
  image: null,
  status: null,
  hasSpoiler: false,
  isPublic: true,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

test("postMatchesTags returns true when no active tags", () => {
  assert.equal(postMatchesTags(basePost, []), true);
});

test("postMatchesTags returns true when post has a matching tag", () => {
  assert.equal(postMatchesTags(basePost, ["Bilim Kurgu"]), true);
  assert.equal(postMatchesTags(basePost, ["Dram", "Bilim Kurgu"]), true);
});

test("postMatchesTags returns false when no tag matches", () => {
  assert.equal(postMatchesTags(basePost, ["Komedi"]), false);
});

// ── matchesQuery (inlined, simplified without category label) ───────

function matchesQuery(post, query) {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const haystacks = [
    normalizeSearchText(post.title),
    normalizeSearchText(post.creator),
    normalizeSearchText(post.excerpt),
    normalizeSearchText(post.content),
    normalizeSearchText(post.category),
    normalizeSearchText(post.years),
    ...(post.tags ?? []).map((tag) => normalizeSearchText(tag.name)),
  ];

  return haystacks.some((text) => text.includes(q));
}

test("matchesQuery returns true when query is empty", () => {
  assert.equal(matchesQuery(basePost, ""), true);
  assert.equal(matchesQuery(basePost, "  "), true);
});

test("matchesQuery finds matches in title", () => {
  assert.equal(matchesQuery(basePost, "inception"), true);
  assert.equal(matchesQuery(basePost, "INCEPTION"), true);
});

test("matchesQuery finds matches in creator", () => {
  assert.equal(matchesQuery(basePost, "nolan"), true);
});

test("matchesQuery finds matches in tags", () => {
  assert.equal(matchesQuery(basePost, "bilim kurgu"), true);
});

test("matchesQuery returns false for no match", () => {
  assert.equal(matchesQuery(basePost, "xyz123"), false);
});
