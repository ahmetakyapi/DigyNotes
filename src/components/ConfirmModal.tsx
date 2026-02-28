import React, { useEffect } from "react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
}) => {
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
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-2xl">
        <h3 className="mb-2 text-base font-bold text-[var(--text-primary)]">{title}</h3>
        <p className="mb-6 text-sm leading-relaxed text-[var(--text-secondary)]">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-3 text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
          >
            Vazgeç
          </button>
          <button
            onClick={onConfirm}
            className="rounded-md bg-[#e53e3e] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-500"
          >
            Sil
          </button>
        </div>
      </div>
    </div>
  );
};
