import assert from "node:assert/strict";
import test from "node:test";

import {
  buildNoteJsonLd,
  buildProfileJsonLd,
  buildSiteJsonLd,
  serializeJsonLd,
} from "../src/lib/structured-data.ts";

const SITE = "https://digy-notes.example";

const note = {
  id: "p_1",
  title: "Perfect Days",
  category: "Film",
  content: "<p>Sakin &amp; güzel.</p>",
  creator: "Wim Wenders",
  years: "2023",
  rating: 4.5,
  createdAt: new Date("2026-01-02T03:04:05Z"),
  updatedAt: "2026-02-03T04:05:06.000Z",
  tags: [{ name: "japonya" }],
  user: { name: "Elif", username: "elif" },
};

test("serializeJsonLd cannot close the script tag", () => {
  const out = serializeJsonLd({ name: "</script><script>alert(1)</script> &  " });
  assert.ok(!out.includes("<"));
  assert.ok(!out.includes(">"));
  assert.deepEqual(JSON.parse(out), { name: "</script><script>alert(1)</script> &  " });
});

test("a rated note is a Review of a typed item with a 5-point rating", () => {
  const data = buildNoteJsonLd(note, SITE);
  assert.equal(data["@type"], "Review");
  assert.deepEqual(data.itemReviewed, {
    "@type": "Movie",
    name: "Perfect Days",
    director: { "@type": "Person", name: "Wim Wenders" },
    dateCreated: "2023",
  });
  assert.equal(data.reviewRating.ratingValue, 4.5);
  assert.equal(data.reviewRating.bestRating, 5);
  assert.equal(data.reviewBody, "Sakin & güzel.");
  assert.equal(data.author.url, `${SITE}/profile/elif`);
  assert.equal(data.datePublished, "2026-01-02T03:04:05.000Z");
  assert.equal(data.url, `${SITE}/posts/p_1`);
});

test("an unrated note is an Article about the item", () => {
  const data = buildNoteJsonLd({ ...note, rating: 0, category: "book" }, SITE);
  assert.equal(data["@type"], "Article");
  assert.equal(data.reviewRating, undefined);
  assert.equal(data.about["@type"], "Book");
  assert.equal(data.about.author.name, "Wim Wenders");
});

test("category picks the schema type", () => {
  const typeOf = (category) =>
    buildNoteJsonLd({ ...note, category, lat: 41, lng: 29 }, SITE).itemReviewed["@type"];
  assert.equal(typeOf("series"), "TVSeries");
  assert.equal(typeOf("Oyun"), "VideoGame");
  assert.equal(typeOf("Kitap"), "Book");
  assert.equal(typeOf("travel"), "TouristDestination");
  assert.equal(typeOf("other"), "CreativeWork");
});

test("site and profile graphs carry absolute URLs", () => {
  const site = buildSiteJsonLd(SITE);
  assert.equal(site["@graph"][0]["@type"], "WebSite");
  assert.equal(site["@graph"][0].potentialAction, undefined);
  const profile = buildProfileJsonLd(
    {
      name: "Elif",
      username: "elif",
      avatarUrl: "data:image/png;base64,xx",
      createdAt: "2026-01-01T00:00:00.000Z",
      postCount: 3,
      followerCount: 2,
      followingCount: 1,
    },
    SITE
  );
  assert.equal(profile["@type"], "ProfilePage");
  assert.equal(profile.mainEntity.url, `${SITE}/profile/elif`);
  assert.equal(profile.mainEntity.image, undefined);
});
