/**
 * Turkish number display (CLAUDE.md → decimal comma): "4,5", never "4.5".
 * Pure, so the node:test suites cover it (tests/number-format.test.mjs).
 */

/** One decimal with a comma, trailing ",0" dropped: 4.5 → "4,5", 4.33 → "4,3", 5 → "5". */
export function formatRating(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "";
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1).replace(".", ",");
}

/** Always one decimal ("4,0"), for big stat numbers that sit next to other averages. */
export function formatRatingFixed(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "";
  return (Math.round(value * 10) / 10).toFixed(1).replace(".", ",");
}

/**
 * Istanbul is UTC+3 all year (no DST since 2016). Servers run in UTC, so calendar
 * buckets ("bu ay", days, years) are cut on this offset or they flip three hours late.
 */
const ISTANBUL_OFFSET_MS = 3 * 60 * 60 * 1000;

/** Start of the current calendar month in Istanbul, as a UTC instant. */
export function getIstanbulMonthStart(now: Date = new Date()): Date {
  const local = new Date(now.getTime() + ISTANBUL_OFFSET_MS);
  return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), 1) - ISTANBUL_OFFSET_MS);
}

/** Start of the current calendar day in Istanbul, as a UTC instant. */
export function getIstanbulDayStart(now: Date = new Date()): Date {
  const local = new Date(now.getTime() + ISTANBUL_OFFSET_MS);
  return new Date(
    Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) - ISTANBUL_OFFSET_MS
  );
}

/** 1 January of `year`, 00:00 in Istanbul, as a UTC instant. */
export function getIstanbulYearStart(year: number): Date {
  return new Date(Date.UTC(year, 0, 1) - ISTANBUL_OFFSET_MS);
}

/** Istanbul calendar date of an instant; `month` is 0-11 like `Date#getMonth`. */
export function getIstanbulDateParts(date: Date): { year: number; month: number; day: number } {
  const local = new Date(date.getTime() + ISTANBUL_OFFSET_MS);
  return { year: local.getUTCFullYear(), month: local.getUTCMonth(), day: local.getUTCDate() };
}

/** Istanbul calendar day of an instant as "YYYY-MM-DD" (sortable, usable as a bucket key). */
export function getIstanbulDateKey(date: Date): string {
  return new Date(date.getTime() + ISTANBUL_OFFSET_MS).toISOString().slice(0, 10);
}
