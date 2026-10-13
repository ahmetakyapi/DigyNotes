/**
 * Stateless password-reset tokens (no table, no schema change).
 *
 * token = base64url("<userId>.<expiresAtMs>") + "." + base64url(HMAC-SHA256(secret,
 *         "<userId>.<expiresAtMs>.<current password hash>"))
 *
 * Signing over the current password hash makes a token single-use: once the password
 * changes, the hash changes and every earlier link stops verifying. Pure apart from the
 * injected `getPasswordHash` lookup, so it is unit-tested in tests/password-reset.test.mjs.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

export const PASSWORD_RESET_TTL_MS = 60 * 60_000;

export type PasswordResetFailure = "malformed" | "expired" | "invalid";

export type PasswordResetVerification =
  | { ok: true; userId: string; expiresAt: number }
  | { ok: false; reason: PasswordResetFailure };

function toBase64Url(value: string | Buffer) {
  return Buffer.from(value).toString("base64url");
}

function sign(secret: string, userId: string, expiresAt: number, passwordHash: string) {
  return createHmac("sha256", secret).update(`${userId}.${expiresAt}.${passwordHash}`).digest();
}

export function createPasswordResetToken(input: {
  userId: string;
  passwordHash: string;
  secret: string;
  now?: number;
  ttlMs?: number;
}) {
  if (!input.secret) throw new Error("Password reset secret is missing");
  if (!input.userId || input.userId.includes(".")) throw new Error("Invalid user id");

  const expiresAt = (input.now ?? Date.now()) + (input.ttlMs ?? PASSWORD_RESET_TTL_MS);
  const payload = toBase64Url(`${input.userId}.${expiresAt}`);
  const signature = toBase64Url(sign(input.secret, input.userId, expiresAt, input.passwordHash));
  return `${payload}.${signature}`;
}

/** Splits a token into its parts without checking the signature. Null when malformed. */
export function parsePasswordResetToken(token: unknown) {
  if (typeof token !== "string" || token.length > 512) return null;

  const parts = token.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  if (!/^[A-Za-z0-9_-]+$/.test(parts[0]) || !/^[A-Za-z0-9_-]+$/.test(parts[1])) return null;

  const payload = Buffer.from(parts[0], "base64url").toString("utf8");
  const dot = payload.lastIndexOf(".");
  if (dot <= 0) return null;

  const userId = payload.slice(0, dot);
  const expiresRaw = payload.slice(dot + 1);
  if (!/^\d{1,16}$/.test(expiresRaw)) return null;

  const signature = Buffer.from(parts[1], "base64url");
  if (signature.length !== 32) return null;

  return { userId, expiresAt: Number(expiresRaw), signature };
}

export async function verifyPasswordResetToken(
  token: unknown,
  options: {
    secret: string;
    now?: number;
    getPasswordHash: (userId: string) => Promise<string | null> | string | null;
  }
): Promise<PasswordResetVerification> {
  if (!options.secret) throw new Error("Password reset secret is missing");

  const parsed = parsePasswordResetToken(token);
  if (!parsed) return { ok: false, reason: "malformed" };

  if (parsed.expiresAt <= (options.now ?? Date.now())) return { ok: false, reason: "expired" };

  const passwordHash = await options.getPasswordHash(parsed.userId);
  if (!passwordHash) return { ok: false, reason: "invalid" };

  const expected = sign(options.secret, parsed.userId, parsed.expiresAt, passwordHash);
  if (!timingSafeEqual(expected, parsed.signature)) return { ok: false, reason: "invalid" };

  return { ok: true, userId: parsed.userId, expiresAt: parsed.expiresAt };
}
