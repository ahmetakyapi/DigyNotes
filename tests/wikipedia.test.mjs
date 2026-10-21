import assert from "node:assert/strict";
import test from "node:test";

import {
  buildWikipediaThumbApiUrl,
  fetchWikipediaThumb,
  isWikimediaImageUrl,
  parseWikipediaTag,
} from "../src/lib/wikipedia.ts";

test("parseWikipediaTag reads the language prefix of an OSM wikipedia tag", () => {
  assert.deepEqual(parseWikipediaTag("tr:İstanbul"), { lang: "tr", title: "İstanbul" });
  assert.deepEqual(parseWikipediaTag("EN:Paris"), { lang: "en", title: "Paris" });
  assert.deepEqual(parseWikipediaTag("zh-min-nan:Tâi-pak"), {
    lang: "zh-min-nan",
    title: "Tâi-pak",
  });
  assert.deepEqual(parseWikipediaTag("en:Star Wars: Episode IV"), {
    lang: "en",
    title: "Star Wars: Episode IV",
  });
});

test("parseWikipediaTag never lets the tag pick another host", () => {
  assert.deepEqual(parseWikipediaTag("evil.example/x?:Paris"), { lang: "en", title: "Paris" });
  assert.deepEqual(parseWikipediaTag("a:Paris"), { lang: "en", title: "Paris" });
  assert.deepEqual(parseWikipediaTag("-tr:Paris"), { lang: "en", title: "Paris" });
  const { lang, title } = parseWikipediaTag("evil.example#:Paris");
  assert.equal(new URL(buildWikipediaThumbApiUrl(lang, title)).hostname, "en.wikipedia.org");
});

test("parseWikipediaTag falls back to the place name", () => {
  assert.deepEqual(parseWikipediaTag(undefined, "Mardin"), { lang: "en", title: "Mardin" });
  assert.deepEqual(parseWikipediaTag("Kapadokya", "Nevşehir"), { lang: "en", title: "Kapadokya" });
  assert.deepEqual(parseWikipediaTag(null, null), { lang: "en", title: "" });
});

test("isWikimediaImageUrl keeps only https Wikimedia images", () => {
  assert.equal(
    isWikimediaImageUrl("https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Paris.jpg"),
    true
  );
  assert.equal(isWikimediaImageUrl("http://upload.wikimedia.org/x.jpg"), false);
  assert.equal(isWikimediaImageUrl("https://evil.example/x.jpg"), false);
  assert.equal(isWikimediaImageUrl("https://upload.wikimedia.org.evil.example/x.jpg"), false);
  assert.equal(isWikimediaImageUrl("https://evilwikimedia.org/x.jpg"), false);
  assert.equal(isWikimediaImageUrl("javascript:alert(1)"), false);
  assert.equal(isWikimediaImageUrl("not a url"), false);
  assert.equal(isWikimediaImageUrl(undefined), false);
  assert.equal(isWikimediaImageUrl(42), false);
});

async function withFetch(stub, run) {
  const original = globalThis.fetch;
  globalThis.fetch = stub;
  try {
    return await run();
  } finally {
    globalThis.fetch = original;
  }
}

const pageWith = (source) => ({
  ok: true,
  json: async () => ({ query: { pages: { 1: { thumbnail: { source } } } } }),
});

test("fetchWikipediaThumb asks Wikipedia and returns a Wikimedia thumbnail", async () => {
  const requested = [];
  const thumb = await withFetch(
    async (url) => {
      requested.push(new URL(url));
      return pageWith("https://upload.wikimedia.org/thumb/Paris.jpg");
    },
    () => fetchWikipediaThumb("evil.example/x?:Paris", "Paris")
  );
  assert.equal(thumb, "https://upload.wikimedia.org/thumb/Paris.jpg");
  assert.equal(requested.length, 1);
  assert.equal(requested[0].hostname, "en.wikipedia.org");
  assert.equal(requested[0].searchParams.get("titles"), "Paris");
});

test("fetchWikipediaThumb drops thumbnails from other hosts and failed requests", async () => {
  assert.equal(
    await withFetch(
      async () => pageWith("https://evil.example/pixel.gif"),
      () => fetchWikipediaThumb("tr:İstanbul")
    ),
    undefined
  );
  assert.equal(
    await withFetch(
      async () => ({ ok: false, json: async () => ({}) }),
      () => fetchWikipediaThumb("tr:İstanbul")
    ),
    undefined
  );
  assert.equal(
    await withFetch(
      async () => {
        throw new TypeError("network");
      },
      () => fetchWikipediaThumb("tr:İstanbul")
    ),
    undefined
  );
});

test("fetchWikipediaThumb skips the request without a title and gives up after the timeout", async () => {
  let calls = 0;
  assert.equal(
    await withFetch(
      async () => {
        calls += 1;
        return pageWith("https://upload.wikimedia.org/x.jpg");
      },
      () => fetchWikipediaThumb(undefined, "")
    ),
    undefined
  );
  assert.equal(calls, 0);

  const hanging = (_url, init) =>
    new Promise((_resolve, reject) => {
      init.signal.addEventListener("abort", () => reject(new Error("aborted")));
    });
  assert.equal(
    await withFetch(hanging, () => fetchWikipediaThumb("tr:İstanbul", undefined, 10)),
    undefined
  );
});
