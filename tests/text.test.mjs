import assert from "node:assert/strict";
import test from "node:test";

import { stripHtml, truncateText } from "../src/lib/text.ts";

test("stripHtml removes tags and collapses whitespace", () => {
  assert.equal(stripHtml("<p>Merhaba <strong>dünya</strong></p>"), "Merhaba dünya");
});

test("truncateText preserves short strings and ellipsizes longer ones", () => {
  assert.equal(truncateText("kısa", 10), "kısa");
  assert.equal(truncateText("uzun bir metin", 8), "uzun bi...");
});
