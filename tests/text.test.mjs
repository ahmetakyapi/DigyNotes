import assert from "node:assert/strict";
import test from "node:test";

import { normalizeTagName } from "../src/lib/text.ts";

test("normalizeTagName lower-cases the Turkish way and hyphenates spaces", () => {
  assert.equal(normalizeTagName("  İstanbul Gezisi "), "istanbul-gezisi");
  assert.equal(normalizeTagName("IŞIK"), "ışık");
  assert.equal(normalizeTagName("Bilim  Kurgu"), "bilim-kurgu");
});

test("normalizeTagName never leaves a combining dot from İ", () => {
  assert.ok(!normalizeTagName("İ").includes("̇"));
  assert.equal(normalizeTagName(normalizeTagName("Çağdaş Klasik")), "çağdaş-klasik");
});
