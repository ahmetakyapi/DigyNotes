"use client";

import React, { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { modalBackdrop, modalPanel } from "@/lib/variants";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  /** While the confirmed action runs: both buttons are disabled and the modal stays open. */
  isLoading?: boolean;
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
  isLoading = false,
}) => {
  const trapRef = useFocusTrap(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, isLoading, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-modal-title"
        >
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={modalBackdrop}
            aria-hidden
            onMouseDown={isLoading ? undefined : onClose}
          />

          <motion.div
            ref={trapRef}
            className="relative w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-2xl"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={modalPanel}
          >
            <h3 id="confirm-modal-title" className="mb-2 text-base font-bold text-[var(--text-primary)]">
              {title}
            </h3>
            <p className="mb-6 text-sm leading-relaxed text-[var(--text-secondary)]">
              {message}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="rounded-lg px-4 py-3 text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                disabled={isLoading}
                className={`rounded-md px-5 py-3 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                  variant === "danger"
                    ? "bg-[var(--danger)] hover:bg-[var(--danger-light)]"
                    : "bg-[var(--gold)] hover:bg-[var(--gold-light)]"
                }`}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
