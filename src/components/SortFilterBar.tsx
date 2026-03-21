"use client";
import React, { useEffect, useMemo, useState } from "react";

export type { SortOption, SortFilterState } from "@/lib/sort-filter-utils";
export {
  extractYearRange,
  createSortFilterState,
  hasActiveSortFilters,
  matchesAdvancedFilters,
  applySortFilter,
} from "@/lib/sort-filter-utils";

import type { SortOption, SortFilterState } from "@/lib/sort-filter-utils";
import { createSortFilterState } from "@/lib/sort-filter-utils";

interface SortFilterBarProps {
  value: SortFilterState;
  onChange: (val: SortFilterState) => void;
  totalCount: number;
  filteredCount: number;
  availableStatuses?: string[];
  defaultValue?: SortFilterState;
  inlineContent?: React.ReactNode;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Yeni → Eski" },
  { value: "oldest", label: "Eski → Yeni" },
  { value: "rating_desc", label: "Puan ↓" },
  { value: "rating_asc", label: "Puan ↑" },
  { value: "az", label: "A → Z" },
  { value: "za", label: "Z → A" },
];

const MIN_RATING_OPTIONS = [
  { value: 0, label: "En az puan" },
  { value: 2, label: "2+" },
  { value: 3, label: "3+" },
  { value: 4, label: "4+" },
  { value: 4.5, label: "4.5+" },
];

const MAX_RATING_OPTIONS = [
  { value: 0, label: "Maks. puan" },
  { value: 2.5, label: "2.5" },
  { value: 3, label: "3" },
  { value: 4, label: "4" },
  { value: 5, label: "5" },
];

export function SortFilterBar({
  value,
  onChange,
  totalCount,
  filteredCount,
  availableStatuses = [],
  defaultValue = createSortFilterState(),
  inlineContent,
}: SortFilterBarProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const selectClass =
    "h-10 min-w-[112px] rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-2.5 text-[16px] sm:text-xs font-medium text-[var(--text-secondary)] outline-none transition-colors hover:border-[#10b981]/30 focus:border-[#10b981]/40 cursor-pointer";
  const inputClass =
    "h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-3 text-[16px] sm:text-xs font-medium text-[var(--text-secondary)] outline-none transition-colors hover:border-[#10b981]/30 focus:border-[#10b981]/40";
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (value.minRating > 0) count += 1;
    if (value.maxRating > 0) count += 1;
    if (value.yearFrom.trim() !== "") count += 1;
    if (value.yearTo.trim() !== "") count += 1;
    if (value.statuses.length > 0) count += value.statuses.length;
    return count;
  }, [value]);

  const resetFilters = () => onChange(defaultValue);

  const toggleStatus = (status: string) => {
    onChange({
      ...value,
      statuses: value.statuses.includes(status)
        ? value.statuses.filter((item) => item !== status)
        : [...value.statuses, status],
    });
  };

  useEffect(() => {
    if (!showAdvanced) return;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowAdvanced(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showAdvanced]);

  return (
    <>
      <div className="w-full sm:w-auto">
        <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto sm:justify-normal">
          {filteredCount < totalCount && (
            <span className="mr-1 text-[11px] text-[var(--text-muted)]">
              {filteredCount}/{totalCount}
            </span>
          )}
          <select
            value={value.sort}
            onChange={(e) => onChange({ ...value, sort: e.target.value as SortOption })}
            className={selectClass}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {inlineContent}
          <button
            type="button"
            onClick={() => setShowAdvanced(true)}
            className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
              showAdvanced || activeFilterCount > 0
                ? "bg-[#10b981]/8 border-[#10b981]/35 text-[var(--gold)]"
                : "border-[var(--border)] bg-[var(--surface-strong)] text-[var(--text-secondary)] hover:border-[#10b981]/30 hover:text-[var(--text-primary)]"
            }`}
          >
            Filtreler{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
          </button>
        </div>
      </div>

      {showAdvanced && (
        <div
          className="fixed inset-0 z-[90] bg-[rgba(3,6,12,0.76)] p-4 backdrop-blur-md sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="sort-filter-title"
          onClick={() => setShowAdvanced(false)}
        >
          <div className="flex min-h-full items-end justify-center sm:items-center">
            <div
              className="w-full max-w-3xl rounded-[30px] border border-[var(--border)] bg-[linear-gradient(180deg,rgba(18,26,45,0.98),rgba(10,16,29,0.96))] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.34)] sm:p-6"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] pb-4">
                <div>
                  <h3
                    id="sort-filter-title"
                    className="text-lg font-semibold text-[var(--text-primary)]"
                  >
                    Filtreleri Düzenle
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
                    Puan, yıl ve durum seçeneklerini buradan yönet. Değişiklikler anında listeye
                    uygulanır.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAdvanced(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] text-lg text-[var(--text-secondary)] transition-colors hover:border-[#10b981]/30 hover:text-[var(--text-primary)]"
                  aria-label="Filtre panelini kapat"
                >
                  ×
                </button>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <select
                  value={value.minRating}
                  onChange={(e) => onChange({ ...value, minRating: Number(e.target.value) })}
                  className={selectClass}
                >
                  {MIN_RATING_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  value={value.maxRating}
                  onChange={(e) => onChange({ ...value, maxRating: Number(e.target.value) })}
                  className={selectClass}
                >
                  {MAX_RATING_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1900}
                  max={2099}
                  value={value.yearFrom}
                  onChange={(e) => onChange({ ...value, yearFrom: e.target.value })}
                  placeholder="Yıl (en az)"
                  className={inputClass}
                />
                <input
                  type="number"
                  inputMode="numeric"
                  min={1900}
                  max={2099}
                  value={value.yearTo}
                  onChange={(e) => onChange({ ...value, yearTo: e.target.value })}
                  placeholder="Yıl (en çok)"
                  className={inputClass}
                />
              </div>

              {availableStatuses.length > 0 && (
                <div className="mt-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-faint)]">
                    Durumlar
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {availableStatuses.map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => toggleStatus(status)}
                        className={`rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors ${
                          value.statuses.includes(status)
                            ? "border-[#10b981]/35 bg-[#10b981]/10 text-[var(--gold)]"
                            : "border-[var(--border)] text-[var(--text-muted)] hover:border-[#10b981]/25 hover:text-[var(--text-primary)]"
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-5 flex flex-col gap-3 border-t border-[var(--border)] pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {activeFilterCount > 0
                      ? `${activeFilterCount} aktif filtre uygulanıyor.`
                      : "Henüz aktif filtre yok."}
                  </p>
                  <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                    Yıl aralığı dizi gibi çok yıllı içeriklerde kesişim mantığıyla çalışır.
                  </p>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="rounded-xl border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:border-[#10b981]/30 hover:text-[var(--text-primary)]"
                  >
                    Sıfırla
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(false)}
                    className="rounded-xl bg-[var(--gold)] px-4 py-2 text-xs font-semibold text-[var(--text-on-accent)] transition-colors hover:bg-[var(--gold-light)]"
                  >
                    Kapat
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
