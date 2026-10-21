import assert from "node:assert/strict";
import test from "node:test";

import { getExternalRatingMeta } from "../src/lib/external-rating.ts";

test("getExternalRatingMeta: games carry Metacritic on /5, everything else TMDB on /10", () => {
  assert.deepEqual(getExternalRatingMeta("game"), { source: "Metacritic", scale: 5 });
  assert.deepEqual(getExternalRatingMeta("Oyun"), { source: "Metacritic", scale: 5 });
  assert.deepEqual(getExternalRatingMeta("movies"), { source: "TMDB", scale: 10 });
  assert.deepEqual(getExternalRatingMeta("series"), { source: "TMDB", scale: 10 });
  assert.deepEqual(getExternalRatingMeta(null), { source: "TMDB", scale: 10 });
});
