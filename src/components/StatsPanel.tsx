"use client";

import { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Post } from "@/types";
import StarRating from "@/components/StarRating";

const customLoader = ({ src }: { src: string }) => src;

const CATEGORY_COLORS: Record<string, { fill: string; glow: string; bg: string }> = {
  film: { fill: "#c9a84c", glow: "rgba(201,168,76,0.25)", bg: "rgba(201,168,76,0.08)" },
  dizi: { fill: "#818cf8", glow: "rgba(129,140,248,0.25)", bg: "rgba(129,140,248,0.08)" },
  kitap: { fill: "#34d399", glow: "rgba(52,211,153,0.25)", bg: "rgba(52,211,153,0.08)" },
};
const FALLBACK_COLORS = [
  { fill: "#f87171", glow: "rgba(248,113,113,0.25)", bg: "rgba(248,113,113,0.08)" },
  { fill: "#60a5fa", glow: "rgba(96,165,250,0.25)", bg: "rgba(96,165,250,0.08)" },
  { fill: "#a78bfa", glow: "rgba(167,139,250,0.25)", bg: "rgba(167,139,250,0.08)" },
];

function getCategoryColor(cat: string, idx = 0) {
  return CATEGORY_COLORS[cat.toLowerCase()] ?? FALLBACK_COLORS[idx % FALLBACK_COLORS.length];
}

const COMPLETED = ["İzlendi", "Okundu", "Tamamlandı"];
const ONGOING = ["İzleniyor", "Okunuyor", "Devam Ediyor"];

function getStatusGroup(status: string): "done" | "ongoing" | "planned" {
  if (COMPLETED.includes(status)) return "done";
  if (ONGOING.includes(status)) return "ongoing";
  return "planned";
}

/* ─── Donut Chart ─────────────────────────────────────────── */
const R = 38;
const CIRC = 2 * Math.PI * R; // ≈ 238.76

interface DonutSlice {
  label: string;
  count: number;
  color: string;
}

function DonutChart({ slices, total }: { slices: DonutSlice[]; total: number }) {
  let offset = 0;
  const gap = total > 1 ? 2 : 0; // gap between slices in px

  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" style={{ transform: "rotate(-90deg)" }}>
      {/* Track */}
      <circle cx="50" cy="50" r={R} fill="none" stroke="#1a1e2e" strokeWidth="13" />
      {slices.map((s, i) => {
        const pct = total > 0 ? s.count / total : 0;
        const dash = Math.max(0, pct * CIRC - gap);
        const off = -offset;
        offset += pct * CIRC;
        return (
          <circle
            key={i}
            cx="50"
            cy="50"
            r={R}
            fill="none"
            stroke={s.color}
            strokeWidth="13"
            strokeDasharray={`${dash} ${CIRC - dash}`}
            strokeDashoffset={off}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 0.8s cubic-bezier(.4,0,.2,1)" }}
          />
        );
      })}
    </svg>
  );
}

