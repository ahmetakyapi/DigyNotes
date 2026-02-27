"use client";
import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Post } from "@/types";
import StarRating from "@/components/StarRating";
import { StatusBadge } from "@/components/StatusBadge";
import { SortFilterBar, SortFilterState, applySortFilter } from "@/components/SortFilterBar";
import { StatsPanel } from "@/components/StatsPanel";
import TagBadge from "@/components/TagBadge";

interface PostsListProps {
  allPosts: Post[];
}

export function PostsList({ allPosts }: PostsListProps) {
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";

  const [sortFilter, setSortFilter] = useState<SortFilterState>({
    sort: "newest",
    minRating: 0,
  });
  const [localQuery, setLocalQuery] = useState(urlQuery);
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"notlar" | "istatistikler">("notlar");

  const toggleTag = (name: string) => {
    setActiveTags((prev) =>
      prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name]
    );
  };

  useEffect(() => {
    setLocalQuery(urlQuery);
  }, [urlQuery]);

  const filtered = useMemo(() => {
    const q = localQuery.toLowerCase().trim();
    let result = q
      ? allPosts.filter(
          (p) =>
            p.title.toLowerCase().includes(q) || (p.creator?.toLowerCase().includes(q) ?? false)
        )
      : allPosts;
    if (activeTags.length > 0) {
      result = result.filter((p) =>
        activeTags.some((at) => (p.tags ?? []).some((t) => t.name === at))
      );
    }
    return applySortFilter(result, sortFilter);
  }, [allPosts, localQuery, activeTags, sortFilter]);

  const stats = useMemo(() => {
    const total = allPosts.length;
    const rated = allPosts.filter((p) => p.rating > 0);
    const avgRating = rated.length > 0 ? rated.reduce((s, p) => s + p.rating, 0) / rated.length : 0;
    return { total, avgRating };
  }, [allPosts]);

  const [featured, ...rest] = filtered;
  const hasSearch =
    localQuery.trim() !== "" ||
    sortFilter.minRating > 0 ||
    sortFilter.sort !== "newest" ||
    activeTags.length > 0;

  if (allPosts.length === 0) return null;

  return (
    <div className="mx-auto max-w-5xl px-3 py-6 sm:px-6 sm:py-8">
      {/* ── Page header + tab switcher ── */}
      <div className="mb-5 flex flex-col gap-2.5 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-1">
            <button
              onClick={() => setActiveTab("notlar")}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors sm:px-4 ${
                activeTab === "notlar"
                  ? "bg-[var(--gold)] text-[var(--text-on-accent)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Notlar
            </button>
            <button
              onClick={() => setActiveTab("istatistikler")}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors sm:px-4 ${
                activeTab === "istatistikler"
                  ? "bg-[var(--gold)] text-[var(--text-on-accent)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              İstatistikler
            </button>
          </div>

          {activeTab === "notlar" && (
            <div className="hidden items-center gap-3 sm:flex">
              <div className="h-0.5 w-8 rounded-full bg-gradient-to-r from-[#c4a24b] to-transparent" />
              <span className="text-xs text-[var(--text-muted)]">
                {stats.total} not
                {stats.avgRating > 0 && (
                  <>
                    {" "}
                    · <span className="text-[var(--gold)]">★ {stats.avgRating.toFixed(1)}</span> ort.
                  </>
                )}
              </span>
            </div>
          )}
        </div>

        {activeTab === "notlar" && (
          <SortFilterBar
            value={sortFilter}
            onChange={setSortFilter}
            totalCount={allPosts.length}
            filteredCount={filtered.length}
          />
        )}
      </div>

      {/* ── Aktif tag filtreleri ── */}
      {activeTab === "notlar" && activeTags.length > 0 && (
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
      {activeTab === "istatistikler" && <StatsPanel posts={allPosts} />}

      {activeTab === "notlar" &&
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
            <p className="mb-3 text-sm text-[var(--text-muted)]">Sonuç bulunamadı.</p>
            <button
              onClick={() => {
                setLocalQuery("");
                setSortFilter({ sort: "newest", minRating: 0 });
                setActiveTags([]);
              }}
              className="text-xs text-[var(--gold)] hover:underline"
            >
              Filtreleri temizle
            </button>
          </div>
        ) : (
          <>
            {/* ── Featured card (sadece arama/filtre yokken) ── */}
            {featured && !hasSearch && (
              <Link href={`/posts/${featured.id}`} className="group mb-5 block">
                <article className="relative h-[260px] overflow-hidden rounded-2xl border border-[var(--border)] transition-all duration-500 hover:border-[#c4a24b]/40 hover:shadow-[0_16px_56px_rgba(201,168,76,0.12)] sm:h-[340px] lg:h-[420px]">
                  <Image
                    unoptimized
                    src={featured.image}
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
                      Öne Çıkan
                    </span>
                    {featured.status && <StatusBadge status={featured.status} />}
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-7 lg:p-9">
                    <div className="mb-3 flex items-center gap-2.5">
                      <span className="rounded-sm bg-[var(--gold)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-on-accent)]">
                        {featured.category}
                      </span>
                      {featured.years && (
                        <span className="text-sm text-[var(--media-text-secondary)]">{featured.years}</span>
                      )}
                    </div>
                    <h2 className="mb-2 text-2xl font-bold leading-tight text-[var(--media-text-primary)] transition-colors duration-300 group-hover:text-[var(--gold)] sm:text-3xl lg:text-4xl">
                      {featured.title}
                    </h2>
                    {featured.creator && (
                      <p className="mb-4 text-sm text-[var(--media-text-secondary)]">{featured.creator}</p>
                    )}
                    <div className="flex items-center gap-3">
                      <StarRating rating={featured.rating} size={14} />
                      {featured.rating > 0 && (
                        <span className="text-xs text-[var(--media-text-secondary)]">{featured.rating}/5</span>
                      )}
                      <span className="ml-auto text-xs text-[var(--media-text-secondary)]">{featured.date}</span>
                    </div>
                  </div>
                </article>
              </Link>
            )}

            {/* ── Post listesi ── */}
            <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
              {(hasSearch ? filtered : rest).map((post, index) => (
                <Link key={post.id} href={`/posts/${post.id}`} className="group block">
                  <article className="flex h-full overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-card)] transition-all duration-300 hover:border-[#c4a24b]/30 hover:shadow-[0_4px_24px_rgba(201,168,76,0.08)]">
                    {!hasSearch && (
                      <div className="flex w-9 flex-shrink-0 items-center justify-center border-r border-[var(--border)]">
                        <span className="text-[10px] font-bold tabular-nums text-[var(--text-muted)] transition-colors group-hover:text-[#c4a24b]/60">
                          {String(index + 2).padStart(2, "0")}
                        </span>
                      </div>
                    )}

                    <div className="relative min-h-[148px] flex-shrink-0 sm:min-h-[160px]" style={{ width: "34%" }}>
                      <Image
                        unoptimized
                        src={post.image}
                        alt={post.title}
                        fill
                        sizes="(max-width: 768px) 36vw, 200px"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                      />
                      <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[var(--bg-card)] to-transparent" />
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col justify-between p-3.5 sm:p-4">
                      <div>
                        <div className="mb-2 flex flex-wrap items-center gap-1.5">
                          <span className="flex-shrink-0 rounded-sm border border-[#c4a24b]/25 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--gold)]">
                            {post.category}
                          </span>
                          {post.years && (
                            <span className="text-[11px] text-[var(--text-muted)]">{post.years}</span>
                          )}
                          {post.status && <StatusBadge status={post.status} />}
                        </div>

                        <h2 className="mb-1 line-clamp-2 text-[15px] font-bold leading-snug text-[var(--text-primary)] transition-colors duration-200 group-hover:text-[var(--gold)] sm:text-base">
                          {post.title}
                        </h2>

                        {post.creator && (
                          <p className="mb-1.5 text-xs text-[var(--text-muted)]">{post.creator}</p>
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

                        <p className="line-clamp-2 text-xs leading-relaxed text-[var(--text-muted)]">
                          {post.excerpt}
                        </p>
                      </div>

                      <div className="mt-3 flex items-center justify-between border-t border-[var(--border)] pt-2.5">
                        <StarRating rating={post.rating} size={11} />
                        <span className="text-[10px] text-[var(--text-muted)]">{post.date}</span>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </>
        ))}
    </div>
  );
}
