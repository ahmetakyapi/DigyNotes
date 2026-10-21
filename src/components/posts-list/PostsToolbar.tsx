"use client";

import React from "react";
import Link from "next/link";
import { BookmarkSimpleIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";
import type { SortFilterState } from "@/components/SortFilterBar";
import { SortFilterBar } from "@/components/SortFilterBar";
import TagBadge from "@/components/TagBadge";
import { OrganizationGuide } from "@/components/OrganizationGuide";
import { FIXED_CATEGORIES, getCategoryLabel } from "@/lib/categories";
import type { PostsViewMode, PostsTab } from "./posts-list-types";

/* ── Tab switcher (Notlar / Kaydettiklerim / Taslaklar / Arşiv) ── */

const TAB_CONFIG: { key: PostsTab; label: string; countKey: string }[] = [
  { key: "notlar", label: "Notlar", countKey: "totalNotes" },
  { key: "kaydedilenler", label: "Kaydettiklerim", countKey: "totalSaved" },
  { key: "taslaklar", label: "Taslaklar", countKey: "totalDrafts" },
  { key: "arsiv", label: "Arşiv", countKey: "totalArchived" },
];

export function PostsTabSwitcher({
  activeTab,
  totalNotes,
  totalSaved,
  totalDrafts = 0,
  totalArchived = 0,
  hasMoreSaved = false,
  avgRating,
  onTabChange,
}: {
  readonly activeTab: PostsTab;
  readonly totalNotes: number;
  readonly totalSaved: number;
  readonly totalDrafts?: number;
  readonly totalArchived?: number;
  /** More saved notes exist than are loaded, so the count reads "12+". */
  readonly hasMoreSaved?: boolean;
  readonly avgRating: number;
  readonly onTabChange: (tab: PostsTab) => void;
}) {
  const counts: Record<string, number> = {
    totalNotes,
    totalSaved,
    totalDrafts,
    totalArchived,
  };

  const activeCount = counts[TAB_CONFIG.find((t) => t.key === activeTab)?.countKey ?? ""] ?? 0;
  const activeLabel =
    activeTab === "notlar"
      ? "not"
      : activeTab === "kaydedilenler"
        ? "kayıt"
        : activeTab === "taslaklar"
          ? "taslak"
          : "arşiv";

  // Taslaklar ve Arşiv sekmelerini sadece içerik varsa göster
  const visibleTabs = TAB_CONFIG.filter(
    (t) =>
      t.key === "notlar" ||
      t.key === "kaydedilenler" ||
      counts[t.countKey] > 0 ||
      activeTab === t.key
  );

  return (
    <div className="flex min-w-0 items-center gap-2 sm:gap-3">
      <div className="flex max-w-full items-center gap-0.5 overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] p-0.5 shadow-[var(--shadow-soft)] sm:gap-1 sm:p-1">
        {visibleTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => onTabChange(tab.key)}
            aria-pressed={activeTab === tab.key}
            className={`shrink-0 cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors sm:px-4 sm:py-1.5 sm:text-sm ${
              activeTab === tab.key
                ? "bg-accent text-[var(--text-on-accent)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {tab.label}
            {tab.key !== "notlar" && counts[tab.countKey] > 0 && (
              <span className="ml-1.5 text-[12px] opacity-70">
                {counts[tab.countKey]}
                {tab.key === "kaydedilenler" && hasMoreSaved ? "+" : ""}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="hidden items-center gap-3 sm:flex">
        <div className="h-0.5 w-8 rounded-full bg-accent/60" />
        <span className="text-xs text-[var(--text-muted)]">
          {activeCount} {activeLabel}
          {activeTab === "notlar" && avgRating > 0 && (
            <>
              {" · "}
              <span className="text-[var(--gold)]">
                {"★ "}
                {avgRating.toFixed(1).replace(".", ",")}
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
  onAdvancedOpenChange,
}: {
  readonly sortFilter: SortFilterState;
  readonly onSortFilterChange: (v: SortFilterState) => void;
  readonly defaultSortFilter: SortFilterState;
  readonly totalCount: number;
  readonly filteredCount: number;
  readonly availableStatuses: string[];
  readonly viewMode: PostsViewMode;
  readonly onViewModeChange: (v: PostsViewMode) => void;
  readonly onAdvancedOpenChange?: (open: boolean) => void;
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
        onAdvancedOpenChange={onAdvancedOpenChange}
        inlineContent={
          <div className="inline-flex h-9 items-center rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] p-0.5 sm:h-10 sm:p-1">
            <button
              type="button"
              onClick={() => onViewModeChange("grid")}
              aria-label="Tablo görünümü"
              aria-pressed={viewMode === "grid"}
              className={`cursor-pointer rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors sm:px-2.5 sm:py-1.5 sm:text-xs ${
                viewMode === "grid"
                  ? "bg-accent text-[var(--text-on-accent)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Tablo
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange("list")}
              aria-label="Liste görünümü"
              aria-pressed={viewMode === "list"}
              className={`cursor-pointer rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors sm:px-2.5 sm:py-1.5 sm:text-xs ${
                viewMode === "list"
                  ? "bg-accent text-[var(--text-on-accent)]"
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
        ? "border-accent/35 bg-accent/10 text-[var(--gold)]"
        : "border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
    }`;

  return (
    <div className="mb-4 hidden flex-wrap items-center gap-2 sm:flex">
      <button
        type="button"
        onClick={() => onCategoryChange("")}
        aria-pressed={activeCategory.trim() === ""}
        className={pillClass(activeCategory.trim() === "")}
      >
        Tümü
      </button>
      {FIXED_CATEGORIES.map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => onCategoryChange(key)}
          aria-pressed={activeCategory === key}
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
        className="text-xs text-[var(--text-muted)] transition-colors hover:text-danger"
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
        title="Kaydettiklerim Ne İçin Var?"
        description="Bu alan hızlı geri dönüş içindir. Henüz nota dönüşmeyen şeyleri İstek Listesi'nde beklet, tamamlanmış notları ise Koleksiyonlar altında daha kalıcı biçimde grupla."
      />
    </div>
  );
}

/* ── Saved tab empty state: explains how saving works ── */

export function SavedEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-accent/25 bg-accent/10 text-accent">
        <BookmarkSimpleIcon size={20} weight="duotone" />
      </div>
      <h3 className="text-base font-bold tracking-[-0.02em] text-[var(--text-primary)]">
        Henüz Kaydettiğin Not Yok
      </h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-[var(--text-secondary)] [text-wrap:pretty]">
        Bir notu okurken{" "}
        <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] px-2 py-0.5 align-middle text-[12px] font-medium text-[var(--text-primary)]">
          <BookmarkSimpleIcon size={12} />
          Kaydet
        </span>{" "}
        düğmesine dokun; kaydettiklerin burada toplanır. Profil menündeki Kaydettiklerim&apos;den
        her zaman ulaşabilirsin.
      </p>
      <Link
        href="/discover"
        className="mt-5 rounded-full border border-[var(--border)] px-4 py-2 text-[13px] font-semibold text-[var(--text-secondary)] transition-colors hover:border-accent/35 hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        Keşfet&apos;e Göz At
      </Link>
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
  readonly activeTab: PostsTab;
  readonly hasSearch: boolean;
  readonly hasMore: boolean;
  readonly isLoadingMore: boolean;
  readonly onClearFilters: () => void;
  readonly onLoadMore?: () => void;
}) {
  if (!hasVisiblePosts && activeTab === "kaydedilenler" && !hasMore) return <SavedEmptyState />;

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
          Filtreleri Temizle
        </button>
      )}
      {hasMore && onLoadMore && (
        <button
          onClick={onLoadMore}
          disabled={isLoadingMore}
          className="mt-3 rounded-lg border border-[var(--border)] px-4 py-2 text-xs text-[var(--text-secondary)] transition-colors hover:border-accent/35 hover:text-[var(--gold)] disabled:opacity-50"
        >
          {isLoadingMore ? "Yükleniyor..." : "Daha Fazla Yükle"}
        </button>
      )}
    </div>
  );
}
