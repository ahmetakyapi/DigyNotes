"use client";

import toast from "react-hot-toast";
import { ClockCounterClockwiseIcon, XIcon } from "@phosphor-icons/react";

/** Small "İsteğe bağlı" pill next to a field label (owner, 2026-10-13). */
export function OptionalHint() {
  return (
    <span className="ml-1.5 inline-flex items-center rounded-full border border-[var(--border)] px-1.5 py-px align-middle text-[11px] font-medium text-[var(--text-muted)]">
      İsteğe bağlı
    </span>
  );
}

/**
 * Scrolls a composer field into view and focuses it. `#…` ids of a Quill wrapper focus its
 * editable area. Returns false when the field is not on the page.
 */
export function focusComposerField(elementId: string) {
  const root = document.getElementById(elementId);
  if (!root) return false;
  const target =
    root.querySelector<HTMLElement>(".ql-editor") ??
    (root.matches("input, select, textarea") ? root : root.querySelector<HTMLElement>("input"));
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  root.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
  (target ?? root).focus({ preventScroll: true });
  return true;
}

/** A toast with a "Geri Al" button, e.g. after a template replaced or left the editor. */
export function showUndoToast(message: string, onUndo: () => void, id = "composer-undo") {
  toast.custom(
    (t) => (
      <div
        role="status"
        aria-live="polite"
        className={`pointer-events-auto flex w-[min(360px,calc(100vw-2rem))] items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] py-3 pl-4 pr-2 shadow-[var(--shadow-soft)] transition-all duration-200 ${
          t.visible ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0"
        }`}
      >
        <p className="min-w-0 flex-1 text-[13.5px] leading-snug text-[var(--text-primary)]">
          {message}
        </p>
        <button
          type="button"
          onClick={() => {
            onUndo();
            toast.dismiss(t.id);
          }}
          className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1.5 text-[12.5px] font-semibold text-[var(--gold)] transition-colors hover:bg-accent/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        >
          <ClockCounterClockwiseIcon size={13} weight="bold" aria-hidden />
          Geri Al
        </button>
        <button
          type="button"
          onClick={() => toast.dismiss(t.id)}
          aria-label="Bildirimi kapat"
          className="inline-flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        >
          <XIcon size={12} weight="bold" aria-hidden />
        </button>
      </div>
    ),
    { id, duration: 7000 }
  );
}

function formatDraftAge(savedAt: number) {
  const minutes = Math.floor((Date.now() - savedAt) / 60_000);
  if (minutes < 1) return "az önce";
  if (minutes < 60) return `${minutes} dakika önce`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} saat önce`;
  return `${Math.floor(hours / 24)} gün önce`;
}

/* LAYOUT: one-line notice above the form — restored-draft message + age left,
   "Taslağı Sil" (resets the composer) and a close button right. */
export function RestoredDraftBanner({
  savedAt,
  onDiscard,
  onDismiss,
}: {
  readonly savedAt: number;
  readonly onDiscard: () => void;
  readonly onDismiss: () => void;
}) {
  return (
    <div
      role="status"
      className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-accent/25 bg-accent/10 py-2.5 pl-4 pr-2"
    >
      <ClockCounterClockwiseIcon size={16} weight="bold" className="shrink-0 text-[var(--gold)]" />
      <p className="min-w-0 flex-1 text-[13.5px] text-[var(--text-primary)]">
        Yarım kalan taslağın geri yüklendi
        <span className="ml-1.5 text-[12.5px] font-medium text-[var(--text-muted)]">
          · {formatDraftAge(savedAt)} kaydedildi
        </span>
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onDiscard}
          className="cursor-pointer rounded-full border border-[var(--border)] bg-[var(--bg-card)] px-3.5 py-1.5 text-[12.5px] font-medium text-[var(--text-secondary)] transition-colors duration-200 hover:border-danger/40 hover:text-[var(--danger)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 active:scale-95"
        >
          Taslağı Sil
        </button>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Bildirimi kapat"
          className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        >
          <XIcon size={13} weight="bold" aria-hidden />
        </button>
      </div>
    </div>
  );
}
