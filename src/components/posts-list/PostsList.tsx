"use client";

import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  createSortFilterState,
  applySortFilter,
  hasActiveSortFilters,
  matchesAdvancedFilters,
  type SortFilterState,
} from "@/components/SortFilterBar";
import type { PostsListProps, PostsViewMode, PostsTab } from "./posts-list-types";
import { POSTS_VIEW_STORAGE_KEY } from "./posts-list-types";
import { matchesQuery, postMatchesTags } from "./posts-list-utils";
import { getCategoryVariants } from "@/lib/categories";
import { FeaturedCard, PostGridCard, PostListCard } from "./PostCards";
import {
  PostsTabSwitcher,
  PostsToolbar,
  CategoryPills,
  ActiveTagFilters,
  SavedPostsGuide,
  PostsEmptyState,
} from "./PostsToolbar";

/* ── URL param builder (extracted to reduce cognitive complexity) ── */

function buildSearchParams(
  base: string,
  current: { q: string; category: string; tags: string[]; tab: PostsTab },
  updates: { q?: string; category?: string; tags?: string[]; tab?: PostsTab }
): string {
  const params = new URLSearchParams(base);
  const q = (updates.q ?? current.q).trim();
  const category = (updates.category ?? current.category).trim();
  const tags = updates.tags ?? current.tags;
  const tab = updates.tab ?? current.tab;

  if (q) params.set("q", q);
  else params.delete("q");
  if (category) params.set("category", category);
  else params.delete("category");
  if (tags.length > 0) params.set("tags", tags.join(","));
  else params.delete("tags");
  if (tab === "kaydedilenler") params.set("tab", tab);
  else params.delete("tab");

  return params.toString();
}

