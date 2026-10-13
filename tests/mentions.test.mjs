import assert from "node:assert/strict";
import test from "node:test";

import {
  extractMentions,
  getActiveMention,
  insertMention,
  splitMentions,
} from "../src/lib/mentions.ts";

test("extractMentions finds unique lowercased usernames in order", () => {
  assert.deepEqual(extractMentions("@Ahmet ve @zeynep_k, bir de @ahmet"), ["ahmet", "zeynep_k"]);
  assert.deepEqual(extractMentions("@ahmet'in notu (@ali_01)."), ["ahmet", "ali_01"]);
});

test("extractMentions ignores e-mails, short names and over-long tokens", () => {
  assert.deepEqual(extractMentions("ali@mail.com @ab @@ahmet"), []);
  assert.deepEqual(extractMentions(`@${"a".repeat(31)}`), []);
  assert.deepEqual(extractMentions("@ahmetçi"), []);
});

test("extractMentions caps the number of mentions", () => {
  const text = "@aaa @bbb @ccc @ddd @eee @fff @ggg";
  assert.equal(extractMentions(text).length, 5);
  assert.deepEqual(extractMentions(text, 2), ["aaa", "bbb"]);
});

test("splitMentions keeps text around tokens and honours the known set", () => {
  assert.deepEqual(splitMentions("selam @Ahmet ve @yok!", ["ahmet"]), [
    { type: "text", value: "selam " },
    { type: "mention", value: "@Ahmet", username: "ahmet" },
    { type: "text", value: " ve @yok!" },
  ]);
  assert.deepEqual(splitMentions("düz metin"), [{ type: "text", value: "düz metin" }]);
  assert.deepEqual(splitMentions("@ali_01"), [
    { type: "mention", value: "@ali_01", username: "ali_01" },
  ]);
});

test("getActiveMention finds the word being typed at the caret", () => {
  assert.deepEqual(getActiveMention("merhaba @ah", 11), { query: "ah", start: 8 });
  assert.deepEqual(getActiveMention("@", 1), { query: "", start: 0 });
  assert.deepEqual(getActiveMention("(@ayşe", 6), { query: "ayşe", start: 1 });
  assert.equal(getActiveMention("ali@mail", 8), null);
  assert.equal(getActiveMention("@ahmet bitti", 12), null);
  assert.equal(getActiveMention("@ah", 9), null);
});

test("insertMention replaces the whole word and leaves one space", () => {
  assert.deepEqual(insertMention("selam @ah", 6, 9, "ahmet"), {
    text: "selam @ahmet ",
    caret: 13,
  });
  assert.deepEqual(insertMention("@ahm nasılsın", 0, 2, "ahmet"), {
    text: "@ahmet nasılsın",
    caret: 7,
  });
});
