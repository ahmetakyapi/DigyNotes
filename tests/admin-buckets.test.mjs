import assert from "node:assert/strict";
import test from "node:test";

import { buildActivityBuckets } from "../src/lib/admin-buckets.ts";

const NOW = new Date("2026-10-20T11:40:00.000Z"); // 14:40 on 20 October in Istanbul

test("24h buckets are labelled with Istanbul hours", () => {
  const buckets = buildActivityBuckets(
    "24h",
    [
      { createdAt: new Date("2026-10-20T11:30:00.000Z") }, // 14:30 Istanbul
      { createdAt: new Date("2026-10-20T11:05:00.000Z") },
      { createdAt: new Date("2026-10-19T11:30:00.000Z") }, // older than 24 hours
    ],
    NOW
  );
  assert.equal(buckets.length, 24);
  assert.equal(buckets[23].label, "14:00");
  assert.equal(buckets[23].count, 2);
  assert.equal(buckets[0].label, "15:00");
  assert.equal(
    buckets.reduce((sum, bucket) => sum + bucket.count, 0),
    2
  );
});

test("day buckets cut at Istanbul midnight", () => {
  const buckets = buildActivityBuckets(
    "7d",
    [
      { createdAt: new Date("2026-10-19T22:30:00.000Z") }, // 01:30 on 20 October in Istanbul
      { createdAt: new Date("2026-10-19T20:30:00.000Z") }, // 23:30 on 19 October in Istanbul
    ],
    NOW
  );
  assert.equal(buckets.length, 7);
  assert.equal(buckets[6].key, "2026-10-20");
  assert.equal(buckets[6].label, "20 Eki");
  assert.equal(buckets[6].count, 1);
  assert.equal(buckets[5].key, "2026-10-19");
  assert.equal(buckets[5].count, 1);
  assert.equal(buckets[0].key, "2026-10-14");
});

test("monthly buckets follow the Istanbul calendar month", () => {
  const buckets = buildActivityBuckets(
    "365d",
    [
      { createdAt: new Date("2026-09-30T22:30:00.000Z") }, // 01:30 on 1 October in Istanbul
      { createdAt: new Date("2026-09-30T20:30:00.000Z") }, // 23:30 on 30 September in Istanbul
    ],
    NOW
  );
  assert.equal(buckets.length, 12);
  assert.equal(buckets[11].key, "2026-10");
  assert.equal(buckets[11].count, 1);
  assert.equal(buckets[10].key, "2026-09");
  assert.equal(buckets[10].count, 1);
  assert.equal(buckets[0].key, "2025-11");
});
