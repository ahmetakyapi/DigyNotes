import React, { useEffect } from "react";
import { useFocusTrap } from "@/hooks/useFocusTrap";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Sil",
  cancelLabel = "Vazgeç",
  variant = "danger",
}) => {
  const trapRef = useFocusTrap(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div ref={trapRef} className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-2xl">
        <h3 id="confirm-modal-title" className="mb-2 text-base font-bold text-[var(--text-primary)]">{title}</h3>
        <p className="mb-6 text-sm leading-relaxed text-[var(--text-secondary)]">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-3 text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`rounded-md px-5 py-3 text-sm font-semibold text-white transition-colors ${
              variant === "danger"
                ? "bg-[#e53e3e] hover:bg-red-500"
                : "bg-[var(--gold)] hover:bg-[var(--gold-light)]"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