export function PostsList({
  allPosts,
  initialActiveCategory = "",
  initialActiveTab,
  initialActiveTags = [],
  searchQuery = "",
  savedPosts = [],
  draftPosts = [],
  archivedPosts = [],
  hasMorePosts = false,
  hasMoreSavedPosts = false,
  isLoadingMorePosts = false,
  isLoadingMoreSavedPosts = false,
  onLoadMorePosts,
  onLoadMoreSavedPosts,
}: PostsListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlQuery = searchQuery || searchParams.get("q") || "";
  const resolvedInitialTab: PostsTab =
    initialActiveTab ??
    (urlQuery.trim() === "" && allPosts.length === 0 && savedPosts.length > 0
      ? "kaydedilenler"
      : "notlar");
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const defaultSortFilter = useMemo(() => createSortFilterState(), []);

  const [sortFilter, setSortFilter] = useState<SortFilterState>(defaultSortFilter);
  const [localQuery, setLocalQuery] = useState(urlQuery);
  const [activeCategory, setActiveCategory] = useState(initialActiveCategory);
  const [activeTags, setActiveTags] = useState<string[]>(initialActiveTags);
  const [viewMode, setViewMode] = useState<PostsViewMode>("grid");
  const [activeTab, setActiveTab] = useState<PostsTab>(resolvedInitialTab);

  /* ── URL sync ── */

  const updateNotesUrl = useCallback(
    (updates: {
      category?: string;
      q?: string;
      tab?: PostsTab;
      tags?: string[];
    }) => {
      const qs = buildSearchParams(
        searchParams.toString(),
        { q: localQuery, category: activeCategory, tags: activeTags, tab: activeTab },
        updates
      );
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [searchParams, localQuery, activeCategory, activeTags, activeTab, router, pathname]
  );

  const toggleTag = (name: string) => {
    const nextTags = activeTags.includes(name)
      ? activeTags.filter((t) => t !== name)
      : [...activeTags, name];
    setActiveTags(nextTags);
    updateNotesUrl({ tags: nextTags });
  };

  /* ── Sync from external props ── */

  useEffect(() => setLocalQuery(urlQuery), [urlQuery]);
  useEffect(() => setActiveCategory(initialActiveCategory), [initialActiveCategory]);
  useEffect(() => setActiveTags(initialActiveTags), [initialActiveTags]);
  useEffect(() => setActiveTab(resolvedInitialTab), [resolvedInitialTab]);

  /* ── Persist view mode ── */

  useEffect(() => {
    const saved = globalThis.localStorage?.getItem(POSTS_VIEW_STORAGE_KEY) ?? null;
    if (saved === "grid" || saved === "list") setViewMode(saved);
  }, []);

  useEffect(() => {
    globalThis.localStorage?.setItem(POSTS_VIEW_STORAGE_KEY, viewMode);
  }, [viewMode]);

  /* ── Derived data ── */

  const visiblePosts =
    activeTab === "kaydedilenler" ? savedPosts :
    activeTab === "taslaklar" ? draftPosts :
    activeTab === "arsiv" ? archivedPosts :
    allPosts;
  const currentHasMore = activeTab === "kaydedilenler" ? hasMoreSavedPosts : activeTab === "notlar" ? hasMorePosts : false;
  const currentIsLoadingMore =
    activeTab === "kaydedilenler" ? isLoadingMoreSavedPosts : activeTab === "notlar" ? isLoadingMorePosts : false;
  const currentLoadMore = activeTab === "kaydedilenler" ? onLoadMoreSavedPosts : activeTab === "notlar" ? onLoadMorePosts : undefined;

  const availableStatuses = useMemo(
    () =>
      Array.from(
        new Set(
          visiblePosts
            .map((p) => p.status)
            .filter((s): s is string => typeof s === "string" && s.trim() !== "")
        )
      ).sort((a, b) => a.localeCompare(b, "tr")),
    [visiblePosts]
  );

  const filtered = useMemo(() => {
    const q = localQuery.trim();
    let result = q ? visiblePosts.filter((p) => matchesQuery(p, q)) : visiblePosts;
    if (activeCategory.trim()) {
      const variants = getCategoryVariants(activeCategory.trim());
      result = variants.length > 0
        ? result.filter((p) => variants.includes(p.category))
        : result.filter((p) => p.category === activeCategory.trim());
    }
    result = result.filter((p) => matchesAdvancedFilters(p, sortFilter));
    result = result.filter((p) => postMatchesTags(p, activeTags));
    return applySortFilter(result, sortFilter);
  }, [visiblePosts, localQuery, activeCategory, activeTags, sortFilter]);

  const stats = useMemo(() => {
    const rated = allPosts.filter((p) => p.rating > 0);
    const avgRating = rated.length > 0 ? rated.reduce((s, p) => s + p.rating, 0) / rated.length : 0;
    return { total: allPosts.length, avgRating };
  }, [allPosts]);

  const [featured, ...rest] = filtered;
  const hasSearch =
    localQuery.trim() !== "" ||
    activeCategory.trim() !== "" ||
    hasActiveSortFilters(sortFilter, defaultSortFilter) ||
    activeTags.length > 0;
  const displayedPosts = hasSearch || viewMode === "list" ? filtered : rest;

  /* ── Infinite scroll observer ── */

  useEffect(() => {
    if (!currentHasMore || currentIsLoadingMore || !currentLoadMore) return;
    const node = loadMoreRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) currentLoadMore();
      },
      { rootMargin: "240px 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [activeTab, currentHasMore, currentIsLoadingMore, currentLoadMore, filtered.length]);

  /* ── Early return ── */

  if (allPosts.length === 0 && savedPosts.length === 0 && draftPosts.length === 0 && archivedPosts.length === 0) return null;

  /* ── Handlers ── */

  const handleTabChange = (tab: PostsTab) => {
    setActiveTab(tab);
    updateNotesUrl({ tab });
  };

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    updateNotesUrl({ category: cat });
  };

  const handleClearFilters = () => {
    setLocalQuery("");
    setActiveCategory("");
    setSortFilter(defaultSortFilter);
    setActiveTags([]);
    updateNotesUrl({ category: "", q: "", tags: [] });
  };

  const handleClearTags = () => {
    setActiveTags([]);
    updateNotesUrl({ tags: [] });
  };

  /* ── Render ── */

  return (
    <div className="mx-auto max-w-5xl px-3 pb-4 pt-1 sm:px-6 sm:pb-5 sm:pt-3">
      {/* Header — mobile: stacked compact, desktop: side by side */}
      <div className="mb-2 space-y-2 sm:mb-4 sm:flex sm:items-end sm:justify-between sm:space-y-0">
        <PostsTabSwitcher
          activeTab={activeTab}
          totalNotes={stats.total}
          totalSaved={savedPosts.length}
          totalDrafts={draftPosts.length}
          totalArchived={archivedPosts.length}
          avgRating={stats.avgRating}
          onTabChange={handleTabChange}
        />
        <PostsToolbar
          sortFilter={sortFilter}
          onSortFilterChange={setSortFilter}
          defaultSortFilter={defaultSortFilter}
          totalCount={visiblePosts.length}
          filteredCount={filtered.length}
          availableStatuses={availableStatuses}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
      </div>

      {activeTab === "kaydedilenler" && <SavedPostsGuide />}

      <CategoryPills activeCategory={activeCategory} onCategoryChange={handleCategoryChange} />

      <ActiveTagFilters
        activeTags={activeTags}
        onToggleTag={toggleTag}
        onClearAll={handleClearTags}
      />

      {/* Content */}
      {filtered.length === 0 ? (
        <PostsEmptyState
          hasVisiblePosts={visiblePosts.length > 0}
          activeTab={activeTab}
          hasSearch={hasSearch}
          hasMore={currentHasMore}
          isLoadingMore={currentIsLoadingMore}
          onClearFilters={handleClearFilters}
          onLoadMore={currentLoadMore}
        />
      ) : (
        <>
          {featured && !hasSearch && viewMode === "grid" && (
            <FeaturedCard post={featured} activeTab={activeTab} />
          )}

          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 gap-3.5 md:grid-cols-2"
                : "flex flex-col gap-2.5"
            }
          >
            {displayedPosts.map((post, index) =>
              viewMode === "grid" ? (
                <PostGridCard
                  key={post.id}
                  post={post}
                  index={index}
                  showIndex={!hasSearch}
                  activeTags={activeTags}
                  onToggleTag={toggleTag}
                />
              ) : (
                <PostListCard
                  key={post.id}
                  post={post}
                  activeTags={activeTags}
                  onToggleTag={toggleTag}
                />
              )
            )}
          </div>

          {(currentHasMore || currentIsLoadingMore) && (
            <div ref={loadMoreRef} className="flex justify-center py-6">
              <button
                onClick={() => currentLoadMore?.()}
                disabled={!currentHasMore || currentIsLoadingMore}
                className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:border-[#10b981]/35 hover:text-[var(--gold)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {(() => {
                  if (currentIsLoadingMore) return "Daha fazla yükleniyor...";
                  if (currentHasMore) return "Daha fazla yükle";
                  return "Tüm içerikler yüklendi";
                })()}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
