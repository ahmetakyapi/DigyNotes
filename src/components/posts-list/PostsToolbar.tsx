"use client";

import React from "react";
import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import type { SortFilterState } from "@/components/SortFilterBar";
import { SortFilterBar } from "@/components/SortFilterBar";
import TagBadge from "@/components/TagBadge";
import { OrganizationGuide } from "@/components/OrganizationGuide";
import { FIXED_CATEGORIES, getCategoryLabel } from "@/lib/categories";
import type { PostsViewMode } from "./posts-list-types";

/* ── Tab switcher (Notlar / Kaydettiklerim) ── */

export function PostsTabSwitcher({
  activeTab,
  totalNotes,
  totalSaved,
  avgRating,
  onTabChange,
}: {
  readonly activeTab: "notlar" | "kaydedilenler";
  readonly totalNotes: number;
  readonly totalSaved: number;
  readonly avgRating: number;
  readonly onTabChange: (tab: "notlar" | "kaydedilenler") => void;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2 sm:gap-3">
      <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] p-1 shadow-[var(--shadow-soft)]">
        <button
          onClick={() => onTabChange("notlar")}
          className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors sm:px-4 ${
            activeTab === "notlar"
              ? "bg-gradient-to-r from-[#10b981] to-[#059669] text-white"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          Notlar
        </button>
        <button
          onClick={() => onTabChange("kaydedilenler")}
          className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors sm:px-4 ${
            activeTab === "kaydedilenler"
              ? "bg-gradient-to-r from-[#10b981] to-[#059669] text-white"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          Kaydettiklerim
        </button>
      </div>

      <div className="hidden items-center gap-3 sm:flex">
        <div className="h-0.5 w-8 rounded-full bg-gradient-to-r from-[#10b981] to-transparent" />
        <span className="text-xs text-[var(--text-muted)]">
          {activeTab === "notlar" ? totalNotes : totalSaved}{" "}
          {activeTab === "notlar" ? "not" : "kayıt"}
          {activeTab === "notlar" && avgRating > 0 && (
            <>
              {" · "}
              <span className="text-[var(--gold)]">
                {"★ "}
                {avgRating.toFixed(1)}
              </span>
              {" ort."}
            </>
          )}
        </span>
      </div>
    </div>
  );
}

/* ── View toggle + Sort/filter bar ── */

export function PostsToolbar({
  sortFilter,
  onSortFilterChange,
  defaultSortFilter,
  totalCount,
  filteredCount,
  availableStatuses,
  viewMode,
  onViewModeChange,
}: {
  readonly sortFilter: SortFilterState;
  readonly onSortFilterChange: (v: SortFilterState) => void;
  readonly defaultSortFilter: SortFilterState;
  readonly totalCount: number;
  readonly filteredCount: number;
  readonly availableStatuses: string[];
  readonly viewMode: PostsViewMode;
  readonly onViewModeChange: (v: PostsViewMode) => void;
}) {
  return (
    <div className="w-full sm:w-auto">
      <SortFilterBar
        value={sortFilter}
        onChange={onSortFilterChange}
        totalCount={totalCount}
        filteredCount={filteredCount}
        availableStatuses={availableStatuses}
        defaultValue={defaultSortFilter}
        inlineContent={
          <div className="inline-flex items-center rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] p-1 shadow-[var(--shadow-soft)]">
            <button
              onClick={() => onViewModeChange("grid")}
              aria-label="Grid görünüm"
              className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                viewMode === "grid"
                  ? "bg-gradient-to-r from-[#10b981] to-[#059669] text-white"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Tablo
            </button>
            <button
              onClick={() => onViewModeChange("list")}
              aria-label="Liste görünümü"
              className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                viewMode === "list"
                  ? "bg-gradient-to-r from-[#10b981] to-[#059669] text-white"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Liste
            </button>
          </div>
        }
      />
    </div>
  );
}

/* ── Category pills ── */

export function CategoryPills({
  activeCategory,
  onCategoryChange,
}: {
  readonly activeCategory: string;
  readonly onCategoryChange: (cat: string) => void;
}) {
  const pillClass = (active: boolean) =>
    `rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
      active
        ? "border-[var(--gold)]/35 bg-[var(--gold)]/10 text-[var(--gold)]"
        : "border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
    }`;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => onCategoryChange("")}
        className={pillClass(activeCategory.trim() === "")}
      >
        Tümü
      </button>
      {FIXED_CATEGORIES.map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => onCategoryChange(key)}
          className={pillClass(activeCategory === key)}
        >
          {getCategoryLabel(key)}
        </button>
      ))}
    </div>
  );
}

/* ── Active tag filter chips ── */

export function ActiveTagFilters({
  activeTags,
  onToggleTag,
  onClearAll,
}: {
  readonly activeTags: readonly string[];
  readonly onToggleTag: (name: string) => void;
  readonly onClearAll: () => void;
}) {
  if (activeTags.length === 0) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <span className="text-xs text-[var(--text-muted)]">Etiket:</span>
      {activeTags.map((name) => (
        <TagBadge key={name} tag={{ id: name, name }} active onRemove={onToggleTag} />
      ))}
      <button
        onClick={onClearAll}
        className="text-xs text-[var(--text-muted)] transition-colors hover:text-[#e53e3e]"
      >
        Temizle
      </button>
    </div>
  );
}

/* ── Saved-posts organization guide ── */

export function SavedPostsGuide() {
  return (
    <div className="mb-4">
      <OrganizationGuide
        current="bookmarks"
        title="Kaydettiklerim ne için var?"
        description="Bu alan hızlı geri dönüş içindir. Henüz nota dönüşmeyen şeyleri İstek Listesi'nde beklet, tamamlanmış notları ise Koleksiyonlar altında daha kalıcı biçimde grupla."
      />
    </div>
  );
}

/* ── Empty state ── */

export function PostsEmptyState({
  hasVisiblePosts,
  activeTab,
  hasSearch,
  hasMore,
  isLoadingMore,
  onClearFilters,
  onLoadMore,
}: {
  readonly hasVisiblePosts: boolean;
  readonly activeTab: "notlar" | "kaydedilenler";
  readonly hasSearch: boolean;
  readonly hasMore: boolean;
  readonly isLoadingMore: boolean;
  readonly onClearFilters: () => void;
  readonly onLoadMore?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-card)]">
        <MagnifyingGlassIcon size={20} className="text-[var(--text-muted)]" />
      </div>
      <p className="mb-3 text-sm text-[var(--text-muted)]">
        {!hasVisiblePosts && activeTab === "kaydedilenler"
          ? "Henüz kaydedilen not yok."
          : "Sonuç bulunamadı."}
      </p>
      {(hasSearch || activeTab !== "kaydedilenler" || hasVisiblePosts) && (
        <button onClick={onClearFilters} className="text-xs text-[var(--gold)] hover:underline">
          Filtreleri temizle
        </button>
      )}
      {hasMore && onLoadMore && (
        <button
          onClick={onLoadMore}
          disabled={isLoadingMore}
          className="mt-3 rounded-lg border border-[var(--border)] px-4 py-2 text-xs text-[var(--text-secondary)] transition-colors hover:border-[#10b981]/35 hover:text-[var(--gold)] disabled:opacity-50"
        >
          {isLoadingMore ? "Yükleniyor..." : "Daha fazla yükle"}
        </button>
      )}
    </div>
  );
}
