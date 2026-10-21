import assert from "node:assert/strict";
import test from "node:test";

import { RESERVED_USERNAMES, isReservedUsername } from "../src/lib/usernames.ts";

test("isReservedUsername refuses names that collide with static routes", () => {
  assert.equal(isReservedUsername("settings"), true);
  assert.equal(isReservedUsername("search"), true);
  assert.equal(isReservedUsername("me"), true);
});

test("isReservedUsername allows ordinary names, including ones that only contain a reserved word", () => {
  assert.equal(isReservedUsername("ahmet"), false);
  assert.equal(isReservedUsername("settings_fan"), false);
  assert.equal(isReservedUsername("research"), false);
  assert.equal(isReservedUsername(""), false);
});

test("RESERVED_USERNAMES only holds normalized (lower-case) names", () => {
  for (const name of RESERVED_USERNAMES) {
    assert.match(name, /^[a-z0-9_]+$/);
  }
});
