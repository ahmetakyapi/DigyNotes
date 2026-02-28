"use client";
import React, { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Post } from "@/types";
import StarRating from "@/components/StarRating";
import { StatusBadge } from "@/components/StatusBadge";
import {
  SortFilterBar,
  SortFilterState,
  applySortFilter,
  createSortFilterState,
  hasActiveSortFilters,
  matchesAdvancedFilters,
} from "@/components/SortFilterBar";
import { StatsPanel } from "@/components/StatsPanel";
import TagBadge from "@/components/TagBadge";
import { getCategoryLabel } from "@/lib/categories";
import { formatDisplaySentence, formatDisplayTitle } from "@/lib/display-text";
import { getPostImageSrc } from "@/lib/post-image";
import { categorySupportsSpoiler } from "@/lib/post-config";

interface PostsListProps {
  allPosts: Post[];
  savedPosts?: Post[];
  hasMorePosts?: boolean;
  hasMoreSavedPosts?: boolean;
  isLoadingMorePosts?: boolean;
  isLoadingMoreSavedPosts?: boolean;
  onLoadMorePosts?: () => void | Promise<void>;
  onLoadMoreSavedPosts?: () => void | Promise<void>;
}

type PostsViewMode = "grid" | "list";

const POSTS_VIEW_STORAGE_KEY = "dn_posts_view_mode";

