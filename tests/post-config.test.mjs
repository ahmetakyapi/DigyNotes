import assert from "node:assert/strict";
import test from "node:test";

import { hidesSpoilerText, SPOILER_SHARE_TEXT } from "../src/lib/post-config.ts";

test("hidesSpoilerText hides flagged notes in spoiler categories", () => {
  assert.equal(hidesSpoilerText({ hasSpoiler: true, category: "movies" }), true);
  assert.equal(hidesSpoilerText({ hasSpoiler: true, category: "Film" }), true);
  assert.equal(hidesSpoilerText({ hasSpoiler: true, category: "book" }), true);
});

test("hidesSpoilerText keeps unflagged notes and categories without spoilers", () => {
  assert.equal(hidesSpoilerText({ hasSpoiler: false, category: "movies" }), false);
  assert.equal(hidesSpoilerText({ hasSpoiler: null, category: "series" }), false);
  assert.equal(hidesSpoilerText({ category: "game" }), false);
  assert.equal(hidesSpoilerText({ hasSpoiler: true, category: "travel" }), false);
  assert.equal(hidesSpoilerText({ hasSpoiler: true, category: "other" }), false);
});

test("SPOILER_SHARE_TEXT is a readable Turkish sentence", () => {
  assert.equal(SPOILER_SHARE_TEXT, "Bu not spoiler içeriyor.");
});
