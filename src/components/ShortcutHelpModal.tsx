"use client";
import { useEffect, useState, useCallback } from "react";
import { Keyboard, X } from "@phosphor-icons/react";

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

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        className="relative mx-4 w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-[var(--shadow-card)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Başlık */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-[var(--gold)]/10 flex h-9 w-9 items-center justify-center rounded-xl text-[var(--gold)]">
              <Keyboard size={18} weight="duotone" />
            </div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              Klavye Kısayolları
            </h2>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors duration-200 hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)]"
          >
            <X size={16} />
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
      </div>
    </div>
  );
}
