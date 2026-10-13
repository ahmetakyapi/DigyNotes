/**
 * Comment thread helpers for the note page. The API pages root comments newest first
 * and sends every reply of those roots; the client keeps one flat list (items carry
 * `parentId`) and builds the tree from it.
 */

export interface FlatComment {
  id: string;
  parentId: string | null;
  createdAt: string;
}

export type ThreadNode<T extends FlatComment> = T & { replies: ThreadNode<T>[] };

function byTime(a: FlatComment, b: FlatComment) {
  const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  return diff !== 0 ? diff : a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/**
 * Roots newest first (a fresh comment lands on top), replies oldest first under their
 * parent so a conversation reads top-down. A reply whose parent is missing is shown as
 * a root rather than dropped.
 */
export function buildCommentTree<T extends FlatComment>(items: T[]): ThreadNode<T>[] {
  const map = new Map<string, ThreadNode<T>>();
  const roots: ThreadNode<T>[] = [];

  items.forEach((item) => map.set(item.id, { ...item, replies: [] }));
  map.forEach((node) => {
    const parent = node.parentId ? map.get(node.parentId) : undefined;
    if (parent) parent.replies.push(node);
    else roots.push(node);
  });

  map.forEach((node) => node.replies.sort(byTime));
  return roots.sort((a, b) => byTime(b, a));
}

/** The comment and every reply below it (what a delete removes through the cascade). */
export function collectCommentBranchIds(items: FlatComment[], rootId: string) {
  const ids = new Set<string>([rootId]);
  let changed = true;

  while (changed) {
    changed = false;
    items.forEach((item) => {
      if (item.parentId && ids.has(item.parentId) && !ids.has(item.id)) {
        ids.add(item.id);
        changed = true;
      }
    });
  }

  return ids;
}

/** Adds `incoming` to `current`; an id already present is replaced by the newer copy. */
export function mergeComments<T extends FlatComment>(current: T[], incoming: T[]): T[] {
  if (incoming.length === 0) return current;
  const incomingIds = new Set(incoming.map((item) => item.id));
  return [...current.filter((item) => !incomingIds.has(item.id)), ...incoming];
}

/** Root-page cursor: creation time plus id, so equal timestamps never skip a comment. */
export function encodeCommentCursor(createdAt: Date | string, id: string) {
  return `${new Date(createdAt).toISOString()}_${id}`;
}

export function decodeCommentCursor(cursor: string | null | undefined) {
  if (!cursor) return null;
  const separator = cursor.indexOf("_");
  if (separator <= 0) return null;

  const createdAt = new Date(cursor.slice(0, separator));
  const id = cursor.slice(separator + 1);
  if (Number.isNaN(createdAt.getTime()) || !id) return null;
  return { createdAt, id };
}
