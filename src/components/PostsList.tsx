"use client";
import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Post } from "@/types";
import StarRating from "@/components/StarRating";
import { StatusBadge } from "@/components/StatusBadge";
import { SortFilterBar, SortFilterState, applySortFilter } from "@/components/SortFilterBar";

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

  // URL'deki ?q= değişince localQuery'i güncelle
  useEffect(() => {
    setLocalQuery(urlQuery);
  }, [urlQuery]);

  // Search + sort + filter uygula
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

  // Stats (tüm postlardan)
  const stats = useMemo(() => {
    const total = allPosts.length;
    const rated = allPosts.filter((p) => p.rating > 0);
    const avgRating =
      rated.length > 0
        ? rated.reduce((s, p) => s + p.rating, 0) / rated.length
        : 0;
    const categoryCounts = allPosts.reduce<Record<string, number>>((acc, p) => {
      acc[p.category] = (acc[p.category] ?? 0) + 1;
      return acc;
    }, {});
    return { total, avgRating, categoryCounts };
  }, [allPosts]);

  const [featured, ...rest] = filtered;
  const hasSearch = localQuery.trim() !== "" || sortFilter.minRating > 0 || sortFilter.sort !== "newest";

  if (allPosts.length === 0) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

      {/* ── Stats Bar ── */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-6 pb-5 border-b border-[#1e1e1e]">
        <div className="flex items-center gap-1.5 bg-[#161616] border border-[#2a2a2a] rounded-lg px-3 py-1.5">
          <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#555555]">Toplam</span>
          <span className="text-sm font-bold text-[#c9a84c]">{stats.total}</span>
        </div>
        {Object.entries(stats.categoryCounts).map(([cat, count]) => (
          <div key={cat} className="flex items-center gap-1.5 bg-[#161616] border border-[#2a2a2a] rounded-lg px-3 py-1.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#555555]">{cat}</span>
            <span className="text-sm font-bold text-[#e8eaf6]">{count}</span>
          </div>
        ))}
        {stats.avgRating > 0 && (
          <div className="flex items-center gap-1.5 bg-[#161616] border border-[#2a2a2a] rounded-lg px-3 py-1.5 ml-auto">
            <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#555555]">Ort. Puan</span>
            <span className="text-sm font-bold text-[#c9a84c]">{stats.avgRating.toFixed(1)}</span>
            <span className="text-[#c9a84c]">★</span>
          </div>
        )}
      </div>

      {/* ── Section header ── */}
      <div className="flex items-end justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-[#e8eaf6] tracking-tight">
            {localQuery ? `"${localQuery}" sonuçları` : "Son Notlar"}
          </h2>
          <div className="h-0.5 w-10 bg-gradient-to-r from-[#c9a84c] to-transparent mt-1.5 rounded-full" />
        </div>
      </div>

      {/* ── Sort/Filter bar ── */}
      <SortFilterBar
        value={sortFilter}
        onChange={setSortFilter}
        totalCount={allPosts.length}
        filteredCount={filtered.length}
      />

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-[#4a5568] text-base">Sonuç bulunamadı.</p>
          <button
            onClick={() => { setLocalQuery(""); setSortFilter({ sort: "newest", minRating: 0 }); }}
            className="mt-3 text-sm text-[#c9a84c] hover:underline"
          >
            Filtreleri temizle
          </button>
        </div>
      ) : (
        <>
          {/* ── Featured card ── */}
          {featured && !hasSearch && (
            <Link href={`/posts/${featured.id}`} className="group block mb-5">
              <article
                className="relative rounded-2xl overflow-hidden border border-[#252d40]
                           hover:border-[#c9a84c]/50 transition-all duration-500
                           hover:shadow-[0_12px_48px_rgba(201,168,76,0.18)]"
                style={{ minHeight: "340px" }}
              >
                <Image
                  unoptimized
                  src={featured.image}
                  alt={featured.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 896px"
                  className="object-cover group-hover:scale-[1.03] transition-transform duration-700"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f1117] via-[#0f1117]/55 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0f1117]/30 to-transparent" />

                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#c9a84c]/80 bg-[#0f1117]/70 border border-[#c9a84c]/25 px-2.5 py-1 rounded-full backdrop-blur-sm">
                    Öne Çıkan
                  </span>
                  {featured.status && <StatusBadge status={featured.status} />}
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                  <div className="flex items-center gap-2.5 mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#0f1117] bg-[#c9a84c] px-2.5 py-1 rounded-sm">
                      {featured.category}
                    </span>
                    {featured.years && (
                      <span className="text-sm text-[#8892b0]">{featured.years}</span>
                    )}
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-[#e8eaf6] leading-tight mb-2 group-hover:text-[#c9a84c] transition-colors duration-300">
                    {featured.title}
                  </h2>
                  {featured.creator && (
                    <p className="text-sm text-[#8892b0] mb-4">{featured.creator}</p>
                  )}
                  <div className="flex items-center gap-3">
                    <StarRating rating={featured.rating} size={14} />
                    {featured.rating > 0 && (
                      <span className="text-xs text-[#4a5568]">{featured.rating}/5</span>
                    )}
                    <span className="text-xs text-[#4a5568] ml-auto">{featured.date}</span>
                  </div>
                </div>
              </article>
            </Link>
          )}

          {/* ── Post list ── */}
          <div className="flex flex-col gap-3">
            {(hasSearch ? filtered : rest).map((post, index) => (
              <Link key={post.id} href={`/posts/${post.id}`} className="group block">
                <article
                  className="flex rounded-xl overflow-hidden bg-[#151b2d] border border-[#252d40]
                             hover:border-[#c9a84c]/40 transition-all duration-300
                             hover:shadow-[0_4px_32px_rgba(201,168,76,0.10)]"
                >
                  {!hasSearch && (
                    <div className="flex-shrink-0 w-10 flex items-center justify-center border-r border-[#252d40]">
                      <span className="text-[11px] font-bold text-[#4a5568] tabular-nums group-hover:text-[#c9a84c]/70 transition-colors">
                        {String(index + 2).padStart(2, "0")}
                      </span>
                    </div>
                  )}

                  <div className="relative flex-shrink-0" style={{ width: "33%", minHeight: "180px" }}>
                    <Image
                      unoptimized
                      src={post.image}
                      alt={post.title}
                      fill
                      sizes="(max-width: 768px) 35vw, 280px"
                      className="object-cover group-hover:scale-[1.04] transition-transform duration-500"
                    />
                    <div className="absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-[#151b2d] to-transparent" />
                  </div>

                  <div className="flex flex-col justify-between p-4 sm:p-5 flex-1 min-w-0">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#c9a84c] border border-[#c9a84c]/30 px-2 py-0.5 rounded-sm flex-shrink-0">
                          {post.category}
                        </span>
                        {post.years && (
                          <span className="text-xs text-[#4a5568]">{post.years}</span>
                        )}
                        {post.status && <StatusBadge status={post.status} />}
                      </div>

                      <h2 className="text-base sm:text-lg font-bold text-[#e8eaf6] leading-snug mb-1.5 group-hover:text-[#c9a84c] transition-colors duration-200 line-clamp-2">
                        {post.title}
                      </h2>

                      {post.creator && (
                        <p className="text-sm text-[#8892b0] mb-2">{post.creator}</p>
                      )}

                      <p className="text-sm text-[#8892b0] leading-relaxed line-clamp-2">
                        {post.excerpt}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#252d40]">
                      <StarRating rating={post.rating} size={12} />
                      <span className="text-xs text-[#4a5568]">{post.date}</span>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
