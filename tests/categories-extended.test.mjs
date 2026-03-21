import assert from "node:assert/strict";
import test from "node:test";

import {
  isTravelCategory,
  isOtherCategory,
  getSearchTabForCategory,
  getCategoryFromSearchTab,
  normalizeFixedCategory,
  normalizeCategory,
  getCategoryLabel,
} from "../src/lib/categories.ts";

// ── isTravelCategory ────────────────────────────────────────────────

test("isTravelCategory returns true for travel variants", () => {
  assert.equal(isTravelCategory("travel"), true);
  assert.equal(isTravelCategory("Travel"), true);
  assert.equal(isTravelCategory("Gezi"), true);
});

test("isTravelCategory returns false for non-travel categories", () => {
  assert.equal(isTravelCategory("movies"), false);
  assert.equal(isTravelCategory("book"), false);
  assert.equal(isTravelCategory(null), false);
  assert.equal(isTravelCategory(undefined), false);
});

// ── isOtherCategory ─────────────────────────────────────────────────

test("isOtherCategory returns true for other variants", () => {
  assert.equal(isOtherCategory("other"), true);
  assert.equal(isOtherCategory("Other"), true);
  assert.equal(isOtherCategory("Diğer"), true);
});

test("isOtherCategory returns false for known categories", () => {
  assert.equal(isOtherCategory("movies"), false);
  assert.equal(isOtherCategory(null), false);
});

// ── getSearchTabForCategory ─────────────────────────────────────────

test("getSearchTabForCategory maps categories to search tabs", () => {
  assert.equal(getSearchTabForCategory("movies"), "film");
  assert.equal(getSearchTabForCategory("series"), "dizi");
  assert.equal(getSearchTabForCategory("book"), "kitap");
  assert.equal(getSearchTabForCategory("game"), "oyun");
  assert.equal(getSearchTabForCategory("travel"), "gezi");
});

test("getSearchTabForCategory returns null for other/unknown", () => {
  assert.equal(getSearchTabForCategory("other"), null);
  assert.equal(getSearchTabForCategory("random"), null);
  assert.equal(getSearchTabForCategory(null), null);
});

// ── getCategoryFromSearchTab ────────────────────────────────────────

test("getCategoryFromSearchTab maps tabs back to categories", () => {
  assert.equal(getCategoryFromSearchTab("film"), "movies");
  assert.equal(getCategoryFromSearchTab("dizi"), "series");
  assert.equal(getCategoryFromSearchTab("kitap"), "book");
  assert.equal(getCategoryFromSearchTab("oyun"), "game");
  assert.equal(getCategoryFromSearchTab("gezi"), "travel");
});

test("getCategoryFromSearchTab returns null for unknown tabs", () => {
  assert.equal(getCategoryFromSearchTab("other"), null);
  assert.equal(getCategoryFromSearchTab(null), null);
  assert.equal(getCategoryFromSearchTab(undefined), null);
});

// ── normalizeFixedCategory edge cases ───────────────────────────────

test("normalizeFixedCategory handles Turkish aliases case-insensitively", () => {
  assert.equal(normalizeFixedCategory("film"), "movies");
  assert.equal(normalizeFixedCategory("OYUN"), "game");
  assert.equal(normalizeFixedCategory("KİTAP"), "book");
});

test("normalizeFixedCategory returns null for empty/unknown input", () => {
  assert.equal(normalizeFixedCategory(""), null);
  assert.equal(normalizeFixedCategory("   "), null);
  assert.equal(normalizeFixedCategory("nonsense"), null);
});

// ── normalizeCategory ───────────────────────────────────────────────

test("normalizeCategory returns empty string for empty input", () => {
  assert.equal(normalizeCategory(""), "");
  assert.equal(normalizeCategory(null), "");
  assert.equal(normalizeCategory(undefined), "");
});

test("normalizeCategory normalizes known categories", () => {
  assert.equal(normalizeCategory("Film"), "movies");
  assert.equal(normalizeCategory("Dizi"), "series");
});

test("normalizeCategory preserves custom category names", () => {
  assert.equal(normalizeCategory("Müzik"), "Müzik");
});

// ── getCategoryLabel ────────────────────────────────────────────────

test("getCategoryLabel returns Turkish labels for all fixed categories", () => {
  assert.equal(getCategoryLabel("movies"), "Film");
  assert.equal(getCategoryLabel("series"), "Dizi");
  assert.equal(getCategoryLabel("game"), "Oyun");
  assert.equal(getCategoryLabel("book"), "Kitap");
  assert.equal(getCategoryLabel("travel"), "Gezi");
  assert.equal(getCategoryLabel("other"), "Diğer");
});

test("getCategoryLabel returns trimmed input for unknown categories", () => {
  assert.equal(getCategoryLabel("Müzik"), "Müzik");
  assert.equal(getCategoryLabel(null), "");
});
