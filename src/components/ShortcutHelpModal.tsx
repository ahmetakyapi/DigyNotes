"use client";
import { useEffect, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { KeyboardIcon, XIcon } from "@phosphor-icons/react";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { modalBackdrop, modalPanel } from "@/lib/variants";

const SHORTCUT_HELP_EVENT = "dn:shortcut-help";

interface Shortcut {
  key: string;
  label: string;
}

const SHORTCUTS: Shortcut[] = [
  { key: "N", label: "Yeni not oluştur" },
  { key: "S", label: "Arama kutusuna odaklan" },
  { key: "H", label: "Ana sayfaya git" },
  { key: "F", label: "Akış sayfasına git" },
  { key: "D", label: "Keşfet sayfasına git" },
  { key: "?", label: "Bu yardımı göster" },
  { key: "Esc", label: "Modalı kapat" },
];

export default function ShortcutHelpModal() {
  const [open, setOpen] = useState(false);
  const trapRef = useFocusTrap(open);

  const toggle = useCallback(() => setOpen((prev) => !prev), []);

  useEffect(() => {
    window.addEventListener(SHORTCUT_HELP_EVENT, toggle);
    return () => window.removeEventListener(SHORTCUT_HELP_EVENT, toggle);
  }, [toggle]);

  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="shortcut-help-title"
          onMouseDown={() => setOpen(false)}
        >
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={modalBackdrop}
            aria-hidden
          />

          <motion.div
            ref={trapRef}
            className="relative w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-[var(--shadow-card)]"
            onMouseDown={(e) => e.stopPropagation()}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={modalPanel}
          >
            {/* Başlık */}
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="bg-[var(--gold)]/10 flex h-9 w-9 items-center justify-center rounded-xl text-[var(--gold)]">
                  <KeyboardIcon size={18} weight="duotone" />
                </div>
                <h2
                  id="shortcut-help-title"
                  className="text-base font-semibold text-[var(--text-primary)]"
                >
                  Klavye Kısayolları
                </h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Kısayol yardımını kapat"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors duration-200 hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)]"
              >
                <XIcon size={16} />
              </button>
            </div>

            {/* Kısayol listesi */}
            <div className="space-y-2">
              {SHORTCUTS.map((shortcut) => (
                <div
                  key={shortcut.key}
                  className="flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-[var(--bg-raised)]"
                >
                  <span className="text-sm text-[var(--text-secondary)]">{shortcut.label}</span>
                  <kbd className="flex h-7 min-w-[28px] items-center justify-center rounded-md border border-[var(--border)] bg-[var(--bg-raised)] px-2 font-mono text-xs font-medium text-[var(--text-primary)]">
                    {shortcut.key}
                  </kbd>
                </div>
              ))}
            </div>

            <p className="mt-4 text-center text-xs text-[var(--text-muted)]">
              Kısayollar sadece metin alanı dışında çalışır.
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
