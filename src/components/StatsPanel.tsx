"use client";

import { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Post } from "@/types";
import StarRating from "@/components/StarRating";

const customLoader = ({ src }: { src: string }) => src;

const CATEGORY_COLORS: Record<string, string> = {
  film: "#c9a84c",
  dizi: "#8b5cf6",
  kitap: "#22c55e",
};

function getCategoryColor(cat: string): string {
  return CATEGORY_COLORS[cat.toLowerCase()] ?? "#6b7280";
}

function getStatusColor(status: string): string {
  const completed = ["İzlendi", "Okundu", "Tamamlandı"];
  const ongoing = ["İzleniyor", "Okunuyor", "Devam Ediyor"];
  if (completed.includes(status)) return "#22c55e";
  if (ongoing.includes(status)) return "#c9a84c";
  return "#6b7280";
}

function StatCard({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-5 flex flex-col gap-1">
      <span className="text-3xl font-bold text-[#f0ede8]">{value}</span>
      <span className="text-[10px] text-[#555555] uppercase tracking-[0.1em]">{label}</span>
    </div>
  );
}

function HorizBar({
  label,
  count,
  max,
  color = "#c9a84c",
}: {
  label: string;
  count: number;
  max: number;
  color?: string;
}) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-[#888888] w-28 flex-shrink-0 truncate">{label}</span>
      <div className="flex-1 bg-[#1e1e1e] rounded-full h-1.5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-bold text-[#f0ede8] w-5 text-right flex-shrink-0">{count}</span>
    </div>
  );
}

function VertBar({ star, count, max }: { star: number; count: number; max: number }) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className="flex flex-col items-center gap-1.5 flex-1">
      <span className="text-[10px] text-[#555555]">{count}</span>
      <div className="w-full bg-[#1e1e1e] rounded-t-sm overflow-hidden" style={{ height: 64 }}>
        <div
          className="w-full bg-[#c9a84c] rounded-t-sm transition-all duration-700"
          style={{ height: `${pct}%`, marginTop: `${100 - pct}%` }}
        />
      </div>
      <span className="text-[10px] text-[#888888]">{star}★</span>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#555555] mb-4">
      {children}
    </h3>
  );
}

interface StatsPanelProps {
  posts: Post[];
}

export function StatsPanel({ posts }: StatsPanelProps) {
  const stats = useMemo(() => {
    const total = posts.length;

    const rated = posts.filter((p) => p.rating > 0);
    const avgRating =
      rated.length > 0
        ? rated.reduce((s, p) => s + p.rating, 0) / rated.length
        : 0;

    const byCategory: Record<string, number> = {};
    for (const p of posts) {
      byCategory[p.category] = (byCategory[p.category] ?? 0) + 1;
    }

    const byStatus: Record<string, number> = {};
    for (const p of posts) {
      if (p.status) byStatus[p.status] = (byStatus[p.status] ?? 0) + 1;
    }

    const ratingDist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const p of rated) {
      const bucket = Math.round(p.rating);
      if (bucket >= 1 && bucket <= 5) ratingDist[bucket]++;
    }

    const byMonth: Record<string, number> = {};
    for (const p of posts) {
      const month = new Date(p.createdAt).toLocaleDateString("tr-TR", {
        year: "numeric",
        month: "long",
      });
      byMonth[month] = (byMonth[month] ?? 0) + 1;
    }
    const mostActiveMonth =
      Object.entries(byMonth).sort((a, b) => b[1] - a[1])[0] ?? null;

    const topRated = [...rated].sort((a, b) => b.rating - a.rating).slice(0, 3);

    return { total, avgRating, byCategory, byStatus, ratingDist, mostActiveMonth, topRated };
  }, [posts]);

  if (posts.length === 0) {
    return (
      <div className="text-center py-20 text-[#555555]">
        İstatistik görmek için önce not ekle.
      </div>
    );
  }

  const maxCategory = Math.max(...Object.values(stats.byCategory));
  const maxStatus = Math.max(...Object.values(stats.byStatus));
  const maxRatingDist = Math.max(...Object.values(stats.ratingDist));

  return (
    <div className="space-y-8">
      {/* Genel Bakış */}
      <div>
        <SectionTitle>Genel Bakış</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatCard value={stats.total} label="Toplam Not" />
          <StatCard
            value={stats.avgRating > 0 ? `★ ${stats.avgRating.toFixed(1)}` : "—"}
            label="Ortalama Puan"
          />
          {stats.mostActiveMonth && (
            <StatCard
              value={stats.mostActiveMonth[1]}
              label={`Not — ${stats.mostActiveMonth[0]}`}
            />
          )}
        </div>
      </div>

      {/* Kategori Dağılımı */}
      {Object.keys(stats.byCategory).length > 0 && (
        <div>
          <SectionTitle>Kategori Dağılımı</SectionTitle>
          <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-5 space-y-3">
            {Object.entries(stats.byCategory)
              .sort((a, b) => b[1] - a[1])
              .map(([cat, count]) => (
                <HorizBar
                  key={cat}
                  label={cat}
                  count={count}
                  max={maxCategory}
                  color={getCategoryColor(cat)}
                />
              ))}
          </div>
        </div>
      )}

      {/* Durum Dağılımı */}
      {Object.keys(stats.byStatus).length > 0 && (
        <div>
          <SectionTitle>Durum Dağılımı</SectionTitle>
          <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-5 space-y-3">
            {Object.entries(stats.byStatus)
              .sort((a, b) => b[1] - a[1])
              .map(([status, count]) => (
                <HorizBar
                  key={status}
                  label={status}
                  count={count}
                  max={maxStatus}
                  color={getStatusColor(status)}
                />
              ))}
          </div>
        </div>
      )}

      {/* Puan Dağılımı */}
      <div>
        <SectionTitle>Puan Dağılımı</SectionTitle>
        <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-5">
          <div className="flex items-end gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <VertBar
                key={star}
                star={star}
                count={stats.ratingDist[star]}
                max={maxRatingDist}
              />
            ))}
          </div>
        </div>
      </div>

      {/* En Yüksek Puanlı */}
      {stats.topRated.length > 0 && (
        <div>
          <SectionTitle>En Yüksek Puanlı</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {stats.topRated.map((post) => (
              <Link
                key={post.id}
                href={`/posts/${post.id}`}
                className="flex gap-3 bg-[#161616] border border-[#2a2a2a] rounded-xl p-3 hover:border-[#c9a84c]/40 transition-colors"
              >
                {post.image && (
                  <div className="relative w-14 h-20 flex-shrink-0 rounded-lg overflow-hidden">
                    <Image
                      loader={customLoader}
                      src={post.image}
                      alt={post.title}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                )}
                <div className="min-w-0 flex flex-col justify-center gap-1">
                  <p className="text-sm font-semibold text-[#f0ede8] line-clamp-2 leading-tight">
                    {post.title}
                  </p>
                  {post.creator && (
                    <p className="text-[10px] text-[#555555] truncate">{post.creator}</p>
                  )}
                  <StarRating rating={post.rating} size={12} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
