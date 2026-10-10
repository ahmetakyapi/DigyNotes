"use client";

import toast from "react-hot-toast";

type ConfirmToastOptions = {
  confirmLabel?: string;
  cancelLabel?: string;
  /** "danger" paints the confirm button red (delete, discard). */
  tone?: "default" | "danger";
  /** One question per id: asking again replaces the open one instead of stacking. */
  id?: string;
};

/**
 * A yes/no question as a toast in the corner (top-right, where every other toast lives),
 * instead of the browser's native `window.confirm` box, which blocks the page, can't be
 * styled and reads like an error. Resolves `true` on confirm, `false` on cancel/dismiss.
 */
export function confirmToast(message: string, options: ConfirmToastOptions = {}) {
  const { confirmLabel = "Tamam", cancelLabel = "Vazgeç", tone = "default", id } = options;

  return new Promise<boolean>((resolve) => {
    let settled = false;
    const settle = (value: boolean, toastId: string) => {
      if (settled) return;
      settled = true;
      toast.dismiss(toastId);
      resolve(value);
    };

    toast.custom(
      (t) => (
        <div
          role="alertdialog"
          aria-live="assertive"
          className={`pointer-events-auto w-[min(360px,calc(100vw-2rem))] rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-[0_18px_50px_-20px_rgba(0,0,0,0.55)] transition-all duration-200 ${
            t.visible ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0"
          }`}
        >
          <p className="text-[14px] leading-relaxed text-[var(--text-primary)]">{message}</p>
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => settle(false, t.id)}
              className="cursor-pointer rounded-full px-3.5 py-1.5 text-[13px] font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              autoFocus
              onClick={() => settle(true, t.id)}
              className={`cursor-pointer rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 ${
                tone === "danger"
                  ? "bg-danger text-[var(--bg-base)] hover:bg-danger/90 focus-visible:ring-danger/40"
                  : "bg-accent text-[var(--text-on-accent)] hover:bg-accent-dark focus-visible:ring-accent/40"
              }`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      ),
      { id, duration: Infinity }
    );
  });
}
