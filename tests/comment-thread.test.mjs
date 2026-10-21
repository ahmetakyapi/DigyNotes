import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCommentTree,
  collectCommentBranchIds,
  decodeCommentCursor,
  encodeCommentCursor,
  mergeComments,
  resolveReplyParent,
} from "../src/lib/comment-thread.ts";
import { formatRelativeTime } from "../src/lib/relative-time.ts";

const c = (id, parentId, minute) => ({
  id,
  parentId,
  createdAt: new Date(Date.UTC(2026, 9, 1, 12, minute)).toISOString(),
});

test("buildCommentTree puts the newest root first and replies in order", () => {
  const tree = buildCommentTree([
    c("a", null, 1),
    c("b", null, 5),
    c("a2", "a", 4),
    c("a1", "a", 2),
    c("a1x", "a1", 3),
  ]);
  assert.deepEqual(
    tree.map((n) => n.id),
    ["b", "a"]
  );
  assert.deepEqual(
    tree[1].replies.map((n) => n.id),
    ["a1", "a2"]
  );
  assert.equal(tree[1].replies[0].replies[0].id, "a1x");
});

test("buildCommentTree keeps orphans as roots", () => {
  assert.deepEqual(
    buildCommentTree([c("x", "gone", 1)]).map((n) => n.id),
    ["x"]
  );
});

test("collectCommentBranchIds walks every level", () => {
  const items = [c("a", null, 1), c("b", "a", 2), c("d", "b", 3), c("e", null, 4)];
  assert.deepEqual([...collectCommentBranchIds(items, "a")].sort(), ["a", "b", "d"]);
});

test("mergeComments replaces duplicates instead of repeating them", () => {
  const merged = mergeComments([c("a", null, 1), c("b", null, 2)], [c("b", null, 9)]);
  assert.equal(merged.length, 2);
  assert.equal(merged.find((item) => item.id === "b").createdAt, c("b", null, 9).createdAt);
});

test("comment cursors round-trip and reject garbage", () => {
  const cursor = encodeCommentCursor("2026-10-01T12:00:00.000Z", "ckabc123");
  assert.deepEqual(decodeCommentCursor(cursor), {
    createdAt: new Date("2026-10-01T12:00:00.000Z"),
    id: "ckabc123",
  });
  assert.equal(decodeCommentCursor("nope"), null);
  assert.equal(decodeCommentCursor("bad-date_id"), null);
  assert.equal(decodeCommentCursor(null), null);
});

/* A straight chain c0 (root) ← c1 ← … ← c<length-1>; the lookup counts its calls. */
function chain(length) {
  const parents = new Map();
  for (let i = 0; i < length; i += 1) parents.set(`c${i}`, i === 0 ? null : `c${i - 1}`);
  const lookup = async (id) => {
    lookup.calls += 1;
    return parents.has(id) ? parents.get(id) : undefined;
  };
  lookup.calls = 0;
  const node = (depth) => ({ id: `c${depth}`, parentId: parents.get(`c${depth}`) });
  return { lookup, node };
}

test("resolveReplyParent keeps replies inside the levels the loader reads", async () => {
  const maxDepth = 12;
  const { lookup, node } = chain(14);

  /* Reply to a root: no lookup, stored under it. */
  assert.equal(await resolveReplyParent(node(0), maxDepth, lookup), "c0");
  assert.equal(lookup.calls, 0);

  /* Parent at depth 11: the reply lands on level 12, the last one loaded. */
  assert.equal(await resolveReplyParent(node(11), maxDepth, lookup), "c11");

  /* Parent at depth 12: a reply would be level 13, so it hangs on c11 (level 12). */
  assert.equal(await resolveReplyParent(node(12), maxDepth, lookup), "c11");

  for (let depth = 0; depth <= 12; depth += 1) {
    const anchor = await resolveReplyParent(node(depth), maxDepth, lookup);
    const replyLevel = Number(anchor.slice(1)) + 1;
    assert.ok(replyLevel <= maxDepth, `reply to depth ${depth} lands on level ${replyLevel}`);
  }
});

test("resolveReplyParent walks at most maxDepth levels up", async () => {
  const { lookup, node } = chain(14);
  await resolveReplyParent(node(13), 12, lookup);
  assert.ok(lookup.calls <= 12);
});

test("resolveReplyParent stops at a missing ancestor", async () => {
  const lookup = async () => undefined;
  assert.equal(await resolveReplyParent({ id: "x", parentId: "gone" }, 12, lookup), "x");
});

test("formatRelativeTime spells times out", () => {
  const now = Date.UTC(2026, 9, 13, 12, 0);
  assert.equal(formatRelativeTime(now - 20_000, now), "Az önce");
  assert.equal(formatRelativeTime(now - 5 * 60_000, now), "5 dakika önce");
  assert.equal(formatRelativeTime(now - 3 * 3_600_000, now), "3 saat önce");
  assert.equal(formatRelativeTime(now - 26 * 3_600_000, now), "Dün");
  assert.equal(formatRelativeTime(now - 3 * 86_400_000, now), "3 gün önce");
  assert.equal(formatRelativeTime(now + 60_000, now), "Az önce");
  assert.equal(formatRelativeTime("not a date", now), "");
});