/* ─── Sub-components ──────────────────────────────────────── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.14em] text-[#3a3a5a]">
      {children}
    </p>
  );
}

function BigStat({
  value,
  sub,
  label,
  icon,
  color = "#c9a84c",
}: {
  value: string | number;
  sub?: string;
  label: string;
  icon: React.ReactNode;
  color?: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[#1a1e2e] bg-[#0d0f1a] p-5">
      <div
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
        style={{ background: `${color}18`, border: `1px solid ${color}28` }}
      >
        <span style={{ color }}>{icon}</span>
      </div>
      <div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-black leading-none text-[#f0ede8]">{value}</span>
          {sub && <span className="text-sm text-[#4a5568]">{sub}</span>}
        </div>
        <p className="mt-1 text-[10px] uppercase tracking-wider text-[#3a3a5a]">{label}</p>
      </div>
    </div>
  );
}

function HorizBar({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="group flex items-center gap-3">
      <span className="w-24 flex-shrink-0 truncate text-xs text-[#6272a4] transition-colors group-hover:text-[#f0ede8]">
        {label}
      </span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#1a1e2e]">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            background: color,
            boxShadow: pct > 0 ? `0 0 8px ${color}60` : "none",
          }}
        />
      </div>
      <div className="flex w-16 flex-shrink-0 items-center justify-end gap-2">
        <span className="text-xs font-bold text-[#f0ede8]">{count}</span>
        <span className="text-[10px] text-[#3a3a5a]">{pct.toFixed(0)}%</span>
      </div>
    </div>
  );
}

function RatingBar({ star, count, max }: { star: number; count: number; max: number }) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  const isHigh = star >= 4;
  return (
    <div className="group flex items-center gap-2.5">
      <div className="flex w-16 flex-shrink-0 items-center gap-0.5">
        {Array.from({ length: star }).map((_, i) => (
          <svg key={i} className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="#c9a84c">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        ))}
      </div>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#1a1e2e]">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            background: isHigh
              ? "linear-gradient(90deg, #c9a84c, #e0c068)"
              : "linear-gradient(90deg, #3a3a5a, #5a5a7a)",
          }}
        />
      </div>
      <span className="w-5 flex-shrink-0 text-right text-xs font-bold text-[#f0ede8]">{count}</span>
    </div>
  );
}

/* ─── Monthly Mini Chart ──────────────────────────────────── */
function MonthlyChart({ data }: { data: { month: string; short: string; count: number }[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="flex h-20 items-end gap-1.5">
      {data.map((d, i) => {
        const pct = (d.count / max) * 100;
        const isLast = i === data.length - 1;
        return (
          <div key={d.month} className="group relative flex flex-1 flex-col items-center gap-1.5">
            {d.count > 0 && (
              <div className="absolute -top-7 left-1/2 z-10 hidden -translate-x-1/2 items-center whitespace-nowrap rounded-md border border-[#252d40] bg-[#1a1e2e] px-2 py-0.5 text-[10px] text-[#f0ede8] group-hover:flex">
                {d.count} not
              </div>
            )}
            <div
              className="flex w-full flex-col justify-end overflow-hidden rounded-t-sm bg-[#1a1e2e]"
              style={{ height: 52 }}
            >
              <div
                className="w-full rounded-t-sm transition-all duration-700"
                style={{
                  height: `${pct}%`,
                  background: isLast
                    ? "linear-gradient(180deg, #e0c068, #c9a84c)"
                    : "linear-gradient(180deg, #2a2e50, #1e2238)",
                  minHeight: d.count > 0 ? 4 : 0,
                  boxShadow: isLast && d.count > 0 ? "0 0 10px rgba(201,168,76,0.4)" : "none",
                }}
              />
            </div>
            <span className={`text-[9px] ${isLast ? "text-[#c9a84c]" : "text-[#3a3a5a]"}`}>
              {d.short}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Main Component ──────────────────────────────────────── */
export function StatsPanel({ posts }: { posts: Post[] }) {
  const stats = useMemo(() => {
    const total = posts.length;
    const rated = posts.filter((p) => p.rating > 0);
    const avgRating = rated.length > 0 ? rated.reduce((s, p) => s + p.rating, 0) / rated.length : 0;

    // Category
    const byCatMap: Record<string, number> = {};
    for (const p of posts) byCatMap[p.category] = (byCatMap[p.category] ?? 0) + 1;
    const byCategory = Object.entries(byCatMap).sort((a, b) => b[1] - a[1]);

    // Status groups
    let done = 0,
      ongoing = 0,
      planned = 0;
    for (const p of posts) {
      if (!p.status) {
        planned++;
        continue;
      }
      const g = getStatusGroup(p.status);
      if (g === "done") done++;
      else if (g === "ongoing") ongoing++;
      else planned++;
    }
    const completionPct = total > 0 ? Math.round((done / total) * 100) : 0;

    // Rating dist
    const ratingDist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const p of rated) {
      const b = Math.round(p.rating);
      if (b >= 1 && b <= 5) ratingDist[b]++;
    }
    const maxRatingDist = Math.max(...Object.values(ratingDist), 1);

    // Monthly (last 8 months)
    const now = new Date();
    const months: { month: string; short: string; count: number }[] = [];
    for (let i = 7; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleDateString("tr-TR", { year: "numeric", month: "long" });
      const short = d.toLocaleDateString("tr-TR", { month: "short" }).slice(0, 3);
      months.push({ month: key, short, count: 0 });
    }
    for (const p of posts) {
      const key = new Date(p.createdAt).toLocaleDateString("tr-TR", {
        year: "numeric",
        month: "long",
      });
      const entry = months.find((m) => m.month === key);
      if (entry) entry.count++;
    }

    const topRated = [...rated].sort((a, b) => b.rating - a.rating).slice(0, 5);

    return {
      total,
      rated: rated.length,
      avgRating,
      byCategory,
      done,
      ongoing,
      planned,
      completionPct,
      ratingDist,
      maxRatingDist,
      months,
      topRated,
    };
  }, [posts]);

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-[#1a1e2e] bg-[#0d0f1a]">
          <svg
            className="h-7 w-7 text-[#3a3a5a]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        </div>
        <p className="text-sm text-[#4a5568]">İstatistik görmek için önce not ekle.</p>
        <Link
          href="/new-post"
          className="mt-3 text-xs text-[#c9a84c] transition-colors hover:text-[#e0c068]"
        >
          + İlk notu ekle
        </Link>
      </div>
    );
  }

  // Donut slices
  const donutSlices = stats.byCategory.map(([cat], i) => ({
    label: cat,
    count: stats.byCategory.find(([c]) => c === cat)?.[1] ?? 0,
    color: getCategoryColor(cat, i).fill,
  }));

  return (
    <div className="space-y-5">
      {/* ── Büyük stat kartları ── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <BigStat
          value={stats.total}
          label="Toplam Not"
          color="#c9a84c"
          icon={
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          }
        />
        <BigStat
          value={stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "—"}
          sub={stats.avgRating > 0 ? "/ 5" : undefined}
          label="Ortalama Puan"
          color="#e0c068"
          icon={
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          }
        />
        <BigStat
          value={`${stats.completionPct}%`}
          label="Tamamlanma"
          color="#34d399"
          icon={
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
        />
        <BigStat
          value={stats.rated}
          label="Puanlanan Not"
          color="#818cf8"
          icon={
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
              />
            </svg>
          }
        />
      </div>

      {/* ── Orta bölüm: Donut + Puan dağılımı ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Kategori donut */}
        <div className="rounded-2xl border border-[#1a1e2e] bg-[#0d0f1a] p-5">
          <SectionLabel>Kategori Dağılımı</SectionLabel>
          <div className="flex items-center gap-6">
            {/* Donut */}
            <div className="relative h-28 w-28 flex-shrink-0">
              <DonutChart slices={donutSlices} total={stats.total} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-black text-[#f0ede8]">{stats.total}</span>
                <span className="text-[9px] uppercase tracking-wider text-[#3a3a5a]">Not</span>
              </div>
            </div>
            {/* Legend + bars */}
            <div className="flex-1 space-y-3">
              {stats.byCategory.map(([cat, count], i) => {
                const colors = getCategoryColor(cat, i);
                return (
                  <div key={cat} className="flex items-center gap-2.5">
                    <span
                      className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                      style={{ background: colors.fill, boxShadow: `0 0 6px ${colors.glow}` }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="truncate text-xs text-[#8892b0]">{cat}</span>
                        <span className="ml-2 text-xs font-bold text-[#f0ede8]">{count}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-[#1a1e2e]">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${(count / stats.total) * 100}%`,
                            background: colors.fill,
                            boxShadow: `0 0 8px ${colors.glow}`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Puan dağılımı */}
        <div className="rounded-2xl border border-[#1a1e2e] bg-[#0d0f1a] p-5">
          <SectionLabel>Puan Dağılımı</SectionLabel>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((star) => (
              <RatingBar
                key={star}
                star={star}
                count={stats.ratingDist[star]}
                max={stats.maxRatingDist}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Durum Dağılımı ── */}
      <div className="rounded-2xl border border-[#1a1e2e] bg-[#0d0f1a] p-5">
        <SectionLabel>Durum Özeti</SectionLabel>
        <div className="mb-5 grid grid-cols-3 gap-3">
          {[
            { label: "Tamamlandı", count: stats.done, color: "#34d399", icon: "✓" },
            { label: "Devam Ediyor", count: stats.ongoing, color: "#c9a84c", icon: "▶" },
            { label: "Bekliyor", count: stats.planned, color: "#6272a4", icon: "◷" },
          ].map((s) => (
            <div
              key={s.label}
              className="flex flex-col gap-2 rounded-xl border p-3.5"
              style={{ background: `${s.color}08`, borderColor: `${s.color}20` }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold" style={{ color: s.color }}>
                  {s.icon}
                </span>
                <span className="text-2xl font-black text-[#f0ede8]">{s.count}</span>
              </div>
              <p className="text-[10px] uppercase tracking-wider" style={{ color: `${s.color}99` }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>
        {/* Tamamlanma progress bar */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-[#3a3a5a]">
              Tamamlanma Oranı
            </span>
            <span className="text-xs font-bold text-[#34d399]">{stats.completionPct}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#1a1e2e]">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${stats.completionPct}%`,
                background: "linear-gradient(90deg, #34d399, #6ee7b7)",
                boxShadow: "0 0 12px rgba(52,211,153,0.4)",
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Aylık Aktivite ── */}
      <div className="rounded-2xl border border-[#1a1e2e] bg-[#0d0f1a] p-5">
        <div className="mb-4 flex items-center justify-between">
          <SectionLabel>Aylık Aktivite</SectionLabel>
          <span className="text-[10px] text-[#3a3a5a]">Son 8 ay</span>
        </div>
        <MonthlyChart data={stats.months} />
      </div>

      {/* ── En Yüksek Puanlı ── */}
      {stats.topRated.length > 0 && (
        <div className="rounded-2xl border border-[#1a1e2e] bg-[#0d0f1a] p-5">
          <SectionLabel>En Yüksek Puanlı ({stats.topRated.length})</SectionLabel>
          <div className="space-y-2">
            {stats.topRated.map((post, i) => (
              <Link
                key={post.id}
                href={`/posts/${post.id}`}
                className="group flex items-center gap-3 rounded-xl border border-[#1a1e2e] p-3 transition-all duration-200 hover:border-[#c9a84c]/30 hover:bg-[#c9a84c]/5"
              >
                {/* Rank */}
                <span
                  className="w-5 flex-shrink-0 text-center text-[10px] font-black"
                  style={{
                    color:
                      i === 0 ? "#c9a84c" : i === 1 ? "#a0a0c0" : i === 2 ? "#b08060" : "#3a3a5a",
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>

                {/* Image */}
                {post.image && (
                  <div className="relative h-14 w-9 flex-shrink-0 overflow-hidden rounded-md">
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

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-semibold text-[#e8eaf6] transition-colors group-hover:text-[#c9a84c]">
                    {post.title}
                  </p>
                  <div className="mt-0.5 flex items-center gap-2">
                    {post.creator && (
                      <span className="truncate text-[10px] text-[#4a5568]">{post.creator}</span>
                    )}
                    {post.years && (
                      <span className="text-[10px] text-[#3a3a5a]">· {post.years}</span>
                    )}
                  </div>
                </div>

                {/* Rating */}
                <div className="flex flex-shrink-0 flex-col items-end gap-0.5">
                  <StarRating rating={post.rating} size={11} />
                  <span className="text-[10px] font-bold text-[#c9a84c]">{post.rating}/5</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
