import assert from "node:assert/strict";
import test from "node:test";

import {
  cdnImageLoader,
  customLoader,
  isResizableImage,
  resizeImageUrl,
} from "../src/lib/image.ts";

const TMDB_W500 = "https://image.tmdb.org/t/p/w500/abc123.jpg";
const TMDB_ORIGINAL = "https://image.tmdb.org/t/p/original/abc123.jpg";
const RAWG = "https://media.rawg.io/media/games/456/456dea5e1c7e3cd07060c14e96612001.jpg";

test("customLoader passes the source through", () => {
  assert.equal(customLoader({ src: TMDB_W500 }), TMDB_W500);
});

test("isResizableImage recognises TMDB sizes and RAWG game covers only", () => {
  assert.equal(isResizableImage(TMDB_W500), true);
  assert.equal(isResizableImage(TMDB_ORIGINAL), true);
  assert.equal(isResizableImage(RAWG), true);
  assert.equal(isResizableImage("https://media.rawg.io/media/resize/640/-/games/a/b.jpg"), false);
  assert.equal(isResizableImage("https://media.rawg.io/media/screenshots/a/b.jpg"), false);
  assert.equal(isResizableImage("https://covers.openlibrary.org/b/id/1-L.jpg"), false);
  assert.equal(isResizableImage("/defaults/movies.svg"), false);
  assert.equal(isResizableImage(""), false);
});

test("resizeImageUrl picks the smallest TMDB size that covers the width", () => {
  assert.equal(resizeImageUrl(TMDB_W500, 64), "https://image.tmdb.org/t/p/w185/abc123.jpg");
  assert.equal(resizeImageUrl(TMDB_W500, 185), "https://image.tmdb.org/t/p/w185/abc123.jpg");
  assert.equal(resizeImageUrl(TMDB_W500, 256), "https://image.tmdb.org/t/p/w342/abc123.jpg");
});

test("resizeImageUrl never asks TMDB for more than the stored size", () => {
  assert.equal(resizeImageUrl(TMDB_W500, 400), TMDB_W500);
  assert.equal(resizeImageUrl(TMDB_W500, 1920), TMDB_W500);
  const w342 = "https://image.tmdb.org/t/p/w342/abc123.jpg";
  assert.equal(resizeImageUrl(w342, 640), w342);
});

test("resizeImageUrl shrinks a TMDB original up to w780", () => {
  assert.equal(resizeImageUrl(TMDB_ORIGINAL, 640), "https://image.tmdb.org/t/p/w780/abc123.jpg");
  assert.equal(resizeImageUrl(TMDB_ORIGINAL, 3840), "https://image.tmdb.org/t/p/w780/abc123.jpg");
});

test("resizeImageUrl maps RAWG covers onto the widths RAWG serves", () => {
  const rest = "456/456dea5e1c7e3cd07060c14e96612001.jpg";
  assert.equal(resizeImageUrl(RAWG, 96), `https://media.rawg.io/media/resize/420/-/games/${rest}`);
  assert.equal(resizeImageUrl(RAWG, 421), `https://media.rawg.io/media/resize/640/-/games/${rest}`);
  assert.equal(
    resizeImageUrl(RAWG, 828),
    `https://media.rawg.io/media/resize/1280/-/games/${rest}`
  );
  assert.equal(
    resizeImageUrl(RAWG, 3840),
    `https://media.rawg.io/media/resize/1280/-/games/${rest}`
  );
});

test("resizeImageUrl leaves other hosts and bad widths alone", () => {
  const custom = "https://example.com/cover.jpg";
  assert.equal(resizeImageUrl(custom, 200), custom);
  assert.equal(resizeImageUrl("/defaults/game.svg", 200), "/defaults/game.svg");
  assert.equal(resizeImageUrl(RAWG, 0), RAWG);
  assert.equal(resizeImageUrl(TMDB_W500, Number.NaN), TMDB_W500);
});

test("cdnImageLoader resizes like resizeImageUrl", () => {
  assert.equal(
    cdnImageLoader({ src: TMDB_W500, width: 128 }),
    "https://image.tmdb.org/t/p/w185/abc123.jpg"
  );
});
