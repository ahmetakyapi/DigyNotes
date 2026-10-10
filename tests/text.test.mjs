import assert from "node:assert/strict";
import test from "node:test";

import { normalizeTagName, stripHtml } from "../src/lib/text.ts";

test("normalizeTagName lower-cases the Turkish way and hyphenates spaces", () => {
  assert.equal(normalizeTagName("  İstanbul Gezisi "), "istanbul-gezisi");
  assert.equal(normalizeTagName("IŞIK"), "ışık");
  assert.equal(normalizeTagName("Bilim  Kurgu"), "bilim-kurgu");
});

test("normalizeTagName never leaves a combining dot from İ", () => {
  assert.ok(!normalizeTagName("İ").includes("̇"));
  assert.equal(normalizeTagName(normalizeTagName("Çağdaş Klasik")), "çağdaş-klasik");
});

test("stripHtml drops tags and decodes entities from Quill HTML", () => {
  assert.equal(
    stripHtml("<p>Tom &amp; Jerry&nbsp;&#39;24 &lt;3</p><p>&#x15f;ey</p>"),
    "Tom & Jerry '24 <3 şey"
  );
  assert.equal(stripHtml("&unknown; &#0;"), "&unknown; &#0;");
});
