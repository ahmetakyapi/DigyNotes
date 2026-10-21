import assert from "node:assert/strict";
import test from "node:test";

import {
  formatRating,
  formatRatingFixed,
  getIstanbulDateKey,
  getIstanbulDateParts,
  getIstanbulDayStart,
  getIstanbulMonthStart,
  getIstanbulYearStart,
} from "../src/lib/number-format.ts";
import { applySortFilter, createSortFilterState } from "../src/lib/sort-filter-utils.ts";
import { foldSearchText } from "../src/lib/text.ts";

test("formatRating uses a decimal comma and drops ,0", () => {
  assert.equal(formatRating(4.5), "4,5");
  assert.equal(formatRating(4.333), "4,3");
  assert.equal(formatRating(5), "5");
  assert.equal(formatRating(3.96), "4");
  assert.equal(formatRating(null), "");
  assert.equal(formatRating(Number.NaN), "");
});

test("formatRatingFixed always keeps one decimal", () => {
  assert.equal(formatRatingFixed(4), "4,0");
  assert.equal(formatRatingFixed(4.44), "4,4");
});

test("getIstanbulMonthStart follows the Istanbul calendar, not UTC", () => {
  // 30 Sep 22:30 UTC is already 1 October 01:30 in Istanbul.
  assert.equal(
    getIstanbulMonthStart(new Date("2026-09-30T22:30:00.000Z")).toISOString(),
    "2026-09-30T21:00:00.000Z"
  );
  assert.equal(
    getIstanbulMonthStart(new Date("2026-10-14T12:00:00.000Z")).toISOString(),
    "2026-09-30T21:00:00.000Z"
  );
  assert.equal(
    getIstanbulMonthStart(new Date("2026-01-01T00:00:00.000Z")).toISOString(),
    "2025-12-31T21:00:00.000Z"
  );
});

test("getIstanbulDayStart and getIstanbulDateKey cut days at Istanbul midnight", () => {
  // 19 Oct 22:30 UTC is already 20 October 01:30 in Istanbul.
  assert.equal(
    getIstanbulDayStart(new Date("2026-10-19T22:30:00.000Z")).toISOString(),
    "2026-10-19T21:00:00.000Z"
  );
  assert.equal(getIstanbulDateKey(new Date("2026-10-19T22:30:00.000Z")), "2026-10-20");
  assert.equal(getIstanbulDateKey(new Date("2026-10-20T20:59:00.000Z")), "2026-10-20");
  assert.equal(getIstanbulDateKey(new Date("2026-10-20T21:00:00.000Z")), "2026-10-21");
});

test("getIstanbulYearStart and getIstanbulDateParts follow the Istanbul calendar", () => {
  assert.equal(getIstanbulYearStart(2026).toISOString(), "2025-12-31T21:00:00.000Z");
  assert.deepEqual(getIstanbulDateParts(new Date("2025-12-31T22:30:00.000Z")), {
    year: 2026,
    month: 0,
    day: 1,
  });
  assert.deepEqual(getIstanbulDateParts(new Date("2026-10-14T12:00:00.000Z")), {
    year: 2026,
    month: 9,
    day: 14,
  });
});

test("applySortFilter keeps pinned notes first only when asked, in the default order", () => {
  const posts = [
    { title: "Yeni", rating: 3, createdAt: "2026-10-10T00:00:00.000Z" },
    { title: "Sabit", rating: 5, createdAt: "2026-01-01T00:00:00.000Z", isPinned: true },
    { title: "Orta", rating: 4, createdAt: "2026-05-01T00:00:00.000Z" },
  ];
  const newest = createSortFilterState("newest");
  assert.deepEqual(
    applySortFilter(posts, newest, { pinnedFirst: true }).map((p) => p.title),
    ["Sabit", "Yeni", "Orta"]
  );
  assert.deepEqual(
    applySortFilter(posts, newest).map((p) => p.title),
    ["Yeni", "Orta", "Sabit"]
  );
  assert.deepEqual(
    applySortFilter(posts, createSortFilterState("rating_asc"), { pinnedFirst: true }).map(
      (p) => p.title
    ),
    ["Yeni", "Orta", "Sabit"]
  );
});

test("foldSearchText matches dotted and dotless i in both directions", () => {
  assert.equal(foldSearchText("İstanbul"), "istanbul");
  assert.equal(foldSearchText("ISTANBUL"), "istanbul");
  assert.equal(foldSearchText("IMDb"), "imdb");
  assert.equal(foldSearchText("Işık"), "işik");
  assert.equal(foldSearchText(null), "");
});
