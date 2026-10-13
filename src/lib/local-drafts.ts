/**
 * Browser-stored note drafts (`useAutoSave`, keys starting with "digynotes-draft").
 * Minimal version: only what sign-out needs.
 */

const LOCAL_DRAFT_PREFIX = "digynotes-draft";

/** Removes every locally saved draft. No-op on the server or when storage is blocked. */
export function clearAllLocalDrafts(): void {
  if (typeof window === "undefined") return;
  try {
    const storage = window.localStorage;
    const keys: string[] = [];
    for (let i = 0; i < storage.length; i += 1) {
      const key = storage.key(i);
      if (key?.startsWith(LOCAL_DRAFT_PREFIX)) keys.push(key);
    }
    keys.forEach((key) => storage.removeItem(key));
  } catch {
    // Storage unavailable (private mode, blocked site data): nothing to clear.
  }
}
