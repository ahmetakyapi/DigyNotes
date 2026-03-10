import assert from "node:assert/strict";
import test from "node:test";

import {
  FIXED_CATEGORIES,
  getCategoryLabel,
  getCategoryVariants,
  normalizeCategory,
  normalizeFixedCategory,
} from "../src/lib/categories.ts";

test("fixed categories remain stable", () => {
  assert.deepEqual(FIXED_CATEGORIES, ["movies", "series", "game", "book", "travel", "other"]);
});

test("normalizes category aliases to canonical keys", () => {
  assert.equal(normalizeFixedCategory("Film"), "movies");
  assert.equal(normalizeFixedCategory("Dizi"), "series");
  assert.equal(normalizeFixedCategory("Gezi"), "travel");
});

test("falls back to trimmed custom category names", () => {
  assert.equal(normalizeCategory("  Kişisel Liste  "), "Kişisel Liste");
});

test("returns the expected label and variants for canonical categories", () => {
  assert.equal(getCategoryLabel("movies"), "Film");
  assert.deepEqual(getCategoryVariants("book"), ["book", "Book", "Kitap"]);
});
