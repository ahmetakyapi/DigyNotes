import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_POST_IMAGE,
  getPostImageSrc,
  getCategoryDefaultImage,
  getWideFallbackSrc,
  DEFAULT_POST_IMAGE_WIDE,
} from "../src/lib/post-image.ts";

test("getPostImageSrc returns the image when provided", () => {
  assert.equal(
    getPostImageSrc("https://example.com/img.jpg", "movies"),
    "https://example.com/img.jpg"
  );
});

test("getPostImageSrc returns category default when image is empty", () => {
  assert.equal(getPostImageSrc("", "movies"), "/defaults/movies.svg");
  assert.equal(getPostImageSrc(null, "book"), "/defaults/book.svg");
  assert.equal(getPostImageSrc(undefined, "travel"), "/defaults/travel.svg");
});

test("getPostImageSrc trims whitespace-only images", () => {
  assert.equal(getPostImageSrc("   ", "game"), "/defaults/game.svg");
});

test("getCategoryDefaultImage returns correct SVG for each category", () => {
  assert.equal(getCategoryDefaultImage("movies"), "/defaults/movies.svg");
  assert.equal(getCategoryDefaultImage("series"), "/defaults/series.svg");
  assert.equal(getCategoryDefaultImage("game"), "/defaults/game.svg");
  assert.equal(getCategoryDefaultImage("book"), "/defaults/book.svg");
  assert.equal(getCategoryDefaultImage("travel"), "/defaults/travel.svg");
  assert.equal(getCategoryDefaultImage("other"), "/defaults/other.svg");
});

test("getCategoryDefaultImage returns generic default for unknown category", () => {
  assert.equal(getCategoryDefaultImage("unknown"), DEFAULT_POST_IMAGE);
  assert.equal(getCategoryDefaultImage(null), DEFAULT_POST_IMAGE);
  assert.equal(getCategoryDefaultImage(undefined), DEFAULT_POST_IMAGE);
});

test("getWideFallbackSrc returns the wide default", () => {
  assert.equal(getWideFallbackSrc(), DEFAULT_POST_IMAGE_WIDE);
});
