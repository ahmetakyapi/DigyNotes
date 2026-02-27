"use client";
import React from "react";

export type SortOption = "newest" | "oldest" | "rating_desc" | "rating_asc" | "az" | "za";

export interface SortFilterState {
  sort: SortOption;
  minRating: number;
}

interface SortFilterBarProps {
  value: SortFilterState;
  onChange: (val: SortFilterState) => void;
  totalCount: number;
  filteredCount: number;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Yeni → Eski" },
  { value: "oldest", label: "Eski → Yeni" },
  { value: "rating_desc", label: "Puan ↓" },
  { value: "rating_asc", label: "Puan ↑" },
  { value: "az", label: "A → Z" },
  { value: "za", label: "Z → A" },
];

const RATING_OPTIONS = [
  { value: 0, label: "Tümü" },
  { value: 3, label: "3+ ★" },
  { value: 4, label: "4+ ★" },
  { value: 4.5, label: "4.5+ ★" },
];

export function SortFilterBar({ value, onChange, totalCount, filteredCount }: SortFilterBarProps) {
  const selectClass =
    "h-10 min-w-[112px] rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-2.5 text-xs text-[var(--text-secondary)] outline-none transition-colors hover:border-[#c4a24b]/30 focus:border-[#c4a24b]/40 cursor-pointer";

  return (
    <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto sm:justify-normal">
      {filteredCount < totalCount && (
        <span className="mr-1 text-[11px] text-[var(--text-muted)]">
          {filteredCount}/{totalCount}
        </span>
      )}
      <select
        value={value.minRating}
        onChange={(e) => onChange({ ...value, minRating: Number(e.target.value) })}
        className={selectClass}
      >
        {RATING_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <select
        value={value.sort}
        onChange={(e) => onChange({ ...value, sort: e.target.value as SortOption })}
        className={selectClass}
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function applySortFilter<T extends { rating: number; title: string; createdAt: string }>(
  posts: T[],
  state: SortFilterState
): T[] {
  let filtered = posts.filter((p) => p.rating >= state.minRating);

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
