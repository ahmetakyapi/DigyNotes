import assert from "node:assert/strict";
import test from "node:test";

import {
  transformPostTags,
  sanitizeRating,
  sanitizeStringField,
  requireStringField,
} from "../src/lib/api-utils.ts";

// ── transformPostTags ───────────────────────────────────────────────

test("transformPostTags flattens PostTag join records into plain Tag array", () => {
  const post = {
    id: "1",
    title: "Test",
    tags: [{ tag: { id: "t1", name: "Film" } }, { tag: { id: "t2", name: "Dram" } }],
  };
  const result = transformPostTags(post);
  assert.deepEqual(result.tags, [
    { id: "t1", name: "Film" },
    { id: "t2", name: "Dram" },
  ]);
  assert.equal(result.id, "1");
  assert.equal(result.title, "Test");
});

test("transformPostTags returns empty tags when input has none", () => {
  const post = { id: "2", tags: [] };
  const result = transformPostTags(post);
  assert.deepEqual(result.tags, []);
});

// ── sanitizeRating ──────────────────────────────────────────────────

test("sanitizeRating clamps valid numbers to 0–5 with 0.5 steps", () => {
  assert.equal(sanitizeRating(3), 3);
  assert.equal(sanitizeRating(4.3), 4.5);
  assert.equal(sanitizeRating(4.2), 4);
  assert.equal(sanitizeRating(0), 0);
  assert.equal(sanitizeRating(5), 5);
  assert.equal(sanitizeRating(4.75), 5);
  assert.equal(sanitizeRating(4.74), 4.5);
});

test("sanitizeRating clamps out-of-range values", () => {
  assert.equal(sanitizeRating(-1), 0);
  assert.equal(sanitizeRating(10), 5);
  assert.equal(sanitizeRating(6.5), 5);
});

test("sanitizeRating coerces string input", () => {
  assert.equal(sanitizeRating("3.7"), 3.5);
  assert.equal(sanitizeRating("0"), 0);
});

test("sanitizeRating returns 0 for invalid input", () => {
  assert.equal(sanitizeRating("abc"), 0);
  assert.equal(sanitizeRating(null), 0);
  assert.equal(sanitizeRating(undefined), 0);
  assert.equal(sanitizeRating(NaN), 0);
  assert.equal(sanitizeRating(Infinity), 0);
});

// ── sanitizeStringField ─────────────────────────────────────────────

test("sanitizeStringField trims and caps length", () => {
  assert.equal(sanitizeStringField("  merhaba  ", 20), "merhaba");
  assert.equal(sanitizeStringField("uzun metin burada", 4), "uzun");
});

test("sanitizeStringField returns null for empty or non-string", () => {
  assert.equal(sanitizeStringField("", 10), null);
  assert.equal(sanitizeStringField("   ", 10), null);
  assert.equal(sanitizeStringField(123, 10), null);
  assert.equal(sanitizeStringField(null, 10), null);
  assert.equal(sanitizeStringField(undefined, 10), null);
});

// ── requireStringField ──────────────────────────────────────────────

test("requireStringField returns trimmed string when valid", () => {
  assert.equal(requireStringField("  test  ", 10), "test");
  assert.equal(requireStringField("tamam", 5), "tamam");
});

test("requireStringField returns null when exceeds maxLength", () => {
  assert.equal(requireStringField("uzun metin", 4), null);
});

test("requireStringField returns null for empty or non-string", () => {
  assert.equal(requireStringField("", 10), null);
  assert.equal(requireStringField("   ", 10), null);
  assert.equal(requireStringField(42, 10), null);
  assert.equal(requireStringField(null, 10), null);
});
