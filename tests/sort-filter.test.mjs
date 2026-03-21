import assert from "node:assert/strict";
import test from "node:test";

import {
  createSortFilterState,
  hasActiveSortFilters,
  extractYearRange,
  matchesAdvancedFilters,
} from "../src/lib/sort-filter-utils.ts";

// ── createSortFilterState ───────────────────────────────────────────

test("createSortFilterState returns defaults with given sort", () => {
  const state = createSortFilterState("rating_desc");
  assert.equal(state.sort, "rating_desc");
  assert.equal(state.minRating, 0);
  assert.equal(state.maxRating, 0);
  assert.equal(state.yearFrom, "");
  assert.equal(state.yearTo, "");
  assert.deepEqual(state.statuses, []);
});

test("createSortFilterState defaults to newest", () => {
  const state = createSortFilterState();
  assert.equal(state.sort, "newest");
});

// ── hasActiveSortFilters ────────────────────────────────────────────

test("hasActiveSortFilters detects no filters by default", () => {
  const state = createSortFilterState();
  assert.equal(hasActiveSortFilters(state), false);
});

test("hasActiveSortFilters detects changed sort", () => {
  const state = { ...createSortFilterState(), sort: "az" };
  assert.equal(hasActiveSortFilters(state), true);
});

test("hasActiveSortFilters detects minRating change", () => {
  const state = { ...createSortFilterState(), minRating: 3 };
  assert.equal(hasActiveSortFilters(state), true);
});

test("hasActiveSortFilters detects status change", () => {
  const state = { ...createSortFilterState(), statuses: ["İzledim"] };
  assert.equal(hasActiveSortFilters(state), true);
});

// ── extractYearRange ────────────────────────────────────────────────

test("extractYearRange parses single year", () => {
  assert.deepEqual(extractYearRange("2024"), { from: 2024, to: 2024 });
});

test("extractYearRange parses year range", () => {
  assert.deepEqual(extractYearRange("2019–2024"), { from: 2019, to: 2024 });
});

test("extractYearRange returns null for empty input", () => {
  assert.equal(extractYearRange(null), null);
  assert.equal(extractYearRange(""), null);
  assert.equal(extractYearRange("abc"), null);
});

// ── matchesAdvancedFilters ──────────────────────────────────────────

const baseFilters = createSortFilterState();

const samplePost = {
  rating: 4,
  status: "İzledim",
  years: "2022",
  date: null,
};

test("matchesAdvancedFilters passes with default filters", () => {
  assert.equal(matchesAdvancedFilters(samplePost, baseFilters), true);
});

test("matchesAdvancedFilters filters by minRating", () => {
  assert.equal(matchesAdvancedFilters(samplePost, { ...baseFilters, minRating: 4 }), true);
  assert.equal(matchesAdvancedFilters(samplePost, { ...baseFilters, minRating: 4.5 }), false);
});

test("matchesAdvancedFilters filters by maxRating", () => {
  assert.equal(matchesAdvancedFilters(samplePost, { ...baseFilters, maxRating: 5 }), true);
  assert.equal(matchesAdvancedFilters(samplePost, { ...baseFilters, maxRating: 3 }), false);
});

test("matchesAdvancedFilters filters by status", () => {
  assert.equal(matchesAdvancedFilters(samplePost, { ...baseFilters, statuses: ["İzledim"] }), true);
  assert.equal(
    matchesAdvancedFilters(samplePost, { ...baseFilters, statuses: ["Bıraktım"] }),
    false
  );
});

test("matchesAdvancedFilters filters by year range", () => {
  assert.equal(
    matchesAdvancedFilters(samplePost, { ...baseFilters, yearFrom: "2020", yearTo: "2023" }),
    true
  );
  assert.equal(matchesAdvancedFilters(samplePost, { ...baseFilters, yearFrom: "2023" }), false);
});
