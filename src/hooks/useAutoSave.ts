"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { clearLegacyLocalDrafts, getLocalDraftKey } from "@/lib/local-drafts";
import { isBlankOrTemplateContent } from "@/lib/post-templates";

const AUTOSAVE_INTERVAL_MS = 30_000; // 30 saniye
const DRAFT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export interface DraftData {
  title: string;
  category: string;
  rating: number;
  status: string;
  image: string;
  content: string;
  creator: string;
  years: string;
  hasSpoiler: boolean;
  lat: number | null;
  lng: number | null;
  locationLabel: string;
  tags: string[];
  externalRating: number | null;
  imagePosition: string;
  savedAt: number;
}

/** A draft worth keeping: something the user typed, not just the untouched template. */
function draftHasUserInput(draft: Omit<DraftData, "savedAt">) {
  return Boolean(
    draft.title.trim() ||
    draft.image.trim() ||
    draft.creator.trim() ||
    draft.tags.length > 0 ||
    !isBlankOrTemplateContent(draft.content)
  );
}

/**
 * Local draft of the composer, scoped to the signed-in user (`digynotes-draft:<userId>`).
 * Until the session is known nothing is loaded or saved (`isReady` stays false), so one
 * account's half-written note never opens in another account on the same browser.
 */
export function useAutoSave(postId?: string) {
  const { data: session, status } = useSession();
  const userId = status === "authenticated" ? (session?.user?.id ?? null) : null;
  const key = userId ? getLocalDraftKey(userId, postId) : null;

  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const draftRef = useRef<DraftData | null>(null);

  // Drafts from before the per-user keys can't be attributed to anyone.
  useEffect(() => {
    clearLegacyLocalDrafts();
  }, []);

  const saveDraft = useCallback(() => {
    if (!key || !draftRef.current) return false;
    if (!draftHasUserInput(draftRef.current)) return false;

    const data: DraftData = { ...draftRef.current, savedAt: Date.now() };

    try {
      localStorage.setItem(key, JSON.stringify(data));
      setLastSavedAt(data.savedAt);
      setHasUnsavedChanges(false);
      return true;
    } catch {
      // localStorage dolu ya da kapalı olabilir
      return false;
    }
  }, [key]);

  const updateDraft = useCallback((data: Omit<DraftData, "savedAt">) => {
    draftRef.current = { ...data, savedAt: Date.now() };
    setHasUnsavedChanges(true);
  }, []);

  const loadDraft = useCallback((): DraftData | null => {
    if (!key) return null;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as DraftData;
      if (!parsed.savedAt || Date.now() - parsed.savedAt > DRAFT_MAX_AGE_MS) {
        localStorage.removeItem(key);
        return null;
      }
      if (!draftHasUserInput(parsed)) return null;
      return { ...parsed, tags: Array.isArray(parsed.tags) ? parsed.tags : [] };
    } catch {
      return null;
    }
  }, [key]);

  const clearDraft = useCallback(() => {
    if (key) {
      try {
        localStorage.removeItem(key);
      } catch {
        // ignore
      }
    }
    setLastSavedAt(null);
    setHasUnsavedChanges(false);
    draftRef.current = null;
  }, [key]);

  // Periyodik kaydetme
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const interval = setInterval(() => {
      if (draftRef.current) saveDraft();
    }, AUTOSAVE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [saveDraft, hasUnsavedChanges]);

  // Sayfa kapanırken kaydet
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (draftRef.current && hasUnsavedChanges) saveDraft();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [saveDraft, hasUnsavedChanges]);

  return {
    /** True once the signed-in user is known; drafts load and save only then. */
    isReady: key !== null,
    updateDraft,
    saveDraft,
    loadDraft,
    clearDraft,
    lastSavedAt,
    hasUnsavedChanges,
  };
}
