"use client";

import { motion, useReducedMotion } from "motion/react";
import { CheckIcon } from "@phosphor-icons/react";
import type { FeedTab } from "@/lib/feed";

const TABS: { id: FeedTab; label: string }[] = [
  { id: "following", label: "Takip Ettiklerin" },
  { id: "popular", label: "Popüler" },
  { id: "latest", label: "Yeni" },
];

interface FeedTabsProps {
  active: FeedTab;
  onChange: (tab: FeedTab) => void;
  /** Own-notes toggle; shown on the following tab only. */
  showOwn: boolean;
  onToggleOwn: () => void;
}

/* LAYOUT: Pill tab bar (sliding active pill) on the left · "Kendi Notlarım" toggle chip
   on the right (following tab). Wraps under each other on narrow screens. */
export function FeedTabs({ active, onChange, showOwn, onToggleOwn }: FeedTabsProps) {
  const reduce = useReducedMotion();

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div
        role="tablist"
        aria-label="Akış görünümü"
        className="inline-flex rounded-full border border-[var(--border)] bg-[var(--bg-card)] p-1"
      >
        {TABS.map((tab) => {
          const selected = tab.id === active;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onChange(tab.id)}
              className={`relative h-9 cursor-pointer rounded-full px-4 text-[13px] font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${
                selected
                  ? "text-[var(--text-on-accent)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              {selected && (
                <motion.span
                  layoutId="feed-tab-pill"
                  aria-hidden
                  className="absolute inset-0 rounded-full bg-[var(--gold)]"
                  transition={
                    reduce ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 36 }
                  }
                />
              )}
              <span className="relative">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {active === "following" && (
        <button
          type="button"
          onClick={onToggleOwn}
          aria-pressed={showOwn}
          className={`inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${
            showOwn
              ? "border-accent/40 bg-accent/10 text-[var(--text-primary)]"
              : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--text-faint)] hover:text-[var(--text-primary)]"
          }`}
        >
          <span
            aria-hidden
            className={`flex h-4 w-4 items-center justify-center rounded-full border transition-colors duration-200 ${
              showOwn
                ? "border-accent bg-accent text-[var(--text-on-accent)]"
                : "border-[var(--text-faint)]"
            }`}
          >
            {showOwn && <CheckIcon size={10} weight="bold" />}
          </span>
          Kendi Notlarım
        </button>
      )}
    </div>
  );
}
