import assert from "node:assert/strict";
import test from "node:test";

import { formatDisplaySentence, formatDisplayTitle } from "../src/lib/display-text.ts";

test("formatDisplayTitle trims and title-cases Turkish strings", () => {
  assert.equal(formatDisplayTitle("  İSTANBUL hatırası "), "İstanbul Hatırası");
  assert.equal(formatDisplayTitle("the-last OF us"), "The-Last Of Us");
});

test("formatDisplaySentence normalizes casing across sentences", () => {
  assert.equal(
    formatDisplaySentence("  BU BİR deneme. ikinci CÜMLE!  "),
    "Bu bir deneme. İkinci cümle!"
  );
});
