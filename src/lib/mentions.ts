/**
 * `@username` mentions in comments. Pure helpers shared by the comments API (who to
 * notify), the comment renderer (which tokens become profile links) and the composer
 * (which word the suggestion popover is completing).
 *
 * Usernames are lowercase `[a-z0-9_]`, 3–30 characters (register allows 30, settings
 * 20), so a token is matched case-insensitively and lowercased. The `@` must not
 * follow a letter or digit (`ali@mail.com` is not a mention) and the name ends at the
 * first character that cannot be part of a username (`@ahmet'in` → `ahmet`).
 */

export const MAX_MENTIONS_PER_COMMENT = 5;

/* Built with `new RegExp` because the TS target (es5) rejects the `u` flag in
   literals. No lookbehind (Safari < 16.4): group 1 captures the character before `@`. */
const MENTION_SOURCE = "(^|[^\\p{L}\\p{N}_@])@([A-Za-z0-9_]{3,30})(?![\\p{L}\\p{N}_])";
const ACTIVE_MENTION = new RegExp("(^|[^\\p{L}\\p{N}_@])@([\\p{L}\\p{N}_]{0,30})$", "u");
const WORD_CHAR = new RegExp("[\\p{L}\\p{N}_]", "u");

type MentionMatch = { index: number; value: string; username: string };

function findMentions(text: string): MentionMatch[] {
  const pattern = new RegExp(MENTION_SOURCE, "gu");
  const found: MentionMatch[] = [];
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    const index = match.index + match[1].length;
    found.push({ index, value: text.slice(index, pattern.lastIndex), username: match[2] });
  }
  return found;
}

export type MentionSegment =
  | { type: "text"; value: string }
  | { type: "mention"; value: string; username: string };

/** Unique lowercased usernames in order of appearance, at most `max`. */
export function extractMentions(text: string, max = MAX_MENTIONS_PER_COMMENT): string[] {
  const found: string[] = [];
  if (!text || max <= 0) return found;

  for (const match of findMentions(text)) {
    const username = match.username.toLowerCase();
    if (!found.includes(username)) {
      found.push(username);
      if (found.length >= max) break;
    }
  }

  return found;
}

/**
 * Splits text into plain runs and mention tokens. With `known`, only those usernames
 * become mention segments; everything else stays text.
 */
export function splitMentions(text: string, known?: Iterable<string> | null): MentionSegment[] {
  const allowed = known ? new Set(Array.from(known).map((name) => name.toLowerCase())) : null;
  const segments: MentionSegment[] = [];
  let last = 0;

  for (const match of findMentions(text)) {
    const username = match.username.toLowerCase();
    if (allowed && !allowed.has(username)) continue;

    if (match.index > last) segments.push({ type: "text", value: text.slice(last, match.index) });
    segments.push({ type: "mention", value: match.value, username });
    last = match.index + match.value.length;
  }

  if (last < text.length) segments.push({ type: "text", value: text.slice(last) });
  return segments;
}

/**
 * The mention being typed at the caret: `@` at the start or after a non-word
 * character, followed by up to 30 letters/digits/underscores (any script, so "@ayşe"
 * can still match a display name). Returns null when the caret is not in one.
 */
export function getActiveMention(
  text: string,
  caret: number
): { query: string; start: number } | null {
  if (caret < 0 || caret > text.length) return null;

  const before = text.slice(0, caret);
  const match = ACTIVE_MENTION.exec(before);
  if (!match) return null;

  const start = caret - match[2].length - 1;
  return { query: match[2], start };
}

/**
 * Replaces the mention being typed (from `start` up to the end of the word at
 * `caret`, so "@ah|met" completes the whole word) with `@username ` and returns the
 * new text plus the caret after it.
 */
export function insertMention(
  text: string,
  start: number,
  caret: number,
  username: string
): { text: string; caret: number } {
  let end = caret;
  while (end < text.length && WORD_CHAR.test(text[end])) end += 1;

  const rest = text.slice(end).replace(/^ /, "");
  const token = `@${username} `;
  return { text: text.slice(0, start) + token + rest, caret: start + token.length };
}
