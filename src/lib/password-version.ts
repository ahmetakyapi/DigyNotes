/**
 * Session binding to the current password (no table, no schema change).
 *
 * The session JWT carries `pwv`, a short fingerprint of the stored bcrypt hash taken at
 * sign-in (src/lib/auth.ts). bcrypt re-salts on every reset or change, so the stored hash
 * — and with it the fingerprint — changes, and every session opened before it stops
 * resolving. Only the fingerprint goes into the token, never the hash. Pure, so it is
 * unit-tested in tests/password-version.test.mjs.
 */

import { createHash } from "node:crypto";

export function passwordVersion(passwordHash: string) {
  return createHash("sha256").update(passwordHash).digest("base64url").slice(0, 16);
}

/** True only when the token's fingerprint matches the stored hash; a missing one never does. */
export function isCurrentPasswordVersion(
  tokenVersion: unknown,
  passwordHash: string | null | undefined
) {
  if (typeof tokenVersion !== "string" || !tokenVersion || !passwordHash) return false;
  return tokenVersion === passwordVersion(passwordHash);
}
