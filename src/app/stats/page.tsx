"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ChartBar,
  Star,
  Hash,
  TrendUp,
  Crown,
  CalendarBlank,
  Crosshair,
  Timer,
  Lightning,
} from "@phosphor-icons/react";
import { getCategoryLabel } from "@/lib/categories";
import {
  getActiveMonthCount,
  getRecentMomentum,
  getShareLabel,
  getSparseDataLabel,
  getTopItem,
} from "@/lib/stats-insights";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

/* ── Types ── */
interface StatsData {
  kpis: {
    totalPosts: number;
    avgRating: number;
    postsThisYear: number;
    uniqueTags: number;
  };
  monthlySeries: { month: string; count: number }[];
  categories: { name: string; count: number }[];
  statuses: { name: string; count: number }[];
  topTags: { name: string; count: number }[];
  ratingDistribution: { label: string; count: number }[];
}

/* ── Constants ── */
const CHART_COLORS = ["#10b981", "#34d399", "#6888c0", "#c8b090", "#f472b6", "#fb923c"];

const TOOLTIP_STYLE = {
  background: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: 14,
  color: "var(--text-primary)",
  fontSize: 12,
  boxShadow: "0 12px 32px rgba(0,0,0,0.4)",
};

/* ── Shared Components ── */
function SectionHeader({
  icon,
  title,
  accent = "var(--gold)",
}: {
  icon: React.ReactNode;
  title: string;
  accent?: string;
}) {
  return (
    <div className="mb-5 flex items-center gap-2.5">
      <div
        className="flex h-7 w-7 items-center justify-center rounded-lg"
        style={{ background: `${accent}18` }}
      >
        {icon}
      </div>
      <h2 className="text-sm font-semibold tracking-wide text-[var(--text-primary)]">{title}</h2>
    </div>
  );
}

function ChartCard({
  icon,
  title,
  accent,
  children,
  className = "",
}: {
  icon: React.ReactNode;
  title: string;
  accent?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`group rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 transition-all duration-300 hover:border-[color-mix(in_srgb,var(--gold)_25%,transparent)] hover:shadow-[0_0_32px_rgba(16,185,129,0.04)] ${className}`}
    >
      <SectionHeader icon={icon} title={title} accent={accent} />
      {children}
    </section>
  );
}

