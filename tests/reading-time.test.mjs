import assert from "node:assert/strict";
import test from "node:test";

import { estimateReadingTime, formatReadingTime } from "../src/lib/reading-time.ts";

test("estimateReadingTime strips markup and keeps a minimum of one minute", () => {
  assert.equal(estimateReadingTime("<p>Merhaba dünya</p>"), 1);
  assert.equal(estimateReadingTime(`<p>${"kelime ".repeat(450)}</p>`), 3);
});

test("formatReadingTime renders Turkish labels", () => {
  assert.equal(formatReadingTime(0), "");
  assert.equal(formatReadingTime(1), "1 dk okuma");
  assert.equal(formatReadingTime(4), "4 dk okuma");
});
