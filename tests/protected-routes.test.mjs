import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { PROTECTED_PAGE_MATCHERS, isProtectedPagePath } from "../src/lib/protected-routes.ts";

const middlewareSource = readFileSync(new URL("../src/middleware.ts", import.meta.url), "utf8");

function middlewarePageMatchers() {
  const block = middlewareSource.match(/matcher:\s*\[([\s\S]*?)\]/);
  assert.ok(block, "src/middleware.ts has a matcher array");
  return [...block[1].matchAll(/"([^"]+)"/g)]
    .map((match) => match[1])
    .filter((entry) => !entry.startsWith("/api"));
}

test("PROTECTED_PAGE_MATCHERS mirrors the page entries of the middleware matcher", () => {
  assert.deepEqual(
    [...PROTECTED_PAGE_MATCHERS].sort(),
    middlewarePageMatchers().sort(),
    "a page entry was added to or removed from src/middleware.ts: update src/lib/protected-routes.ts"
  );
});

test("private pages are protected, with or without sub-paths", () => {
  for (const pathname of [
    "/notes",
    "/notes/",
    "/saved",
    "/new-post",
    "/posts/abc123/edit",
    "/category/movies",
    "/profile/settings",
    "/feed",
    "/recommended",
    "/collections",
    "/watchlist",
    "/stats",
    "/stats/year-in-review",
    "/notifications",
    "/admin",
    "/admin/users/u1",
  ]) {
    assert.equal(isProtectedPagePath(pathname), true, pathname);
  }
});

test("public pages are not protected", () => {
  for (const pathname of [
    "/",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/offline",
    "/maintenance",
    "/discover",
    "/profile/ahmet",
    "/collections/c1",
    "/posts/abc123",
    "/tag/film",
    "/notesy",
    "/saved/extra",
    "/api/posts",
  ]) {
    assert.equal(isProtectedPagePath(pathname), false, pathname);
  }
});

test("a missing pathname is not protected", () => {
  assert.equal(isProtectedPagePath(""), false);
  assert.equal(isProtectedPagePath(null), false);
  assert.equal(isProtectedPagePath(undefined), false);
});
