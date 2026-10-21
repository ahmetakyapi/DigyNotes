/**
 * Composer drafts in localStorage. Every key starts with `digynotes-draft` and carries the
 * signed-in user's id, so a draft never shows up for another account on the same browser.
 * The old unscoped keys (`digynotes-draft`, `digynotes-draft-<postId>`) are dropped.
 */
export const LOCAL_DRAFT_PREFIX = "digynotes-draft";

type DraftStorage = Pick<Storage, "length" | "key" | "removeItem">;

function getBrowserStorage(): DraftStorage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function getLocalDraftKey(userId: string, postId?: string) {
  return postId ? `${LOCAL_DRAFT_PREFIX}:${userId}:${postId}` : `${LOCAL_DRAFT_PREFIX}:${userId}`;
}

function removeKeys(storage: DraftStorage, shouldRemove: (key: string) => boolean) {
  const keys: string[] = [];
  for (let i = 0; i < storage.length; i += 1) {
    const key = storage.key(i);
    if (key && shouldRemove(key)) keys.push(key);
  }
  keys.forEach((key) => storage.removeItem(key));
  return keys.length;
}

/** Drops drafts saved before keys were scoped per user. Returns how many were removed. */
export function clearLegacyLocalDrafts(storage: DraftStorage | null = getBrowserStorage()) {
  if (!storage) return 0;
  try {
    return removeKeys(
      storage,
      (key) => key === LOCAL_DRAFT_PREFIX || key.startsWith(`${LOCAL_DRAFT_PREFIX}-`)
    );
  } catch {
    return 0;
  }
}

let localDraftWritesBlocked = false;

/**
 * True once sign-out has started: an open composer must not write its draft back on unload.
 * Module state, so it resets with the full page load that sign-out ends in.
 */
export function areLocalDraftWritesBlocked() {
  return localDraftWritesBlocked;
}

/** Removes every composer draft on this browser (called on sign-out) and blocks new ones. */
export function clearAllLocalDrafts(storage: DraftStorage | null = getBrowserStorage()) {
  localDraftWritesBlocked = true;
  if (!storage) return 0;
  try {
    return removeKeys(storage, (key) => key.startsWith(LOCAL_DRAFT_PREFIX));
  } catch {
    return 0;
  }
}