function normalizeSearchText(value?: string | null) {
  return (value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function matchesQuery(post: Post, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const haystacks = [
    normalizeSearchText(post.title),
    normalizeSearchText(post.creator),
    normalizeSearchText(post.excerpt),
    normalizeSearchText(post.content),
    normalizeSearchText(post.category),
    normalizeSearchText(getCategoryLabel(post.category)),
    normalizeSearchText(post.years),
    ...(post.tags ?? []).map((tag) => normalizeSearchText(tag.name)),
  ];

  return haystacks.some((text) => text.includes(q));
}

function shouldHideExcerpt(post: Post) {
  return Boolean(post.hasSpoiler && categorySupportsSpoiler(post.category));
}

export function PostsList({
  allPosts,
  savedPosts = [],
  hasMorePosts = false,
  hasMoreSavedPosts = false,
  isLoadingMorePosts = false,
  isLoadingMoreSavedPosts = false,
  onLoadMorePosts,
  onLoadMoreSavedPosts,
}: PostsListProps) {
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";
  const initialTab =
    urlQuery.trim() === "" && allPosts.length === 0 && savedPosts.length > 0
      ? "kaydedilenler"
      : "notlar";
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const defaultSortFilter = useMemo(() => createSortFilterState(), []);

  const [sortFilter, setSortFilter] = useState<SortFilterState>(defaultSortFilter);
  const [localQuery, setLocalQuery] = useState(urlQuery);
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<PostsViewMode>("grid");
  const [activeTab, setActiveTab] = useState<"notlar" | "kaydedilenler" | "istatistikler">(
    initialTab
  );

  const toggleTag = (name: string) => {
    setActiveTags((prev) =>
      prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name]
    );
  };

  useEffect(() => {
    setLocalQuery(urlQuery);
  }, [urlQuery]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    const savedView =
      typeof window !== "undefined" ? window.localStorage.getItem(POSTS_VIEW_STORAGE_KEY) : null;

    if (savedView === "grid" || savedView === "list") {
      setViewMode(savedView);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(POSTS_VIEW_STORAGE_KEY, viewMode);
  }, [viewMode]);

  const visiblePosts = activeTab === "kaydedilenler" ? savedPosts : allPosts;
  const currentHasMore = activeTab === "kaydedilenler" ? hasMoreSavedPosts : hasMorePosts;
  const currentIsLoadingMore =
    activeTab === "kaydedilenler" ? isLoadingMoreSavedPosts : isLoadingMorePosts;
  const currentLoadMore = activeTab === "kaydedilenler" ? onLoadMoreSavedPosts : onLoadMorePosts;
  const availableStatuses = useMemo(
    () =>
      Array.from(
        new Set(
          visiblePosts
            .map((post) => post.status)
            .filter(
              (status): status is string => typeof status === "string" && status.trim() !== ""
            )
        )
      ).sort((a, b) => a.localeCompare(b, "tr")),
    [visiblePosts]
  );

  const filtered = useMemo(() => {
    const q = localQuery.trim();
    let result = q ? visiblePosts.filter((post) => matchesQuery(post, q)) : visiblePosts;
    result = result.filter((post) => matchesAdvancedFilters(post, sortFilter));
    if (activeTags.length > 0) {
      result = result.filter((p) =>
        activeTags.some((at) => (p.tags ?? []).some((t) => t.name === at))
      );
    }
    return applySortFilter(result, sortFilter);
  }, [visiblePosts, localQuery, activeTags, sortFilter]);

  const stats = useMemo(() => {
    const total = allPosts.length;
    const rated = allPosts.filter((p) => p.rating > 0);
    const avgRating = rated.length > 0 ? rated.reduce((s, p) => s + p.rating, 0) / rated.length : 0;
    return { total, avgRating };
  }, [allPosts]);

  const [featured, ...rest] = filtered;
  const hasSearch =
    localQuery.trim() !== "" ||
    hasActiveSortFilters(sortFilter, defaultSortFilter) ||
    activeTags.length > 0;
  const displayedPosts = hasSearch || viewMode === "list" ? filtered : rest;

  useEffect(() => {
    if (
      activeTab === "istatistikler" ||
      !currentHasMore ||
      currentIsLoadingMore ||
      !currentLoadMore
    ) {
      return;
    }

    const node = loadMoreRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        currentLoadMore();
      },
      { rootMargin: "240px 0px" }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [activeTab, currentHasMore, currentIsLoadingMore, currentLoadMore, filtered.length]);

  if (allPosts.length === 0 && savedPosts.length === 0) return null;

  return (
    <div className="mx-auto max-w-5xl px-3 py-4 sm:px-6 sm:py-5">
      {/* ── Page header + tab switcher ── */}
      <div className="mb-3.5 flex flex-col gap-2 sm:mb-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] p-1 shadow-[var(--shadow-soft)]">
            <button
              onClick={() => setActiveTab("notlar")}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors sm:px-4 ${
                activeTab === "notlar"
                  ? "bg-[var(--gold)] text-[var(--text-on-accent)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Notlar
            </button>
            <button
              onClick={() => setActiveTab("kaydedilenler")}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors sm:px-4 ${
                activeTab === "kaydedilenler"
                  ? "bg-[var(--gold)] text-[var(--text-on-accent)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Kaydettiklerim
            </button>
            <button
              onClick={() => setActiveTab("istatistikler")}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors sm:px-4 ${
                activeTab === "istatistikler"
                  ? "bg-[var(--gold)] text-[var(--text-on-accent)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              İstatistikler
            </button>
          </div>

          {(activeTab === "notlar" || activeTab === "kaydedilenler") && (
            <div className="hidden items-center gap-3 sm:flex">
              <div className="h-0.5 w-8 rounded-full bg-gradient-to-r from-[#c4a24b] to-transparent" />
              <span className="text-xs text-[var(--text-muted)]">
                {activeTab === "notlar" ? stats.total : savedPosts.length}{" "}
                {activeTab === "notlar" ? "not" : "kayıt"}
                {activeTab === "notlar" && stats.avgRating > 0 && (
                  <>
                    {" "}
                    · <span className="text-[var(--gold)]">
                      ★ {stats.avgRating.toFixed(1)}
                    </span>{" "}
                    ort.
                  </>
                )}
              </span>
            </div>
          )}
        </div>

        {(activeTab === "notlar" || activeTab === "kaydedilenler") && (
          <div className="w-full sm:w-auto">
            <SortFilterBar
              value={sortFilter}
              onChange={setSortFilter}
              totalCount={visiblePosts.length}
              filteredCount={filtered.length}
              availableStatuses={availableStatuses}
              defaultValue={defaultSortFilter}
              inlineContent={
                <div className="inline-flex items-center rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] p-1 shadow-[var(--shadow-soft)]">
                  <button
                    onClick={() => setViewMode("grid")}
                    aria-label="Grid görünüm"
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                      viewMode === "grid"
                        ? "bg-[var(--gold)] text-[var(--text-on-accent)]"
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    Grid
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    aria-label="Liste görünümü"
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                      viewMode === "list"
                        ? "bg-[var(--gold)] text-[var(--text-on-accent)]"
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    Liste
                  </button>
                </div>
              }
            />
          </div>
        )}
      </div>

      {/* ── Aktif tag filtreleri ── */}
      {(activeTab === "notlar" || activeTab === "kaydedilenler") && activeTags.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-[var(--text-muted)]">Etiket:</span>
          {activeTags.map((name) => (
            <TagBadge key={name} tag={{ id: name, name }} active onRemove={toggleTag} />
          ))}
          <button
            onClick={() => setActiveTags([])}
            className="text-xs text-[var(--text-muted)] transition-colors hover:text-[#e53e3e]"
          >
            Temizle
          </button>
        </div>
      )}

      {/* ── İstatistikler sekmesi ── */}
      {activeTab === "istatistikler" &&
        (hasMorePosts ? (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 text-center shadow-[var(--shadow-soft)]">
            <p className="text-sm text-[var(--text-secondary)]">
              Bu sekmedeki hızlı istatistikler tüm notlar yüklendiğinde anlamlı oluyor.
            </p>
            <Link
              href="/stats"
              className="mt-3 inline-flex rounded-xl bg-[var(--gold)] px-4 py-2 text-sm font-semibold text-[var(--text-on-accent)]"
            >
              Detaylı İstatistikler
            </Link>
          </div>
        ) : (
          <StatsPanel posts={allPosts} />
        ))}

      {(activeTab === "notlar" || activeTab === "kaydedilenler") &&
        (filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-card)]">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-[var(--text-muted)]"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" strokeLinecap="round" />
              </svg>
            </div>
            <p className="mb-3 text-sm text-[var(--text-muted)]">
              {visiblePosts.length === 0 && activeTab === "kaydedilenler"
                ? "Henüz kaydedilen not yok."
                : "Sonuç bulunamadı."}
            </p>
            {(hasSearch || activeTab !== "kaydedilenler" || visiblePosts.length > 0) && (
              <button
                onClick={() => {
                  setLocalQuery("");
                  setSortFilter(defaultSortFilter);
                  setActiveTags([]);
                }}
                className="text-xs text-[var(--gold)] hover:underline"
              >
                Filtreleri temizle
              </button>
            )}
            {currentHasMore && currentLoadMore && (
              <button
                onClick={() => currentLoadMore()}
                disabled={currentIsLoadingMore}
                className="mt-3 rounded-lg border border-[var(--border)] px-4 py-2 text-xs text-[var(--text-secondary)] transition-colors hover:border-[#c4a24b]/35 hover:text-[var(--gold)] disabled:opacity-50"
              >
                {currentIsLoadingMore ? "Yükleniyor..." : "Daha fazla yükle"}
              </button>
            )}
          </div>
        ) : (
          <>
            {/* ── Featured card (sadece arama/filtre yokken) ── */}
            {featured && !hasSearch && viewMode === "grid" && (
              <Link href={`/posts/${featured.id}`} className="group mb-4 block">
                <article className="relative h-[260px] overflow-hidden rounded-2xl border border-[var(--border)] transition-all duration-500 hover:border-[#c4a24b]/40 hover:shadow-[0_16px_56px_rgba(201,168,76,0.12)] sm:h-[340px] lg:h-[420px]">
                  <Image
                    unoptimized
                    src={getPostImageSrc(featured.image)}
                    alt={featured.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 1024px"
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.025]"
                    priority
                  />
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(180deg, var(--media-overlay-soft) 0%, var(--media-overlay-mid) 55%, var(--media-overlay-strong) 100%)",
                    }}
                  />
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(120deg, var(--media-panel-sheen) 0%, transparent 40%, transparent 75%, var(--media-panel-sheen) 100%)",
                    }}
                  />

                  <div className="absolute left-5 top-5 flex items-center gap-2">
                    <span
                      className="rounded-full border border-[#c4a24b]/20 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--gold)] backdrop-blur-md"
                      style={{ backgroundColor: "var(--bg-overlay)" }}
                    >
                      {activeTab === "kaydedilenler" ? "Kaydedilen" : "Öne Çıkan"}
                    </span>
                    {featured.status && <StatusBadge status={featured.status} />}
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-7 lg:p-9">
                    <div className="mb-3 flex items-center gap-2.5">
                      <span className="rounded-sm bg-[var(--gold)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-on-accent)]">
                        {getCategoryLabel(featured.category)}
                      </span>
                      {featured.years && (
                        <span className="text-sm text-[var(--media-text-secondary)]">
                          {featured.years}
                        </span>
                      )}
                    </div>
                    <h2 className="mb-2 text-2xl font-bold leading-tight text-[var(--media-text-primary)] transition-colors duration-300 group-hover:text-[var(--gold)] sm:text-3xl lg:text-4xl">
                      {formatDisplayTitle(featured.title)}
                    </h2>
                    {featured.creator && (
                      <p className="mb-4 text-sm text-[var(--media-text-secondary)]">
                        {formatDisplayTitle(featured.creator)}
                      </p>
                    )}
                    <div className="flex items-center gap-3">
                      <StarRating rating={featured.rating} size={14} />
                      {featured.rating > 0 && (
                        <span className="text-xs text-[var(--media-text-secondary)]">
                          {featured.rating}/5
                        </span>
                      )}
                      <span className="ml-auto text-xs text-[var(--media-text-secondary)]">
                        {featured.date}
                      </span>
                    </div>
                  </div>
                </article>
              </Link>
            )}

            {/* ── Post listesi ── */}
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 gap-3.5 md:grid-cols-2"
                  : "flex flex-col gap-2.5"
              }
            >
              {displayedPosts.map((post, index) => {
                const displayTitle = formatDisplayTitle(post.title);
                const displayCreator = formatDisplayTitle(post.creator);
                const displayExcerpt = formatDisplaySentence(post.excerpt);

                return (
                  <Link key={post.id} href={`/posts/${post.id}`} className="group block">
                    {viewMode === "grid" ? (
                      <article className="flex h-full flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-card)] transition-all duration-300 hover:border-[#c4a24b]/30 hover:shadow-[0_4px_24px_rgba(201,168,76,0.08)] sm:flex-row">
                        {!hasSearch && (
                          <div className="flex h-9 flex-shrink-0 items-center justify-center border-b border-[var(--border)] sm:h-auto sm:w-9 sm:border-b-0 sm:border-r">
                            <span className="text-[10px] font-bold tabular-nums text-[var(--text-muted)] transition-colors group-hover:text-[#c4a24b]/60">
                              {String(index + 2).padStart(2, "0")}
                            </span>
                          </div>
                        )}

                        <div className="relative h-48 min-h-[148px] flex-shrink-0 sm:h-auto sm:min-h-[160px] sm:w-[34%]">
                          <Image
                            unoptimized
                            src={getPostImageSrc(post.image)}
                            alt={displayTitle}
                            fill
                            sizes="(max-width: 768px) 36vw, 200px"
                            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                          />
                          <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[var(--image-edge-fade)] to-transparent sm:inset-y-0 sm:left-auto sm:right-0 sm:h-auto sm:w-8 sm:bg-gradient-to-l" />
                        </div>

                        <div className="flex min-w-0 flex-1 flex-col justify-between p-3.5 sm:p-4">
                          <div>
                            <div className="mb-2 flex flex-wrap items-center gap-1.5">
                              <span className="flex-shrink-0 rounded-sm border border-[#c4a24b]/25 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--gold)]">
                                {getCategoryLabel(post.category)}
                              </span>
                              {post.years && (
                                <span className="text-[11px] text-[var(--text-muted)]">
                                  {post.years}
                                </span>
                              )}
                              {post.status && <StatusBadge status={post.status} />}
                            </div>

                            <h2 className="mb-1 line-clamp-2 text-[15px] font-bold leading-snug text-[var(--text-primary)] transition-colors duration-200 group-hover:text-[var(--gold)] sm:text-base">
                              {displayTitle}
                            </h2>

                            {post.creator && (
                              <p className="mb-1.5 text-xs text-[var(--text-muted)]">
                                {displayCreator}
                              </p>
                            )}

                            {post.tags && post.tags.length > 0 && (
                              <div
                                className="mb-1.5 flex flex-wrap gap-1"
                                onClick={(e) => e.preventDefault()}
                              >
                                {post.tags.slice(0, 3).map((tag) => (
                                  <TagBadge
                                    key={tag.id}
                                    tag={tag}
                                    active={activeTags.includes(tag.name)}
                                    onClick={toggleTag}
                                  />
                                ))}
                                {post.tags.length > 3 && (
                                  <span className="self-center text-[10px] text-[var(--text-muted)]">
                                    +{post.tags.length - 3}
                                  </span>
                                )}
                              </div>
                            )}

                            {!shouldHideExcerpt(post) && (
                              <p className="line-clamp-2 text-xs leading-relaxed text-[var(--text-muted)]">
                                {displayExcerpt}
                              </p>
                            )}
                          </div>

                          <div className="mt-3 flex items-center justify-between border-t border-[var(--border)] pt-2.5">
                            <StarRating rating={post.rating} size={11} />
                            <span className="text-[10px] text-[var(--text-muted)]">
                              {post.date}
                            </span>
                          </div>
                        </div>
                      </article>
                    ) : (
                      <article className="flex items-center gap-3 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-3 transition-all duration-300 hover:border-[#c4a24b]/30 hover:shadow-[0_4px_24px_rgba(201,168,76,0.08)] sm:px-4">
                        <div className="relative h-20 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-[var(--border)]">
                          <Image
                            unoptimized
                            src={getPostImageSrc(post.image)}
                            alt={displayTitle}
                            fill
                            sizes="64px"
                            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex flex-wrap items-center gap-1.5">
                            <span className="rounded-sm border border-[#c4a24b]/25 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--gold)]">
                              {getCategoryLabel(post.category)}
                            </span>
                            {post.years && (
                              <span className="text-[11px] text-[var(--text-muted)]">
                                {post.years}
                              </span>
                            )}
                            {post.status && <StatusBadge status={post.status} />}
                          </div>

                          <h2 className="line-clamp-1 text-sm font-bold text-[var(--text-primary)] transition-colors duration-200 group-hover:text-[var(--gold)] sm:text-[15px]">
                            {displayTitle}
                          </h2>

                          <p className="mt-1 line-clamp-1 text-xs text-[var(--text-muted)]">
                            {[displayCreator, shouldHideExcerpt(post) ? null : displayExcerpt]
                              .filter(Boolean)
                              .join(" • ")}
                          </p>

                          <div className="mt-2 flex items-center justify-between gap-3">
                            <StarRating rating={post.rating} size={10} />
                            <span className="text-[10px] text-[var(--text-muted)]">
                              {post.date}
                            </span>
                          </div>
                        </div>
                      </article>
                    )}
                  </Link>
                );
              })}
            </div>

            {(currentHasMore || currentIsLoadingMore) && (
              <div ref={loadMoreRef} className="flex justify-center py-6">
                <button
                  onClick={() => currentLoadMore?.()}
                  disabled={!currentHasMore || currentIsLoadingMore}
                  className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:border-[#c4a24b]/35 hover:text-[var(--gold)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {currentIsLoadingMore
                    ? "Daha fazla yükleniyor..."
                    : currentHasMore
                      ? "Daha fazla yükle"
                      : "Tüm içerikler yüklendi"}
                </button>
              </div>
            )}
          </>
        ))}
    </div>
  );
}
