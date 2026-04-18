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

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={modalBackdrop}
        >
          <motion.div
            className="backdrop-blur-sm absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            aria-hidden
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
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
