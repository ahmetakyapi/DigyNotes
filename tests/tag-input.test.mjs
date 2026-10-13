import assert from "node:assert/strict";
import test from "node:test";

import {
  addTagsToList,
  cleanTagName,
  describeTagAddResult,
  hasTagSeparator,
  mergePendingTagText,
  parseTagInput,
} from "../src/lib/tag-input.ts";
import { normalizeTagName } from "../src/lib/text.ts";

test("cleanTagName drops a leading #, hyphenates spaces and lower-cases the Turkish way", () => {
  assert.equal(cleanTagName("#Bilim Kurgu"), "bilim-kurgu");
  assert.equal(cleanTagName("##İstanbul Gezisi"), "istanbul-gezisi");
  assert.equal(cleanTagName("  IŞIK  "), "ışık");
});

test("cleanTagName strips invalid characters instead of rejecting the tag", () => {
  assert.equal(cleanTagName("rock'n'roll!"), "rocknroll");
  assert.equal(cleanTagName("Café Crème"), "cafe-creme");
  assert.equal(cleanTagName("sci_fi"), "sci-fi");
  assert.equal(cleanTagName("a -- b"), "a-b");
  assert.equal(cleanTagName("-- hi --"), "hi");
  assert.equal(cleanTagName("!!!"), "");
});

test("cleanTagName caps the length and never ends on a hyphen", () => {
  const long = cleanTagName("abcdefghij abcdefghij abcdefghij abc");
  assert.ok(long.length <= 30);
  assert.ok(!long.endsWith("-"));
});

test("cleanTagName output survives the server-side normalizeTagName unchanged", () => {
  for (const raw of ["#Çağdaş Klasik", "İzmir", "Hikâye Odaklı", "Co-Op", "Ünlü Şef"]) {
    const cleaned = cleanTagName(raw);
    assert.equal(normalizeTagName(cleaned), cleaned);
  }
});

test("parseTagInput splits pasted lists on commas, semicolons, new lines and hashtags", () => {
  assert.deepEqual(parseTagInput("a, b; c"), ["a", "b", "c"]);
  assert.deepEqual(parseTagInput("drama\nbilim kurgu\tfestival"), [
    "drama",
    "bilim-kurgu",
    "festival",
  ]);
  assert.deepEqual(parseTagInput("#film #Drama #film"), ["film", "drama"]);
  assert.deepEqual(parseTagInput(" , ;; "), []);
});

test("hasTagSeparator spots separators but not a single multi-word tag", () => {
  assert.equal(hasTagSeparator("a, b"), true);
  assert.equal(hasTagSeparator("#a #b"), true);
  assert.equal(hasTagSeparator("bilim kurgu"), false);
  assert.equal(hasTagSeparator("#film"), false);
});

test("addTagsToList skips duplicates and stops at the limit", () => {
  const result = addTagsToList(["a", "b"], ["b", "c", "d"], 3);
  assert.deepEqual(result.tags, ["a", "b", "c"]);
  assert.deepEqual(result.added, ["c"]);
  assert.deepEqual(result.duplicates, ["b"]);
  assert.deepEqual(result.overLimit, ["d"]);
  assert.equal(describeTagAddResult(result, 3), "En fazla 3 etiket ekleyebilirsin.");
});

test("describeTagAddResult names a duplicate and stays quiet on success", () => {
  assert.equal(describeTagAddResult(addTagsToList(["a"], ["a"])), "#a zaten ekli.");
  assert.equal(describeTagAddResult(addTagsToList(["a"], ["b"])), "");
});

test("mergePendingTagText commits text left in the field on save", () => {
  assert.deepEqual(mergePendingTagText(["a"], "Yeni Etiket"), ["a", "yeni-etiket"]);
  assert.deepEqual(mergePendingTagText(["a"], "   "), ["a"]);
  assert.deepEqual(mergePendingTagText(["a"], "a"), ["a"]);
});
