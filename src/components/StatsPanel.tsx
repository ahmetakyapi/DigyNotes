"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Post } from "@/types";
import { getCategoryLabel } from "@/lib/categories";
import { getPostImageSrc } from "@/lib/post-image";
import StarRating from "@/components/StarRating";
import { ResilientImage } from "@/components/ResilientImage";

/* Lavender leads, apricot follows, then the neutral ink ramp — theme tokens only. */
const CATEGORY_COLORS: Record<string, { fill: string }> = {
  movies: { fill: "var(--gold)" },
  series: { fill: "var(--accent-2)" },
  book: { fill: "var(--gold-light)" },
};
const FALLBACK_COLORS = [
  { fill: "var(--text-secondary)" },
  { fill: "var(--text-muted)" },
  { fill: "var(--text-faint)" },
];

const monoLabel = "text-[12.5px] text-[var(--text-muted)] font-medium";
const panelClass = "rounded-[22px] border border-[var(--border)] bg-[var(--bg-card)] p-5 sm:p-6";

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
      <circle cx="50" cy="50" r={R} fill="none" stroke="var(--border)" strokeWidth="13" />
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
  return <p className={`${monoLabel} mb-4`}>{children}</p>;
}

function BigStat({
  value,
  sub,
  label,
  icon,
  color = "var(--gold)",
}: {
  value: string | number;
  sub?: string;
  label: string;
  icon: React.ReactNode;
  color?: string;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-[22px] border border-[var(--border)] bg-[var(--bg-card)] p-5">
      <div className="flex items-center justify-between gap-2">
        <p className={monoLabel}>{label}</p>
        <span style={{ color }}>{icon}</span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="dn-display text-5xl italic leading-[0.9] tracking-[-0.02em] text-[var(--text-primary)]">
          {value}
        </span>
        {sub && <span className="dn-mono text-[11px] text-[var(--text-muted)]">{sub}</span>}
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
      <span className="w-24 flex-shrink-0 truncate text-xs text-[var(--text-secondary)] transition-colors group-hover:text-[var(--text-primary)]">
        {label}
      </span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--bg-raised)]">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            background: color,
          }}
        />
      </div>
      <div className="flex w-16 flex-shrink-0 items-center justify-end gap-2">
        <span className="text-xs font-bold text-[var(--text-primary)]">{count}</span>
        <span className="dn-mono text-[12px] text-[var(--text-muted)]">{pct.toFixed(0)}%</span>
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
          <svg key={i} className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="var(--gold)">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        ))}
      </div>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--bg-raised)]">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out-expo"
          style={{
            width: `${pct}%`,
            background: isHigh ? "var(--gold)" : "var(--accent-2)",
          }}
        />
      </div>
      <span className="dn-mono w-6 flex-shrink-0 text-right text-[11px] text-[var(--text-primary)]">
        {count}
      </span>
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
              <div className="dn-mono absolute -top-7 left-1/2 z-10 hidden -translate-x-1/2 items-center whitespace-nowrap rounded-full border border-[var(--border)] bg-[var(--bg-raised)] px-2 py-0.5 text-[12px] text-[var(--text-primary)] group-hover:flex">
                {d.count} not
              </div>
            )}
            <div
              className="flex w-full flex-col justify-end overflow-hidden rounded-full bg-[var(--bg-raised)]"
              style={{ height: 52 }}
            >
              <div
                className="w-full rounded-full transition-all duration-700 ease-out-expo"
                style={{
                  height: `${pct}%`,
                  background: isLast ? "var(--gold)" : "var(--text-faint)",
                  minHeight: d.count > 0 ? 4 : 0,
                }}
              />
            </div>
            <span
              className={`text-[11px] font-medium ${isLast ? "text-accent" : "text-[var(--text-muted)]"}`}
            >
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
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-card)]">
          <svg
            className="h-7 w-7 text-[var(--text-muted)]"
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
        <p className="text-sm text-[var(--text-muted)]">İstatistik görmek için önce not ekle.</p>
        <Link
          href="/new-post"
          className="mt-4 cursor-pointer rounded-full border border-[var(--border)] px-4 py-2 text-xs font-medium text-[var(--text-secondary)] transition-colors duration-200 ease-out-expo hover:border-[var(--text-primary)] hover:text-[var(--text-primary)] active:scale-95"
        >
          İlk Notu Ekle
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
          color="var(--gold)"
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
          value={stats.avgRating > 0 ? stats.avgRating.toFixed(1).replace(".", ",") : "—"}
          sub={stats.avgRating > 0 ? "/ 5" : undefined}
          label="Ortalama Puan"
          color="var(--gold-light)"
          icon={
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          }
        />
        <BigStat
          value={`${stats.completionPct}%`}
          label="Tamamlanma"
          color="var(--gold-light)"
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
          color="var(--gold-light)"
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
        <div className={panelClass}>
          <SectionLabel>Kategori Dağılımı</SectionLabel>
          <div className="flex items-center gap-6">
            {/* Donut */}
            <div className="relative h-28 w-28 flex-shrink-0">
              <DonutChart slices={donutSlices} total={stats.total} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="dn-display text-3xl italic leading-none text-[var(--text-primary)]">
                  {stats.total}
                </span>
                <span className="text-[11px] font-medium text-[var(--text-muted)]">Not</span>
              </div>
            </div>
            {/* Legend + bars */}
            <div className="flex-1 space-y-3">
              {stats.byCategory.map(([cat, count], i) => {
                const colors = getCategoryColor(cat, i);
                return (
                  <div key={cat} className="flex items-center gap-2.5">
                    <span
                      className="h-2 w-2 flex-shrink-0 rounded-full"
                      style={{ background: colors.fill }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="truncate text-xs text-[var(--text-secondary)]">
                          {getCategoryLabel(cat)}
                        </span>
                        <span className="ml-2 text-xs font-bold text-[var(--text-primary)]">
                          {count}
                        </span>
                      </div>
                      <div className="h-1 overflow-hidden rounded-full bg-[var(--bg-raised)]">
                        <div
                          className="h-full rounded-full transition-all duration-700 ease-out-expo"
                          style={{
                            width: `${(count / stats.total) * 100}%`,
                            background: colors.fill,
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
        <div className={panelClass}>
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
      <div className={panelClass}>
        <SectionLabel>Durum Özeti</SectionLabel>
        {/* LAYOUT: three hairline-divided status cells, serif-italic counts */}
        <div className="mb-6 grid grid-cols-3 divide-x divide-[var(--border)] border-y border-[var(--border)]">
          {[
            { label: "Tamamlandı", count: stats.done, dot: "bg-[var(--gold)]" },
            { label: "Devam Ediyor", count: stats.ongoing, dot: "bg-[var(--accent-2)]" },
            { label: "Bekliyor", count: stats.planned, dot: "bg-[var(--text-faint)]" },
          ].map((s) => (
            <div key={s.label} className="flex flex-col gap-2 px-3 py-4 first:pl-0">
              <span className="dn-display text-4xl italic leading-none text-[var(--text-primary)]">
                {s.count}
              </span>
              <p className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--text-muted)]">
                <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                {s.label}
              </p>
            </div>
          ))}
        </div>
        {/* Tamamlanma progress bar */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className={monoLabel}>Tamamlanma Oranı</span>
            <span className="dn-mono text-[11px] text-[var(--gold)]">{stats.completionPct}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[var(--bg-raised)]">
            <div
              className="h-full rounded-full bg-accent transition-all duration-1000 ease-out-expo"
              style={{ width: `${stats.completionPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Aylık Aktivite ── */}
      <div className={panelClass}>
        <div className="mb-4 flex items-center justify-between">
          <SectionLabel>Aylık Aktivite</SectionLabel>
          <span className="mb-4 text-[12px] font-medium text-[var(--text-muted)]">Son 8 ay</span>
        </div>
        <MonthlyChart data={stats.months} />
      </div>

      {/* ── En Yüksek Puanlı ── */}
      {stats.topRated.length > 0 && (
        <div className={panelClass}>
          <SectionLabel>En Yüksek Puanlı ({stats.topRated.length})</SectionLabel>
          <div className="divide-y divide-[var(--border)] border-y border-[var(--border)]">
            {stats.topRated.map((post, i) => (
              <Link
                key={post.id}
                href={`/posts/${post.id}`}
                className="group flex cursor-pointer items-center gap-4 py-3 transition-colors duration-200 ease-out-expo"
              >
                {/* Rank */}
                <span
                  className={`dn-display w-8 flex-shrink-0 text-3xl italic leading-none ${
                    i === 0 ? "text-[var(--gold)]" : "text-[var(--text-faint)]"
                  }`}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>

                {/* Image */}
                <div className="relative h-14 w-9 flex-shrink-0 overflow-hidden rounded-lg border border-[var(--border)]">
                  <ResilientImage
                    src={getPostImageSrc(post.image, post.category)}
                    alt={post.title}
                    fill
                    variant="tall"
                    className="object-cover"
                  />
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-semibold text-[var(--text-primary)] transition-colors group-hover:text-accent">
                    {post.title}
                  </p>
                  <div className="mt-0.5 flex items-center gap-2">
                    {post.creator && (
                      <span className="truncate text-[12px] text-[var(--text-muted)]">
                        {post.creator}
                      </span>
                    )}
                    {post.years && (
                      <span className="text-[12px] text-[var(--text-muted)]">· {post.years}</span>
                    )}
                  </div>
                </div>

                {/* Rating */}
                <div className="flex flex-shrink-0 flex-col items-end gap-0.5">
                  <StarRating rating={post.rating} size={11} />
                  <span className="dn-mono text-[12px] text-accent">{post.rating}/5</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
