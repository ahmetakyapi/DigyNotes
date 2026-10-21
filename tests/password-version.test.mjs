import assert from "node:assert/strict";
import test from "node:test";

import { isCurrentPasswordVersion, passwordVersion } from "../src/lib/password-version.ts";

const HASH = "$2a$12$abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQ";
const NEW_HASH = "$2a$12$zyxwvutsrqponmlkjihgfedcba9876543210ZYXWVUTSRQPONMLKJ";

test("passwordVersion is a stable 16-character base64url fingerprint", () => {
  const version = passwordVersion(HASH);
  assert.equal(version.length, 16);
  assert.match(version, /^[A-Za-z0-9_-]{16}$/);
  assert.equal(passwordVersion(HASH), version);
});

test("a new password hash gives a new version", () => {
  assert.notEqual(passwordVersion(HASH), passwordVersion(NEW_HASH));
});

test("isCurrentPasswordVersion accepts the version of the stored hash", () => {
  assert.equal(isCurrentPasswordVersion(passwordVersion(HASH), HASH), true);
});

test("isCurrentPasswordVersion rejects a session opened before the password changed", () => {
  assert.equal(isCurrentPasswordVersion(passwordVersion(HASH), NEW_HASH), false);
});

test("isCurrentPasswordVersion rejects tokens without a version", () => {
  assert.equal(isCurrentPasswordVersion(undefined, HASH), false);
  assert.equal(isCurrentPasswordVersion(null, HASH), false);
  assert.equal(isCurrentPasswordVersion("", HASH), false);
  assert.equal(isCurrentPasswordVersion(123, HASH), false);
});

test("isCurrentPasswordVersion rejects a missing stored hash", () => {
  const version = passwordVersion(HASH);
  assert.equal(isCurrentPasswordVersion(version, null), false);
  assert.equal(isCurrentPasswordVersion(version, undefined), false);
  assert.equal(isCurrentPasswordVersion(version, ""), false);
});
