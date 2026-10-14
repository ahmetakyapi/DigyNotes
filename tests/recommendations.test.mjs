import assert from "node:assert/strict";
import test from "node:test";

import {
  buildTasteProfile,
  describeRecommendationReason,
  foldTitle,
  rankRecommendations,
  scoreCandidate,
} from "../src/lib/recommendations.ts";

const notes = [
  { title: "Perfect Days", category: "movies", rating: 5, tags: ["japonya", "sakin"] },
  { title: "Past Lives", category: "movies", rating: 4.5, tags: ["sakin"] },
  { title: "Dune", category: "book", rating: 3, tags: ["bilim-kurgu"] },
  { title: "Hades", category: "game", rating: 4, tags: [] },
];

let seq = 0;
const candidate = (overrides) => ({
  id: `c${++seq}`,
  title: `Not ${seq}`,
  category: "other",
  rating: 0,
  createdAt: "2026-10-01T00:00:00.000Z",
  tags: [],
  authorId: "u1",
  ...overrides,
});

test("buildTasteProfile weights tags of well-rated notes double", () => {
  const profile = buildTasteProfile(notes);
  assert.equal(profile.tagWeights.get("sakin"), 4); // 5★ + 4.5★
  assert.equal(profile.tagWeights.get("japonya"), 2);
  assert.equal(profile.tagWeights.get("bilim-kurgu"), 1); // 3★
  assert.equal(profile.categoryShare.get("movies"), 0.5);
  assert.equal(profile.categoryShare.get("game"), 0.25);
});

test("scoreCandidate ignores notes with nothing in common", () => {
  const profile = buildTasteProfile(notes);
  assert.equal(scoreCandidate(candidate({ category: "travel", tags: ["deniz"] }), profile), null);
});

test("scoreCandidate explains a tag match with the strongest shared tag", () => {
  const profile = buildTasteProfile(notes);
  const result = scoreCandidate(candidate({ tags: ["japonya", "sakin"] }), profile);
  assert.deepEqual(result?.reason, { kind: "tag", tag: "sakin" });
});

test("scoreCandidate falls back to the category when no tag is shared", () => {
  const profile = buildTasteProfile(notes);
  const result = scoreCandidate(candidate({ category: "game", rating: 5 }), profile);
  assert.deepEqual(result?.reason, { kind: "category", category: "game" });
});

test("rankRecommendations puts tag matches above category-only matches", () => {
  const profile = buildTasteProfile(notes);
  const categoryOnly = candidate({ title: "Kyoto Story", category: "movies", rating: 5 });
  const tagMatch = candidate({ title: "Aftersun", category: "travel", tags: ["sakin"], rating: 3 });
  const ranked = rankRecommendations([categoryOnly, tagMatch], profile);
  assert.deepEqual(
    ranked.map((entry) => entry.candidate.title),
    ["Aftersun", "Kyoto Story"]
  );
});

test("rankRecommendations skips titles the user already noted, Turkish casing aside", () => {
  const profile = buildTasteProfile([
    { title: "İstanbul Hatırası", category: "book", rating: 4, tags: ["roman"] },
  ]);
  const ranked = rankRecommendations(
    [candidate({ title: "ISTANBUL  HATIRASI", category: "book", tags: ["roman"] })],
    profile
  );
  assert.equal(ranked.length, 0);
});

test("rankRecommendations shows the same title once and caps one author", () => {
  const profile = buildTasteProfile(notes);
  const many = Array.from({ length: 6 }, (_, i) =>
    candidate({ title: `Sakin ${i}`, tags: ["sakin"], authorId: "prolific" })
  );
  const twin = [
    candidate({ title: "Aynı Film", tags: ["sakin"], authorId: "a" }),
    candidate({ title: "aynı film", tags: ["sakin"], authorId: "b" }),
  ];
  const ranked = rankRecommendations([...many, ...twin], profile);
  assert.equal(ranked.filter((entry) => entry.candidate.authorId === "prolific").length, 4);
  assert.equal(
    ranked.filter((entry) => foldTitle(entry.candidate.title) === "aynı film").length,
    0
  );
  assert.equal(
    ranked.filter((entry) => foldTitle(entry.candidate.title) === "ayni film").length,
    1
  );
});

test("rankRecommendations respects the limit", () => {
  const profile = buildTasteProfile(notes);
  const pool = Array.from({ length: 20 }, (_, i) =>
    candidate({ title: `Film ${i}`, category: "movies", authorId: `a${i}` })
  );
  assert.equal(rankRecommendations(pool, profile, 5).length, 5);
});

test("describeRecommendationReason reads as a short sentence", () => {
  assert.equal(
    describeRecommendationReason({ kind: "tag", tag: "japonya" }),
    "#japonya etiketli notlarına benziyor"
  );
  assert.equal(
    describeRecommendationReason({ kind: "category", category: "movies" }),
    "Film notlarına göre"
  );
});
