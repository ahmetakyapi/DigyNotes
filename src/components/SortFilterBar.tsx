"use client";
import React, { useEffect, useMemo, useState } from "react";

export type SortOption = "newest" | "oldest" | "rating_desc" | "rating_asc" | "az" | "za";

export interface SortFilterState {
  sort: SortOption;
  minRating: number;
  maxRating: number;
  yearFrom: string;
  yearTo: string;
  statuses: string[];
}

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
  { value: 0, label: "Min puan" },
  { value: 2, label: "2+" },
  { value: 3, label: "3+" },
  { value: 4, label: "4+" },
  { value: 4.5, label: "4.5+" },
];

const MAX_RATING_OPTIONS = [
  { value: 0, label: "Max puan" },
  { value: 2.5, label: "2.5" },
  { value: 3, label: "3" },
  { value: 4, label: "4" },
  { value: 5, label: "5" },
];

function parseYear(value: string) {
  const numeric = parseInt(value.trim(), 10);
  return Number.isFinite(numeric) ? numeric : null;
}

export function extractYearRange(input?: string | null) {
  if (!input) return null;

  const matches = input.match(/\b(19|20)\d{2}\b/g);
  if (!matches || matches.length === 0) return null;

  const years = matches.map((item) => parseInt(item, 10)).filter(Number.isFinite);
  if (years.length === 0) return null;

  return {
    from: Math.min(...years),
    to: Math.max(...years),
  };
}

export function createSortFilterState(sort: SortOption = "newest"): SortFilterState {
  return {
    sort,
    minRating: 0,
    maxRating: 0,
    yearFrom: "",
    yearTo: "",
    statuses: [],
  };
}

export function hasActiveSortFilters(
  state: SortFilterState,
  defaultValue: SortFilterState = createSortFilterState()
) {
  return (
    state.sort !== defaultValue.sort ||
    state.minRating !== defaultValue.minRating ||
    state.maxRating !== defaultValue.maxRating ||
    state.yearFrom.trim() !== defaultValue.yearFrom.trim() ||
    state.yearTo.trim() !== defaultValue.yearTo.trim() ||
    state.statuses.length !== defaultValue.statuses.length ||
    state.statuses.some((status) => !defaultValue.statuses.includes(status))
  );
}

export function matchesAdvancedFilters<
  T extends { rating: number; status?: string | null; years?: string | null; date?: string | null },
>(post: T, state: SortFilterState) {
  if (post.rating < state.minRating) return false;
  if (state.maxRating > 0 && post.rating > state.maxRating) return false;

  if (state.statuses.length > 0) {
    if (!post.status || !state.statuses.includes(post.status)) {
      return false;
    }
  }

  const yearFrom = parseYear(state.yearFrom);
  const yearTo = parseYear(state.yearTo);

  if (yearFrom !== null || yearTo !== null) {
    const range = extractYearRange(post.years) ?? extractYearRange(post.date);
    if (!range) return false;
    if (yearFrom !== null && range.to < yearFrom) return false;
    if (yearTo !== null && range.from > yearTo) return false;
  }

  return true;
}

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
    "h-10 min-w-[112px] rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-2.5 text-xs font-medium text-[var(--text-secondary)] outline-none transition-colors hover:border-[#c4a24b]/30 focus:border-[#c4a24b]/40 cursor-pointer";
  const inputClass =
    "h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-3 text-xs font-medium text-[var(--text-secondary)] outline-none transition-colors hover:border-[#c4a24b]/30 focus:border-[#c4a24b]/40";
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
                ? "bg-[#c4a24b]/8 border-[#c4a24b]/35 text-[var(--gold)]"
                : "border-[var(--border)] bg-[var(--surface-strong)] text-[var(--text-secondary)] hover:border-[#c4a24b]/30 hover:text-[var(--text-primary)]"
            }`}
          >
            Filtreler{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
          </button>
        </div>
      </div>

      {showAdvanced && (
        <div
          className="fixed inset-0 z-[90] bg-[rgba(3,6,12,0.76)] p-4 backdrop-blur-md sm:p-6"
          onClick={() => setShowAdvanced(false)}
        >
          <div className="flex min-h-full items-end justify-center sm:items-center">
            <div
              className="w-full max-w-3xl rounded-[30px] border border-[var(--border)] bg-[linear-gradient(180deg,rgba(18,26,45,0.98),rgba(10,16,29,0.96))] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.34)] sm:p-6"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] pb-4">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">
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
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] text-lg text-[var(--text-secondary)] transition-colors hover:border-[#c4a24b]/30 hover:text-[var(--text-primary)]"
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
                  placeholder="Yıl min"
                  className={inputClass}
                />
                <input
                  type="number"
                  inputMode="numeric"
                  min={1900}
                  max={2099}
                  value={value.yearTo}
                  onChange={(e) => onChange({ ...value, yearTo: e.target.value })}
                  placeholder="Yıl max"
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
                            ? "border-[#c4a24b]/35 bg-[#c4a24b]/10 text-[var(--gold)]"
                            : "border-[var(--border)] text-[var(--text-muted)] hover:border-[#c4a24b]/25 hover:text-[var(--text-primary)]"
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
                    className="rounded-xl border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:border-[#c4a24b]/30 hover:text-[var(--text-primary)]"
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

export function applySortFilter<T extends { rating: number; title: string; createdAt: string }>(
  posts: T[],
  state: SortFilterState
): T[] {
  const filtered = [...posts];

  switch (state.sort) {
    case "newest":
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      break;
    case "oldest":
      filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      break;
    case "rating_desc":
      filtered.sort((a, b) => b.rating - a.rating);
      break;
    case "rating_asc":
      filtered.sort((a, b) => a.rating - b.rating);
      break;
    case "az":
      filtered.sort((a, b) => a.title.localeCompare(b.title, "tr"));
      break;
    case "za":
      filtered.sort((a, b) => b.title.localeCompare(a.title, "tr"));
      break;
  }
  return filtered;
}
