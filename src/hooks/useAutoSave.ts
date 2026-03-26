"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const AUTOSAVE_KEY = "digynotes-draft";
const AUTOSAVE_INTERVAL_MS = 30_000; // 30 saniye

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

function getDraftKey(postId?: string) {
  return postId ? `${AUTOSAVE_KEY}-${postId}` : AUTOSAVE_KEY;
}

export function useAutoSave(postId?: string) {
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const draftRef = useRef<DraftData | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const key = getDraftKey(postId);

  const saveDraft = useCallback(() => {
    if (!draftRef.current) return;

    const hasContent =
      draftRef.current.title.trim() ||
      draftRef.current.content.trim() ||
      draftRef.current.image.trim();

    if (!hasContent) return;

    const data: DraftData = { ...draftRef.current, savedAt: Date.now() };

    try {
      localStorage.setItem(key, JSON.stringify(data));
      setLastSavedAt(data.savedAt);
      setHasUnsavedChanges(false);
    } catch {
      // localStorage dolu olabilir
    }
  }, [key]);

  const updateDraft = useCallback((data: Omit<DraftData, "savedAt">) => {
    draftRef.current = { ...data, savedAt: Date.now() };
    setHasUnsavedChanges(true);
  }, []);

  const loadDraft = useCallback((): DraftData | null => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as DraftData;
      if (!parsed.savedAt) return null;
      // 7 günden eski taslakları yoksay
      if (Date.now() - parsed.savedAt > 7 * 24 * 60 * 60 * 1000) {
        localStorage.removeItem(key);
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }, [key]);

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
    setLastSavedAt(null);
    setHasUnsavedChanges(false);
    draftRef.current = null;
  }, [key]);

  // Periyodik kaydetme
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      if (draftRef.current && hasUnsavedChanges) {
        saveDraft();
      }
    }, AUTOSAVE_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [saveDraft, hasUnsavedChanges]);

  // Sayfa kapanırken kaydet
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (draftRef.current && hasUnsavedChanges) {
        saveDraft();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [saveDraft, hasUnsavedChanges]);

  return {
    updateDraft,
    saveDraft,
    loadDraft,
    clearDraft,
    lastSavedAt,
    hasUnsavedChanges,
  };
}
