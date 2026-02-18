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
    "bg-[#161616] border border-[#2a2a2a] text-[#c5cae9] text-xs rounded-md px-2.5 py-1.5 outline-none hover:border-[#3a3a3a] focus:border-[#c9a84c]/40 transition-colors cursor-pointer";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
      <p className="text-xs text-[#555555]">
        {filteredCount < totalCount ? (
          <>
            <span className="text-[#888888]">{filteredCount}</span>
            <span className="text-[#444]"> / {totalCount} not</span>
          </>
        ) : (
          <span className="text-[#888888]">{totalCount} not</span>
        )}
      </p>
      <div className="flex items-center gap-2">
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
    </div>
  );
}

export function applySortFilter(posts: { rating: number; title: string; createdAt: string }[], state: SortFilterState) {
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
