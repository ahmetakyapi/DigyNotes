/**
 * Admin activity chart buckets, cut and labelled in Istanbul time (servers run in UTC).
 * Pure, so the node:test suites cover it (tests/admin-buckets.test.mjs).
 */

import { getIstanbulDateKey, getIstanbulDateParts, getIstanbulDayStart } from "./number-format";

export type ActivityRange = "24h" | "7d" | "30d" | "90d" | "365d";

export type ActivityBucket = { label: string; key: string; count: number };

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

/** Counts `rows` into the chart buckets of `range`, oldest first, ending with the current one. */
export function buildActivityBuckets(
  range: ActivityRange,
  rows: { createdAt: Date }[],
  now: Date = new Date()
): ActivityBucket[] {
  const buckets: ActivityBucket[] = [];
  let rowKey: (date: Date) => string;

  if (range === "24h") {
    // Istanbul is a whole-hour offset, so UTC hours are Istanbul hours; only the label shifts.
    const currentHour = Math.floor(now.getTime() / HOUR_MS);
    for (let i = 23; i >= 0; i--) {
      const hour = currentHour - i;
      buckets.push({
        key: String(hour),
        label: new Date(hour * HOUR_MS).toLocaleTimeString("tr-TR", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "Europe/Istanbul",
        }),
        count: 0,
      });
    }
    rowKey = (date) => String(Math.floor(date.getTime() / HOUR_MS));
  } else if (range === "7d" || range === "30d" || range === "90d") {
    const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
    const today = getIstanbulDayStart(now);
    for (let i = days - 1; i >= 0; i--) {
      const start = new Date(today.getTime() - i * DAY_MS);
      buckets.push({
        key: getIstanbulDateKey(start),
        label: start.toLocaleDateString("tr-TR", {
          day: "numeric",
          month: "short",
          timeZone: "Europe/Istanbul",
        }),
        count: 0,
      });
    }
    rowKey = getIstanbulDateKey;
  } else {
    // 365d → monthly. Bucket dates are UTC midnights that stand for Istanbul calendar months.
    const { year, month } = getIstanbulDateParts(now);
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(Date.UTC(year, month - i, 1));
      buckets.push({
        key: monthStart.toISOString().slice(0, 7),
        label: monthStart.toLocaleDateString("tr-TR", {
          month: "short",
          year: "2-digit",
          timeZone: "UTC",
        }),
        count: 0,
      });
    }
    rowKey = (date) => getIstanbulDateKey(date).slice(0, 7);
  }

  const byKey = new Map(buckets.map((bucket) => [bucket.key, bucket]));
  rows.forEach((row) => {
    const bucket = byKey.get(rowKey(row.createdAt));
    if (bucket) bucket.count++;
  });

  return buckets;
}
