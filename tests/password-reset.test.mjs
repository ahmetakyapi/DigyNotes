import assert from "node:assert/strict";
import test from "node:test";

import {
  PASSWORD_RESET_TTL_MS,
  createPasswordResetToken,
  parsePasswordResetToken,
  verifyPasswordResetToken,
} from "../src/lib/password-reset.ts";

const SECRET = "test-secret";
const NOW = 1_760_000_000_000;
const HASH = "$2a$12$abcdefghijklmnopqrstuv";

function makeToken(overrides = {}) {
  return createPasswordResetToken({
    userId: "cluser123",
    passwordHash: HASH,
    secret: SECRET,
    now: NOW,
    ...overrides,
  });
}

function verify(token, overrides = {}) {
  return verifyPasswordResetToken(token, {
    secret: SECRET,
    now: NOW + 1000,
    getPasswordHash: (userId) => (userId === "cluser123" ? HASH : null),
    ...overrides,
  });
}

test("a fresh token verifies and returns the user id", async () => {
  const result = await verify(makeToken());
  assert.deepEqual(result, {
    ok: true,
    userId: "cluser123",
    expiresAt: NOW + PASSWORD_RESET_TTL_MS,
  });
});

test("token is URL safe", () => {
  assert.match(makeToken(), /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
});

test("an expired token is rejected", async () => {
  const token = makeToken();
  const result = await verify(token, { now: NOW + PASSWORD_RESET_TTL_MS });
  assert.deepEqual(result, { ok: false, reason: "expired" });
});

test("custom ttl is honoured", async () => {
  const token = makeToken({ ttlMs: 5000 });
  assert.equal((await verify(token, { now: NOW + 4999 })).ok, true);
  assert.equal((await verify(token, { now: NOW + 5000 })).ok, false);
});

test("a tampered payload is rejected", async () => {
  const [, signature] = makeToken().split(".");
  const forgedPayload = Buffer.from(`cluser123.${NOW + 10 * PASSWORD_RESET_TTL_MS}`).toString(
    "base64url"
  );
  const result = await verify(`${forgedPayload}.${signature}`);
  assert.deepEqual(result, { ok: false, reason: "invalid" });
});

test("a tampered signature is rejected", async () => {
  const [payload, signature] = makeToken().split(".");
  const bytes = Buffer.from(signature, "base64url");
  bytes[0] ^= 1;
  const result = await verify(`${payload}.${bytes.toString("base64url")}`);
  assert.deepEqual(result, { ok: false, reason: "invalid" });
});

test("a token signed with another secret is rejected", async () => {
  const token = makeToken({ secret: "other-secret" });
  assert.deepEqual(await verify(token), { ok: false, reason: "invalid" });
});

test("the token dies once the password changes (single use)", async () => {
  const token = makeToken();
  const result = await verify(token, { getPasswordHash: () => "$2a$12$new-hash" });
  assert.deepEqual(result, { ok: false, reason: "invalid" });
});

test("an unknown user is rejected", async () => {
  const token = makeToken({ userId: "ghost" });
  assert.deepEqual(await verify(token), { ok: false, reason: "invalid" });
});

test("malformed tokens are rejected without a lookup", async () => {
  let lookups = 0;
  const getPasswordHash = () => {
    lookups += 1;
    return HASH;
  };
  for (const token of [
    undefined,
    null,
    42,
    "",
    "abc",
    "a.b.c",
    "!!!.???",
    `${Buffer.from("nodot").toString("base64url")}.${"A".repeat(43)}`,
    `${Buffer.from("user.notanumber").toString("base64url")}.${"A".repeat(43)}`,
    `${Buffer.from(`user.${NOW}`).toString("base64url")}.short`,
    "x".repeat(600),
  ]) {
    assert.deepEqual(await verify(token, { getPasswordHash }), {
      ok: false,
      reason: "malformed",
    });
  }
  assert.equal(lookups, 0);
});

test("parsePasswordResetToken reads user id and expiry", () => {
  const parsed = parsePasswordResetToken(makeToken());
  assert.equal(parsed.userId, "cluser123");
  assert.equal(parsed.expiresAt, NOW + PASSWORD_RESET_TTL_MS);
  assert.equal(parsed.signature.length, 32);
});

test("createPasswordResetToken refuses an empty secret", () => {
  assert.throws(() => makeToken({ secret: "" }));
});
