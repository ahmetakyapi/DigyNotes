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
  const [activeTab, setActiveTab] = useState<"notlar" | "istatistikler">("notlar");

  useEffect(() => {
    setLocalQuery(urlQuery);
  }, [urlQuery]);

  const filtered = useMemo(() => {
    const q = localQuery.toLowerCase().trim();
    const searched = q
      ? allPosts.filter(
          (p) =>
            p.title.toLowerCase().includes(q) ||
            (p.creator?.toLowerCase().includes(q) ?? false)
        )
      : allPosts;
    return applySortFilter(searched, sortFilter);
  }, [allPosts, localQuery, sortFilter]);

  const stats = useMemo(() => {
    const total = allPosts.length;
    const rated = allPosts.filter((p) => p.rating > 0);
    const avgRating =
      rated.length > 0
        ? rated.reduce((s, p) => s + p.rating, 0) / rated.length
        : 0;
    return { total, avgRating };
  }, [allPosts]);

  const [featured, ...rest] = filtered;
  const hasSearch =
    localQuery.trim() !== "" ||
    sortFilter.minRating > 0 ||
    sortFilter.sort !== "newest";

  if (allPosts.length === 0) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

      {/* ── Page header + tab switcher ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-1 bg-[#161616] border border-[#2a2a2a] rounded-lg p-1">
            <button
              onClick={() => setActiveTab("notlar")}
              className={`px-2.5 sm:px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                activeTab === "notlar"
                  ? "bg-[#c9a84c] text-[#0f1117]"
                  : "text-[#888888] hover:text-[#f0ede8]"
              }`}
            >
              Notlar
            </button>
            <button
              onClick={() => setActiveTab("istatistikler")}
              className={`px-2.5 sm:px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                activeTab === "istatistikler"
                  ? "bg-[#c9a84c] text-[#0f1117]"
                  : "text-[#888888] hover:text-[#f0ede8]"
              }`}
            >
              İstatistikler
            </button>
          </div>

          {activeTab === "notlar" && (
            <div className="hidden sm:flex items-center gap-3">
              <div className="h-0.5 w-8 bg-gradient-to-r from-[#c9a84c] to-transparent rounded-full" />
              <span className="text-xs text-[#555555]">
                {stats.total} not
                {stats.avgRating > 0 && (
                  <> · <span className="text-[#c9a84c]">★ {stats.avgRating.toFixed(1)}</span> ort.</>
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

      {/* ── İstatistikler sekmesi ── */}
      {activeTab === "istatistikler" && <StatsPanel posts={allPosts} />}

      {activeTab === "notlar" && (filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-12 h-12 rounded-full bg-[#161616] border border-[#2a2a2a] flex items-center justify-center mb-4">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" strokeLinecap="round" />
            </svg>
          </div>
          <p className="text-[#555555] text-sm mb-3">Sonuç bulunamadı.</p>
          <button
            onClick={() => { setLocalQuery(""); setSortFilter({ sort: "newest", minRating: 0 }); }}
            className="text-xs text-[#c9a84c] hover:underline"
          >
            Filtreleri temizle
          </button>
        </div>
      ) : (
        <>
          {/* ── Featured card (sadece arama/filtre yokken) ── */}
          {featured && !hasSearch && (
            <Link href={`/posts/${featured.id}`} className="group block mb-4">
              <article
                className="relative rounded-2xl overflow-hidden border border-[#1e1e1e]
                           hover:border-[#c9a84c]/40 transition-all duration-500
                           hover:shadow-[0_16px_56px_rgba(201,168,76,0.12)]
                           h-[240px] sm:h-[340px] lg:h-[420px]"
              >
                <Image
                  unoptimized
                  src={featured.image}
                  alt={featured.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 1024px"
                  className="object-cover group-hover:scale-[1.025] transition-transform duration-700"
                  priority
                />
                {/* Sürükleyici gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c0c] via-[#0c0c0c]/60 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0c0c0c]/40 to-transparent" />

                {/* Üst rozetler */}
                <div className="absolute top-5 left-5 flex items-center gap-2">
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#c9a84c] bg-[#0c0c0c]/80 border border-[#c9a84c]/20 px-2.5 py-1 rounded-full backdrop-blur-md">
                    Öne Çıkan
                  </span>
                  {featured.status && <StatusBadge status={featured.status} />}
                </div>

                {/* Alt içerik */}
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-7 lg:p-9">
                  <div className="flex items-center gap-2.5 mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#0c0c0c] bg-[#c9a84c] px-2.5 py-1 rounded-sm">
                      {featured.category}
                    </span>
                    {featured.years && (
                      <span className="text-sm text-[#8892b0]">{featured.years}</span>
                    )}
                  </div>
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#f0ede8] leading-tight mb-2 group-hover:text-[#c9a84c] transition-colors duration-300">
                    {featured.title}
                  </h2>
                  {featured.creator && (
                    <p className="text-sm text-[#8892b0] mb-4">{featured.creator}</p>
                  )}
                  <div className="flex items-center gap-3">
                    <StarRating rating={featured.rating} size={14} />
                    {featured.rating > 0 && (
                      <span className="text-xs text-[#555555]">{featured.rating}/5</span>
                    )}
                    <span className="text-xs text-[#555555] ml-auto">{featured.date}</span>
                  </div>
                </div>
              </article>
            </Link>
          )}

          {/* ── Post listesi ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {(hasSearch ? filtered : rest).map((post, index) => (
              <Link key={post.id} href={`/posts/${post.id}`} className="group block">
                <article
                  className="flex h-full rounded-xl overflow-hidden bg-[#111111] border border-[#1e1e1e]
                             hover:border-[#c9a84c]/30 transition-all duration-300
                             hover:shadow-[0_4px_24px_rgba(201,168,76,0.08)]"
                >
                  {/* Sıra numarası — sadece arama yokken */}
                  {!hasSearch && (
                    <div className="flex-shrink-0 w-9 flex items-center justify-center border-r border-[#1e1e1e]">
                      <span className="text-[10px] font-bold text-[#333] tabular-nums group-hover:text-[#c9a84c]/60 transition-colors">
                        {String(index + 2).padStart(2, "0")}
                      </span>
                    </div>
                  )}

                  {/* Kapak görseli */}
                  <div className="relative flex-shrink-0" style={{ width: "36%", minHeight: "160px" }}>
                    <Image
                      unoptimized
                      src={post.image}
                      alt={post.title}
                      fill
                      sizes="(max-width: 768px) 36vw, 200px"
                      className="object-cover group-hover:scale-[1.04] transition-transform duration-500"
                    />
                    <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#111111] to-transparent" />
                  </div>

                  {/* İçerik */}
                  <div className="flex flex-col justify-between p-4 flex-1 min-w-0">
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5 mb-2">
                        <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#c9a84c] border border-[#c9a84c]/25 px-1.5 py-0.5 rounded-sm flex-shrink-0">
                          {post.category}
                        </span>
                        {post.years && (
                          <span className="text-[11px] text-[#444]">{post.years}</span>
                        )}
                        {post.status && <StatusBadge status={post.status} />}
                      </div>

                      <h2 className="text-sm sm:text-base font-bold text-[#e8eaf6] leading-snug mb-1 group-hover:text-[#c9a84c] transition-colors duration-200 line-clamp-2">
                        {post.title}
                      </h2>

                      {post.creator && (
                        <p className="text-xs text-[#555555] mb-1.5">{post.creator}</p>
                      )}

                      <p className="text-xs text-[#444] leading-relaxed line-clamp-2">
                        {post.excerpt}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[#1e1e1e]">
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
