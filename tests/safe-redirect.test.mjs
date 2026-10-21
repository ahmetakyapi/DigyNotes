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
    "http://digynotes.com/notifications",
    "https://digynotes.com.evil.com/notifications",
    "https://digynotes.com@evil.com/notifications",
    "https://evil.com/https://digynotes.com/notifications",
    "https://digynotes.com//evil.com",
    "https://digynotes.com/..//evil.com",
    "https:evil.com",
    "ftp://digynotes.com/notifications",
  ]) {
    assert.equal(getSafeCallbackPath(raw, ORIGIN), "/notes", raw);
  }
});

test("getSafeCallbackPath accepts absolute same-origin URLs (next-auth's bare signIn())", () => {
  assert.equal(getSafeCallbackPath("https://digynotes.com/notes", ORIGIN), "/notes");
  assert.equal(
    getSafeCallbackPath("https://digynotes.com/notifications?tab=all#top", ORIGIN),
    "/notifications?tab=all#top"
  );
  assert.equal(getSafeCallbackPath("HTTPS://DIGYNOTES.COM/stats", ORIGIN), "/stats");
  assert.equal(getSafeCallbackPath("https://digynotes.com:443/feed", ORIGIN), "/feed");
  assert.equal(
    getSafeCallbackPath("http://localhost:4300/notifications", "http://localhost:4300"),
    "/notifications"
  );
  assert.equal(getSafeCallbackPath("https://digynotes.com/api/posts", ORIGIN), "/notes");
  assert.equal(getSafeCallbackPath("https://digynotes.com/login", ORIGIN), "/notes");
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
