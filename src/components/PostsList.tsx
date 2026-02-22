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
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* ── Page header + tab switcher ── */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-1 rounded-lg border border-[#2a2a2a] bg-[#161616] p-1">
            <button
              onClick={() => setActiveTab("notlar")}
              className={`rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors sm:px-4 ${
                activeTab === "notlar"
                  ? "bg-[#c9a84c] text-[#0f1117]"
                  : "text-[#888888] hover:text-[#f0ede8]"
              }`}
            >
              Notlar
            </button>
            <button
              onClick={() => setActiveTab("istatistikler")}
              className={`rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors sm:px-4 ${
                activeTab === "istatistikler"
                  ? "bg-[#c9a84c] text-[#0f1117]"
                  : "text-[#888888] hover:text-[#f0ede8]"
              }`}
            >
              İstatistikler
            </button>
          </div>

          {activeTab === "notlar" && (
            <div className="hidden items-center gap-3 sm:flex">
              <div className="h-0.5 w-8 rounded-full bg-gradient-to-r from-[#c9a84c] to-transparent" />
              <span className="text-xs text-[#555555]">
                {stats.total} not
                {stats.avgRating > 0 && (
                  <>
                    {" "}
                    · <span className="text-[#c9a84c]">★ {stats.avgRating.toFixed(1)}</span> ort.
                  </>
                )}
              </span>
            </div>
          )}
        </div>

        {/* Sort/Filter — sadece Notlar tabında */}
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
          <span className="text-xs text-[#555555]">Etiket:</span>
          {activeTags.map((name) => (
            <TagBadge key={name} tag={{ id: name, name }} active onRemove={toggleTag} />
          ))}
          <button
            onClick={() => setActiveTags([])}
            className="text-xs text-[#555555] transition-colors hover:text-[#e53e3e]"
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
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-[#2a2a2a] bg-[#161616]">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#555"
                strokeWidth="1.5"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" strokeLinecap="round" />
              </svg>
            </div>
            <p className="mb-3 text-sm text-[#555555]">Sonuç bulunamadı.</p>
            <button
              onClick={() => {
                setLocalQuery("");
                setSortFilter({ sort: "newest", minRating: 0 });
                setActiveTags([]);
              }}
              className="text-xs text-[#c9a84c] hover:underline"
            >
              Filtreleri temizle
            </button>
          </div>
        ) : (
          <>
            {/* ── Featured card (sadece arama/filtre yokken) ── */}
            {featured && !hasSearch && (
              <Link href={`/posts/${featured.id}`} className="group mb-4 block">
                <article className="relative h-[240px] overflow-hidden rounded-2xl border border-[#1e1e1e] transition-all duration-500 hover:border-[#c9a84c]/40 hover:shadow-[0_16px_56px_rgba(201,168,76,0.12)] sm:h-[340px] lg:h-[420px]">
                  <Image
                    unoptimized
                    src={featured.image}
                    alt={featured.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 1024px"
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.025]"
                    priority
                  />
                  {/* Sürükleyici gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c0c] via-[#0c0c0c]/60 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#0c0c0c]/40 to-transparent" />

                  {/* Üst rozetler */}
                  <div className="absolute left-5 top-5 flex items-center gap-2">
                    <span className="rounded-full border border-[#c9a84c]/20 bg-[#0c0c0c]/80 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-[#c9a84c] backdrop-blur-md">
                      Öne Çıkan
                    </span>
                    {featured.status && <StatusBadge status={featured.status} />}
                  </div>

                  {/* Alt içerik */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-7 lg:p-9">
                    <div className="mb-3 flex items-center gap-2.5">
                      <span className="rounded-sm bg-[#c9a84c] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#0c0c0c]">
                        {featured.category}
                      </span>
                      {featured.years && (
                        <span className="text-sm text-[#8892b0]">{featured.years}</span>
                      )}
                    </div>
                    <h2 className="mb-2 text-2xl font-bold leading-tight text-[#f0ede8] transition-colors duration-300 group-hover:text-[#c9a84c] sm:text-3xl lg:text-4xl">
                      {featured.title}
                    </h2>
                    {featured.creator && (
                      <p className="mb-4 text-sm text-[#8892b0]">{featured.creator}</p>
                    )}
                    <div className="flex items-center gap-3">
                      <StarRating rating={featured.rating} size={14} />
                      {featured.rating > 0 && (
                        <span className="text-xs text-[#555555]">{featured.rating}/5</span>
                      )}
                      <span className="ml-auto text-xs text-[#555555]">{featured.date}</span>
                    </div>
                  </div>
                </article>
              </Link>
            )}

            {/* ── Post listesi ── */}
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {(hasSearch ? filtered : rest).map((post, index) => (
                <Link key={post.id} href={`/posts/${post.id}`} className="group block">
                  <article className="flex h-full overflow-hidden rounded-xl border border-[#1e1e1e] bg-[#111111] transition-all duration-300 hover:border-[#c9a84c]/30 hover:shadow-[0_4px_24px_rgba(201,168,76,0.08)]">
                    {/* Sıra numarası — sadece arama yokken */}
                    {!hasSearch && (
                      <div className="flex w-9 flex-shrink-0 items-center justify-center border-r border-[#1e1e1e]">
                        <span className="text-[10px] font-bold tabular-nums text-[#333] transition-colors group-hover:text-[#c9a84c]/60">
                          {String(index + 2).padStart(2, "0")}
                        </span>
                      </div>
                    )}

                    {/* Kapak görseli */}
                    <div
                      className="relative flex-shrink-0"
                      style={{ width: "36%", minHeight: "160px" }}
                    >
                      <Image
                        unoptimized
                        src={post.image}
                        alt={post.title}
                        fill
                        sizes="(max-width: 768px) 36vw, 200px"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                      />
                      <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#111111] to-transparent" />
                    </div>

                    {/* İçerik */}
                    <div className="flex min-w-0 flex-1 flex-col justify-between p-4">
                      <div>
                        <div className="mb-2 flex flex-wrap items-center gap-1.5">
                          <span className="flex-shrink-0 rounded-sm border border-[#c9a84c]/25 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-[#c9a84c]">
                            {post.category}
                          </span>
                          {post.years && (
                            <span className="text-[11px] text-[#444]">{post.years}</span>
                          )}
                          {post.status && <StatusBadge status={post.status} />}
                        </div>

                        <h2 className="mb-1 line-clamp-2 text-sm font-bold leading-snug text-[#e8eaf6] transition-colors duration-200 group-hover:text-[#c9a84c] sm:text-base">
                          {post.title}
                        </h2>

                        {post.creator && (
                          <p className="mb-1.5 text-xs text-[#555555]">{post.creator}</p>
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
                              <span className="self-center text-[10px] text-[#555555]">
                                +{post.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}

                        <p className="line-clamp-2 text-xs leading-relaxed text-[#444]">
                          {post.excerpt}
                        </p>
                      </div>

                      <div className="mt-3 flex items-center justify-between border-t border-[#1e1e1e] pt-2.5">
                        <StarRating rating={post.rating} size={11} />
                        <span className="text-[10px] text-[#444]">{post.date}</span>
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
