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
 * Start of the current calendar month in Istanbul (UTC+3 all year since 2016), as a
 * UTC instant. Servers run in UTC, so "bu ay" would otherwise flip three hours late.
 */
export function getIstanbulMonthStart(now: Date = new Date()): Date {
  const OFFSET_MS = 3 * 60 * 60 * 1000;
  const local = new Date(now.getTime() + OFFSET_MS);
  return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), 1) - OFFSET_MS);
}
