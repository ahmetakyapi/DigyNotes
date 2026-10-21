import assert from "node:assert/strict";
import test from "node:test";

import { escapeHtml, normalizeTagName, stripHtml } from "../src/lib/text.ts";

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

test("escapeHtml turns plain text into inert HTML text", () => {
  assert.equal(
    escapeHtml(`<img src=x onerror="a">&'`),
    "&lt;img src=x onerror=&quot;a&quot;&gt;&amp;&#39;"
  );
  assert.equal(escapeHtml("Tom & Jerry <3"), "Tom &amp; Jerry &lt;3");
  assert.equal(stripHtml(`<p>${escapeHtml("Tom & Jerry <3")}</p>`), "Tom & Jerry <3");
  assert.equal(escapeHtml(""), "");
});