/* ── Main Page ── */
export default function PersonalStatsPage() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/users/me/stats")
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        setData(payload);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const ratedCount = data?.ratingDistribution.reduce((total, item) => total + item.count, 0) ?? 0;
  const ratedShare =
    data && data.kpis.totalPosts > 0 ? Math.round((ratedCount / data.kpis.totalPosts) * 100) : 0;
  const topCategory = data?.categories[0];
  const strongestMonth =
    data && data.monthlySeries.length > 0
      ? data.monthlySeries.reduce((best, item) => (item.count > best.count ? item : best))
      : null;
  const topStatus = data?.statuses[0];
  const activeMonths = data ? getActiveMonthCount(data.monthlySeries) : 0;
  const recentMomentum = data ? getRecentMomentum(data.monthlySeries) : null;
  const topTag = data ? getTopItem(data.topTags) : null;
  const sparseDataLabel = data ? getSparseDataLabel(data.kpis.totalPosts, activeMonths) : null;

  /* ── Loading ── */
  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-8 h-10 w-64 animate-pulse rounded-xl bg-[var(--bg-card)]" />
        <div className="mb-8 h-64 animate-pulse rounded-[28px] border border-[var(--border)] bg-[var(--bg-card)]" />
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-[120px] animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]"
            />
          ))}
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-80 animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]"
            />
          ))}
        </div>
      </main>
    );
  }

  /* ── Error ── */
  if (!data) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-6 py-16 text-center">
          <p className="text-sm text-[var(--text-muted)]">İstatistikler yüklenemedi.</p>
        </div>
      </main>
    );
  }

  /* ── Empty ── */
  if (data.kpis.totalPosts === 0) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <PageHeader />
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg-card)] px-6 py-16 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(16,185,129,0.1)]">
            <ChartBar size={24} weight="duotone" className="text-[var(--gold)]" />
          </div>
          <p className="text-base font-semibold text-[var(--text-primary)]">
            Henüz analiz edilecek not yok.
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--text-muted)]">
            İlk notunu eklediğinde kategori, puan ve ritim trendleri burada görünür. Notlara puan,
            durum ve etiket ekledikçe özetler daha anlamlı hale gelir.
          </p>
          <Link
            href="/new-post"
            className="mt-6 inline-flex rounded-xl bg-[var(--gold)] px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:brightness-110 active:scale-95"
          >
            İlk notu oluştur
          </Link>
        </div>
      </main>
    );
  }

  /* ── Main Content ── */
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <PageHeader />

      {/* ═══ Hero Insight ═══ */}
      <section className="relative mb-8 overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--bg-card)] shadow-[var(--shadow-soft)]">
        {/* Decorative gradient mesh */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_10%_20%,rgba(16,185,129,0.12),transparent_60%),radial-gradient(ellipse_60%_50%_at_90%_80%,rgba(14,165,233,0.08),transparent_50%)]" />

        <div className="relative p-6 sm:p-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--gold)]">
            Arşiv Okuması
          </p>
          <h2 className="mt-3 max-w-2xl text-xl font-bold leading-snug text-[var(--text-primary)] sm:text-2xl">
            {topCategory
              ? `En çok ${getCategoryLabel(topCategory.name).toLowerCase()} kategorisinde not tutuyorsun.`
              : "Notların henüz tek bir kategoride yoğunlaşmamış."}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)]">
            {strongestMonth
              ? `${strongestMonth.month} döneminde ${strongestMonth.count} notla en yoğun ayını geçirmişsin.`
              : "Aylık ritim için daha fazla veriye ihtiyaç var."}{" "}
            {topTag
              ? `En sık kullandığın etiket #${topTag.name}.`
              : "Etiket kullanımın arttıkça tematik örüntüler burada belirginleşecek."}
          </p>

          {/* Insight mini-cards */}
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <InsightMiniCard
              icon={<Timer size={14} weight="bold" className="text-[#34d399]" />}
              label="Ritim"
              value={`${activeMonths}/12 ay aktif`}
              detail={
                recentMomentum?.label ??
                "Birkaç ay daha not eklediğinde tempo değişimin burada görünecek."
              }
            />
            <InsightMiniCard
              icon={<Crosshair size={14} weight="bold" className="text-[#6888c0]" />}
              label="Fokus"
              value={
                topCategory
                  ? `${getCategoryLabel(topCategory.name)} ${getShareLabel(topCategory.count, data.kpis.totalPosts)}`
                  : "-"
              }
              detail={
                topCategory
                  ? `${topCategory.count} not ile en yoğun kategorin.`
                  : "Kategori trendi için yeterli veri yok."
              }
            />
            <InsightMiniCard
              icon={<Lightning size={14} weight="bold" className="text-[#c8b090]" />}
              label="Alışkanlık"
              value={`%${ratedShare} puanlı`}
              detail={
                topStatus
                  ? `En sık durum ${topStatus.name.toLowerCase()}.`
                  : "Puan verdikçe değerlendirme alışkanlığın burada görünür."
              }
            />
          </div>

          {sparseDataLabel && (
            <div className="mt-5 rounded-xl border border-dashed border-[var(--border)] bg-[rgba(0,0,0,0.15)] px-4 py-3 text-xs leading-5 text-[var(--text-muted)]">
              {sparseDataLabel}
            </div>
          )}
        </div>
      </section>

      {/* ═══ Highlight Summary ═══ */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <HighlightCard
          icon={<Crown size={18} weight="duotone" className="text-[#c8b090]" />}
          accent="#c8b090"
          label="En Güçlü Kategori"
          value={topCategory ? getCategoryLabel(topCategory.name) : "-"}
          detail={topCategory ? `${topCategory.count} not ile önde` : "Yeterli veri yok"}
        />
        <HighlightCard
          icon={<TrendUp size={18} weight="duotone" className="text-[#34d399]" />}
          accent="#34d399"
          label="En Üretken Dönem"
          value={strongestMonth?.month ?? "-"}
          detail={strongestMonth ? `${strongestMonth.count} not` : "Yeterli veri yok"}
        />
        <HighlightCard
          icon={<Star size={18} weight="duotone" className="text-[var(--gold)]" />}
          accent="var(--gold)"
          label="Puanlanan İçerik"
          value={`%${ratedShare}`}
          detail={topStatus ? `En sık durum: ${topStatus.name}` : "Durum verisi hazır"}
        />
      </div>

      {/* ═══ KPI Row ═══ */}
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard
          icon={<ChartBar size={16} weight="duotone" />}
          accent="#10b981"
          label="Toplam Not"
          value={data.kpis.totalPosts}
        />
        <KpiCard
          icon={<Star size={16} weight="fill" />}
          accent="#c8b090"
          label="Ortalama Puan"
          value={data.kpis.avgRating > 0 ? data.kpis.avgRating : "—"}
        />
        <KpiCard
          icon={<CalendarBlank size={16} weight="duotone" />}
          accent="#6888c0"
          label="Bu Yıl"
          value={data.kpis.postsThisYear}
        />
        <KpiCard
          icon={<Hash size={16} weight="duotone" />}
          accent="#34d399"
          label="Benzersiz Etiket"
          value={data.kpis.uniqueTags}
        />
      </div>

      {/* ═══ Charts Grid ═══ */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Monthly Production */}
        <ChartCard
          icon={<TrendUp size={14} weight="bold" className="text-[#10b981]" />}
          title="Aylık Üretim"
          accent="#10b981"
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.monthlySeries} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="statsAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ stroke: "var(--border)", strokeDasharray: "4 4" }} />
                <Area
                  type="monotone"
                  dataKey="count"
                  name="Not"
                  stroke="#10b981"
                  fill="url(#statsAreaGrad)"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: "#10b981", stroke: "var(--bg-card)", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Category Distribution */}
        <ChartCard
          icon={<Crosshair size={14} weight="bold" className="text-[#6888c0]" />}
          title="Kategori Dağılımı"
          accent="#6888c0"
        >
          <div className="flex h-72 items-center">
            <div className="w-1/2">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={data.categories}
                    dataKey="count"
                    nameKey="name"
                    innerRadius={56}
                    outerRadius={84}
                    paddingAngle={3}
                    strokeWidth={0}
                  >
                    {data.categories.map((entry, index) => (
                      <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-3 pl-4">
              {data.categories.slice(0, 5).map((item, index) => {
                const pct = data.kpis.totalPosts > 0 ? Math.round((item.count / data.kpis.totalPosts) * 100) : 0;
                return (
                  <div key={item.name} className="flex items-center gap-3">
                    <span
                      className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                      style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                    />
                    <span className="flex-1 truncate text-xs text-[var(--text-secondary)]">
                      {getCategoryLabel(item.name)}
                    </span>
                    <span className="text-xs font-semibold tabular-nums text-[var(--text-primary)]">
                      {item.count}
                    </span>
                    <span className="w-8 text-right text-[10px] tabular-nums text-[var(--text-muted)]">
                      %{pct}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </ChartCard>

        {/* Rating Distribution */}
        <ChartCard
          icon={<Star size={14} weight="fill" className="text-[#c8b090]" />}
          title="Puan Dağılımı"
          accent="#c8b090"
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.ratingDistribution} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(16,185,129,0.06)" }} />
                <Bar dataKey="count" name="Not" radius={[8, 8, 0, 0]} fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Status & Tags */}
        <ChartCard
          icon={<Hash size={14} weight="bold" className="text-[#34d399]" />}
          title="Durumlar ve Etiketler"
          accent="#34d399"
        >
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Statuses */}
            <div>
              <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                Durum Dağılımı
              </p>
              <div className="space-y-3">
                {data.statuses.map((item) => {
                  const pct = data.kpis.totalPosts > 0 ? Math.round((item.count / data.kpis.totalPosts) * 100) : 0;
                  return (
                    <div key={item.name}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="text-[var(--text-secondary)]">{item.name}</span>
                        <span className="font-semibold tabular-nums text-[var(--text-primary)]">
                          {item.count}
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-[var(--bg-raised)]">
                        <div
                          className="h-full rounded-full bg-[#10b981] transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tags */}
            <div>
              <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                En Aktif Etiketler
              </p>
              {data.topTags.length === 0 ? (
                <p className="text-xs leading-5 text-[var(--text-muted)]">
                  Henüz etiket yok. Etiket ekledikçe tekrar eden temalar burada görünür.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {data.topTags.map((tag) => (
                    <Link
                      key={tag.name}
                      href={`/tag/${tag.name}`}
                      className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-raised)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-all duration-200 hover:border-[color-mix(in_srgb,var(--gold)_30%,transparent)] hover:text-[var(--gold)]"
                    >
                      <Hash size={10} weight="bold" />
                      {tag.name}
                      <span className="ml-0.5 tabular-nums text-[var(--text-muted)]">
                        {tag.count}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ChartCard>
      </div>
    </main>
  );
}

/* ══════════════════════════════════════════════
   Sub-Components
   ══════════════════════════════════════════════ */

function PageHeader() {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Kişisel İstatistikler</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Üretim ritmini, kategorilerini ve puan dağılımını takip et.
        </p>
      </div>
      <Link
        href="/stats/year-in-review"
        className="group flex items-center gap-2 self-start rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2.5 text-xs font-semibold text-[var(--text-secondary)] transition-all duration-200 hover:border-[color-mix(in_srgb,var(--gold)_30%,transparent)] hover:text-[var(--gold)]"
      >
        <CalendarBlank size={14} weight="duotone" />
        Yılın Özeti
        <span className="inline-block transition-transform duration-200 group-hover:translate-x-0.5">
          →
        </span>
      </Link>
    </div>
  );
}

function InsightMiniCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[rgba(7,12,22,0.5)] px-5 py-4 backdrop-blur-sm transition-all duration-300 hover:border-[color-mix(in_srgb,var(--gold)_20%,transparent)]">
      <div className="mb-2 flex items-center gap-2">
        {icon}
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-faint)]">
          {label}
        </p>
      </div>
      <p className="text-lg font-bold text-[var(--text-primary)]">{value}</p>
      <p className="mt-1.5 text-xs leading-5 text-[var(--text-muted)]">{detail}</p>
    </div>
  );
}

function HighlightCard({
  icon,
  accent,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  accent: string;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 transition-all duration-300 hover:border-[color-mix(in_srgb,var(--gold)_25%,transparent)] hover:shadow-[0_0_32px_rgba(16,185,129,0.04)]">
      {/* Accent line at top */}
      <div
        className="absolute left-0 right-0 top-0 h-[2px] opacity-60 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }}
      />
      <div className="mb-3 flex items-center gap-3">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{ background: `${accent}18` }}
        >
          {icon}
        </div>
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--text-muted)]">
          {label}
        </p>
      </div>
      <p className="text-xl font-bold text-[var(--text-primary)]">{value}</p>
      <p className="mt-1 text-xs text-[var(--text-muted)]">{detail}</p>
    </div>
  );
}

function KpiCard({
  icon,
  accent,
  label,
  value,
}: {
  icon: React.ReactNode;
  accent: string;
  label: string;
  value: string | number;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 transition-all duration-300 hover:border-[color-mix(in_srgb,var(--gold)_25%,transparent)]">
      <div className="mb-3 flex items-center gap-2">
        <div
          className="flex h-7 w-7 items-center justify-center rounded-lg"
          style={{ background: `${accent}18`, color: accent }}
        >
          {icon}
        </div>
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">
          {label}
        </p>
      </div>
      <p className="text-3xl font-black tabular-nums text-[var(--text-primary)]">{value}</p>
    </div>
  );
}
