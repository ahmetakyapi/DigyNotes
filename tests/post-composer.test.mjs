import assert from "node:assert/strict";
import test from "node:test";

import {
  boundedNumber,
  formatMissingFieldsMessage,
  getMissingPostFields,
  getPostCategoryFormConfig,
  hasMeaningfulContent,
  optionalString,
  parseCoverImage,
} from "../src/lib/post-form.ts";
import {
  applyTemplateToContent,
  getPostTemplate,
  isBlankOrTemplateContent,
} from "../src/lib/post-templates.ts";
import {
  areLocalDraftWritesBlocked,
  clearAllLocalDrafts,
  clearLegacyLocalDrafts,
  getLocalDraftKey,
} from "../src/lib/local-drafts.ts";

test("only title, category and content are required", () => {
  assert.deepEqual(getMissingPostFields({ title: "x", category: "movies", hasContent: true }), []);
  assert.deepEqual(getMissingPostFields({ title: " ", category: "movies", hasContent: false }), [
    "title",
    "content",
  ]);
  assert.deepEqual(getMissingPostFields({ title: "", category: "", hasContent: false }), [
    "title",
    "category",
    "content",
  ]);
  const config = getPostCategoryFormConfig("movies");
  assert.equal("creatorRequired" in config, false);
  assert.equal("yearsRequired" in config, false);
});

test("formatMissingFieldsMessage names exactly what is missing", () => {
  assert.equal(formatMissingFieldsMessage(["title"]), "Başlık gerekli.");
  assert.equal(formatMissingFieldsMessage(["title", "content"]), "Başlık ve not içeriği gerekli.");
  assert.equal(
    formatMissingFieldsMessage(["title", "category", "content"]),
    "Başlık, kategori ve not içeriği gerekli."
  );
  assert.equal(formatMissingFieldsMessage(["content"]), "Not içeriği gerekli.");
  assert.equal(formatMissingFieldsMessage([]), "");
});

test("hasMeaningfulContent and optionalString", () => {
  assert.equal(hasMeaningfulContent("<p><br></p>"), false);
  assert.equal(hasMeaningfulContent("<p>Merhaba</p>"), true);
  assert.equal(hasMeaningfulContent('<p><img src="x.png"></p>'), true);
  assert.equal(optionalString("  "), null);
  assert.equal(optionalString(" Nolan "), "Nolan");
  assert.equal(optionalString(42), null);
});

test("parseCoverImage keeps http(s) URLs and site paths, rejects other schemes", () => {
  assert.equal(parseCoverImage(undefined), "");
  assert.equal(parseCoverImage("   "), "");
  assert.equal(
    parseCoverImage(" https://image.tmdb.org/t/p/w500/a.jpg "),
    "https://image.tmdb.org/t/p/w500/a.jpg"
  );
  assert.equal(parseCoverImage("http://example.com/a.png"), "http://example.com/a.png");
  assert.equal(parseCoverImage("/defaults/movies.svg"), "/defaults/movies.svg");
  assert.equal(parseCoverImage("//evil.example/a.png"), null);
  assert.equal(parseCoverImage("data:image/png;base64,AAAA"), null);
  assert.equal(parseCoverImage("javascript:alert(1)"), null);
  assert.equal(parseCoverImage("not a url"), null);
  assert.equal(parseCoverImage(`https://example.com/${"a".repeat(2000)}`), null);
});

test("boundedNumber keeps finite numbers inside the range only", () => {
  assert.equal(boundedNumber(7.4, 0, 10), 7.4);
  assert.equal(boundedNumber(0, 0, 10), 0);
  assert.equal(boundedNumber(-90, -90, 90), -90);
  assert.equal(boundedNumber(1e300, 0, 10), null);
  assert.equal(boundedNumber(5000, -90, 90), null);
  assert.equal(boundedNumber(Number.NaN, 0, 10), null);
  assert.equal(boundedNumber("5", 0, 10), null);
  assert.equal(boundedNumber(null, 0, 10), null);
});

test("isBlankOrTemplateContent: empty or untouched template, never the user's text", () => {
  const movies = getPostTemplate("movies").html;
  assert.equal(isBlankOrTemplateContent(""), true);
  assert.equal(isBlankOrTemplateContent("<p><br></p>"), true);
  assert.equal(isBlankOrTemplateContent(movies), true);
  assert.equal(isBlankOrTemplateContent(getPostTemplate("book").html), true);
  assert.equal(isBlankOrTemplateContent(movies.replace("</p>", " Harikaydı.</p>")), false);
  assert.equal(isBlankOrTemplateContent("<p>Benim notum</p>"), false);
});

test("applyTemplateToContent keeps the user's text restorable", () => {
  const userText = "<p>Benim notum</p>";
  assert.equal(applyTemplateToContent(userText, "movies", null), null);

  const forced = applyTemplateToContent(userText, "movies", null, { force: true });
  assert.equal(forced.content, getPostTemplate("movies").html);
  assert.deepEqual(forced.undo, { previousContent: userText });

  // Switching category swaps the untouched template but still leads back to the user's text.
  const switched = applyTemplateToContent(forced.content, "book", forced.undo);
  assert.equal(switched.content, getPostTemplate("book").html);
  assert.deepEqual(switched.undo, { previousContent: userText });
});

test("applyTemplateToContent on an empty editor restores to empty", () => {
  const applied = applyTemplateToContent("<p><br></p>", "game", null);
  assert.equal(applied.content, getPostTemplate("game").html);
  assert.deepEqual(applied.undo, { previousContent: "" });
  assert.equal(applyTemplateToContent(applied.content, "game", applied.undo), null);
});

function fakeStorage(keys) {
  const map = new Map(keys.map((key) => [key, "{}"]));
  return {
    get length() {
      return map.size;
    },
    key: (index) => Array.from(map.keys())[index] ?? null,
    removeItem: (key) => map.delete(key),
    keys: () => Array.from(map.keys()),
  };
}

test("local draft keys are scoped per user", () => {
  assert.equal(getLocalDraftKey("u1"), "digynotes-draft:u1");
  assert.equal(getLocalDraftKey("u1", "p9"), "digynotes-draft:u1:p9");
});

test("clearLegacyLocalDrafts drops only the unscoped keys", () => {
  const storage = fakeStorage([
    "digynotes-draft",
    "digynotes-draft-p1",
    "digynotes-draft:u1",
    "dn_theme",
  ]);
  assert.equal(clearLegacyLocalDrafts(storage), 2);
  assert.deepEqual(storage.keys(), ["digynotes-draft:u1", "dn_theme"]);
});

test("clearAllLocalDrafts removes every draft and nothing else", () => {
  const storage = fakeStorage([
    "digynotes-draft",
    "digynotes-draft:u1",
    "digynotes-draft:u2:p1",
    "dn_theme",
  ]);
  assert.equal(clearAllLocalDrafts(storage), 3);
  assert.deepEqual(storage.keys(), ["dn_theme"]);
  assert.equal(clearAllLocalDrafts(null), 0);
});

test("sign-out (clearAllLocalDrafts) blocks draft writes until the next page load", () => {
  // Set even without storage; nothing in the module turns it off again.
  clearAllLocalDrafts(null);
  assert.equal(areLocalDraftWritesBlocked(), true);
  clearLegacyLocalDrafts(null);
  assert.equal(areLocalDraftWritesBlocked(), true);
});
