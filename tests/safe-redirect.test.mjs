import assert from "node:assert/strict";
import test from "node:test";

import { getSafeCallbackPath } from "../src/lib/safe-redirect.ts";

const ORIGIN = "https://digynotes.com";

test("getSafeCallbackPath keeps same-origin page paths with search and hash", () => {
  assert.equal(getSafeCallbackPath("/notifications", ORIGIN), "/notifications");
  assert.equal(getSafeCallbackPath("/posts/abc/edit", ORIGIN), "/posts/abc/edit");
  assert.equal(
    getSafeCallbackPath("/notes?tab=kaydedilenler#x", ORIGIN),
    "/notes?tab=kaydedilenler#x"
  );
  assert.equal(getSafeCallbackPath("/stats/2026", ORIGIN), "/stats/2026");
});

test("getSafeCallbackPath falls back when the value is missing", () => {
  assert.equal(getSafeCallbackPath(null, ORIGIN), "/notes");
  assert.equal(getSafeCallbackPath(undefined, ORIGIN), "/notes");
  assert.equal(getSafeCallbackPath("", ORIGIN), "/notes");
  assert.equal(getSafeCallbackPath("   ", ORIGIN), "/notes");
});

test("getSafeCallbackPath blocks open redirects", () => {
  for (const raw of [
    "https://evil.com/notes",
    "//evil.com",
    "/\\evil.com",
    "\\\\evil.com",
    "javascript:alert(1)",
    "evil.com",
    "/..//evil.com",
    "/.//evil.com",
    "/a/..//evil.com",
    "/\t/evil.com",
    "https://digynotes.com/notes",
  ]) {
    assert.equal(getSafeCallbackPath(raw, ORIGIN), "/notes", raw);
  }
});

test("getSafeCallbackPath skips API routes and the auth pages", () => {
  assert.equal(getSafeCallbackPath("/api/posts/abc", ORIGIN), "/notes");
  assert.equal(getSafeCallbackPath("/api", ORIGIN), "/notes");
  assert.equal(getSafeCallbackPath("/login", ORIGIN), "/notes");
  assert.equal(getSafeCallbackPath("/login?callbackUrl=%2Fnotes", ORIGIN), "/notes");
  assert.equal(getSafeCallbackPath("/register", ORIGIN), "/notes");
  assert.equal(getSafeCallbackPath("/apiary", ORIGIN), "/apiary");
});

test("getSafeCallbackPath honours a custom fallback", () => {
  assert.equal(getSafeCallbackPath("//evil.com", ORIGIN, "/"), "/");
});
