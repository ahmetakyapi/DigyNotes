"use client";

/*
  LAYOUT: Personal stats — editorial, single column (max-w-6xl).
  ROW 1: shared PageHeader (14) with headline stats + "Yılın Özeti" pill.
  ROW 2: "Arşiv Okuması" pull-quote — accent left rule, large statement, three hairline insights.
  ROW 3: KPI strip — four cells divided by hairlines, enormous serif-italic numbers.
  ROW 4: three highlight cells (category / month / rated share).
  ROW 5: 2×2 chart grid in hairline cards; lavender primary, apricot secondary.
  MOTION: sections fade/rise in sequence (framer-motion), disabled with reduced motion.
*/
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRightIcon, ChartBarIcon, HashIcon, CalendarBlankIcon } from "@phosphor-icons/react";
import { getCategoryLabel } from "@/lib/categories";
import {
  getActiveMonthCount,
  getRecentMomentum,
  getShareLabel,
  getSparseDataLabel,
  getTopItem,
} from "@/lib/stats-insights";
import { PageHeader, Em, Dot } from "@/components/ui/PageHeader";
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
const EASE = [0.16, 1, 0.3, 1] as const;

/* Lavender leads, apricot follows, then the neutral ink ramp. */
const CHART_COLORS = [
  "var(--gold)",
  "var(--accent-2)",
  "var(--gold-light)",
  "var(--text-secondary)",
  "var(--text-muted)",
  "var(--text-faint)",
];

const TOOLTIP_STYLE = {
  background: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: 14,
  color: "var(--text-primary)",
  fontSize: 12,
  boxShadow: "var(--shadow-soft)",
};

const TICK_STYLE = {
  fontSize: 10.5,
  fill: "var(--text-muted)",
  fontFamily: "var(--font-mono), ui-monospace, monospace",
};

const monoLabel = "dn-mono text-[10.5px] uppercase tracking-[0.16em] text-[var(--text-muted)]";

/* ── Shared Components ── */
function Reveal({
  order,
  className = "",
  children,
}: {
  order: number;
  className?: string;
  children: ReactNode;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: EASE, delay: 0.15 + order * 0.08 }}
    >
      {children}
    </motion.div>
  );
}

function ChartCard({
  index,
  title,
  aside,
  children,
}: {
  index: string;
  title: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="h-full rounded-[24px] border border-[var(--border)] bg-[var(--bg-card)] p-6 transition-colors duration-300 ease-out-expo hover:border-accent/30 sm:p-7">
      <div className="mb-6 flex items-baseline justify-between gap-3">
        <div>
          <p className={monoLabel}>
            <span className="text-[var(--gold)]">({index})</span>
          </p>
          <h2 className="mt-1.5 text-lg font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
            {title}
          </h2>
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}

function StatsHeader({ data }: { data?: StatsData }) {
  return (
    <PageHeader
      index="14"
      eyebrow="İstatistikler"
      title={
        <>
          Rakamlarla <Em>Notların</Em>
          <Dot />
        </>
      }
      description="Ne kadar not aldığını, en çok neyi izleyip okuduğunu ve puanlarını gör."
      stats={
        data
          ? [
              { value: data.kpis.totalPosts, label: "Not" },
              { value: data.kpis.postsThisYear, label: "Bu Yıl" },
            ]
          : undefined
      }
      actions={
        <Link
          href="/stats/year-in-review"
          className="group inline-flex cursor-pointer items-center gap-2 rounded-full border border-[var(--border)] px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] transition-colors duration-200 ease-out-expo hover:border-[var(--text-primary)] hover:text-[var(--text-primary)] active:scale-95"
        >
          <CalendarBlankIcon size={14} weight="duotone" />
          Yılın Özeti
          <ArrowRightIcon
            size={12}
            weight="bold"
            className="transition-transform duration-200 ease-out-expo group-hover:translate-x-0.5"
          />
        </Link>
      }
    />
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
        <div className="mb-4 h-3 w-48 animate-pulse rounded-full bg-[var(--bg-card)]" />
        <div className="mb-10 h-16 w-80 animate-pulse rounded-2xl bg-[var(--bg-card)]" />
        <div className="mb-10 h-56 animate-pulse rounded-[24px] border border-[var(--border)] bg-[var(--bg-card)]" />
        <div className="mb-10 grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-[120px] animate-pulse rounded-[22px] border border-[var(--border)] bg-[var(--bg-card)]"
            />
          ))}
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-80 animate-pulse rounded-[24px] border border-[var(--border)] bg-[var(--bg-card)]"
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
        <div className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-card)] px-6 py-16 text-center">
          <p className="text-sm text-[var(--text-muted)]">
            İstatistikler yüklenemedi. Biraz sonra tekrar dene.
          </p>
        </div>
      </main>
    );
  }

  /* ── Empty ── */
  if (data.kpis.totalPosts === 0) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <StatsHeader />
        <div className="rounded-[24px] border border-dashed border-[var(--border)] bg-[var(--bg-card)] px-6 py-16 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-accent/25 bg-accent/10">
            <ChartBarIcon size={24} weight="duotone" className="text-[var(--gold)]" />
          </div>
          <p className="text-lg font-semibold text-[var(--text-primary)]">Henüz notun yok.</p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--text-muted)]">
            İlk notunu eklediğinde istatistiklerin burada görünmeye başlar. Notlarına puan, durum ve
            etiket ekledikçe burada daha çok şey göreceksin.
          </p>
          <Link
            href="/new-post"
            className="mt-6 inline-flex cursor-pointer rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-[var(--text-on-accent)] transition-all duration-200 ease-out-expo hover:bg-accent-dark active:scale-95"
          >
            İlk Notunu Yaz
          </Link>
        </div>
      </main>
    );
  }

  /* ── Main Content ── */
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <StatsHeader data={data} />

      {/* LAYOUT: editorial pull-quote — accent left rule, statement + supporting line, 3 hairline insights */}
      <Reveal order={0} className="mb-12">
        <blockquote className="border-l-2 border-accent pl-5 sm:pl-8">
          <p className={monoLabel}>
            <span className="text-[var(--gold)]">(i)</span> Kısaca
          </p>
          <p className="mt-4 max-w-4xl text-[clamp(1.6rem,3.6vw,2.75rem)] font-bold leading-[1.08] tracking-[-0.035em] text-[var(--text-primary)]">
            {topCategory ? (
              <>
                En çok <Em>{getCategoryLabel(topCategory.name).toLowerCase()}</Em> kategorisinde not
                tutuyorsun
                <Dot />
              </>
            ) : (
              <>
                Notların farklı kategorilere <Em>dağılmış</Em>
                <Dot />
              </>
            )}
          </p>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[var(--text-secondary)]">
            {strongestMonth
              ? `En çok not aldığın ay ${strongestMonth.month}: ${strongestMonth.count} not.`
              : "Aylık durumu görmek için biraz daha not gerekiyor."}{" "}
            {topTag
              ? `En sık kullandığın etiket #${topTag.name}.`
              : "Notlarına etiket ekledikçe en çok kullandıkların burada görünecek."}
          </p>
        </blockquote>

        <div className="mt-8 grid border-y border-[var(--border)] sm:grid-cols-3 sm:divide-x sm:divide-[var(--border)]">
          <InsightCell
            label="Not Aldığın Aylar"
            value={`${activeMonths}/12 ay`}
            detail={
              recentMomentum?.label ?? "Birkaç ay daha not ekledikçe değişimi burada göreceksin."
            }
          />
          <InsightCell
            label="En Çok"
            value={
              topCategory
                ? `${getCategoryLabel(topCategory.name)} ${getShareLabel(topCategory.count, data.kpis.totalPosts)}`
                : "-"
            }
            detail={
              topCategory
                ? `${topCategory.count} notla en çok yazdığın kategori.`
                : "Henüz yeterli not yok."
            }
          />
          <InsightCell
            label="Puanlar"
            value={`%${ratedShare} puanlı`}
            detail={
              topStatus
                ? `En sık durum: ${topStatus.name.toLowerCase()}.`
                : "Puan verdikçe burada görünecek."
            }
          />
        </div>

        {sparseDataLabel && (
          <p className="mt-5 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg-inset-soft)] px-4 py-3 text-xs leading-5 text-[var(--text-secondary)]">
            {sparseDataLabel}
          </p>
        )}
      </Reveal>

      {/* LAYOUT: KPI strip — 4 hairline-divided cells, oversized serif-italic numbers */}
      <Reveal order={1} className="mb-10">
        <div className="grid grid-cols-2 overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--bg-card)] md:grid-cols-4">
          <KpiCell label="Toplam Not" value={data.kpis.totalPosts} accent />
          <KpiCell
            label="Ortalama Puan"
            value={data.kpis.avgRating > 0 ? data.kpis.avgRating : "—"}
          />
          <KpiCell label="Bu Yıl" value={data.kpis.postsThisYear} />
          <KpiCell label="Farklı Etiket" value={data.kpis.uniqueTags} />
        </div>
      </Reveal>

      {/* LAYOUT: highlight trio — label / bold value / muted detail, top accent tick */}
      <Reveal order={2} className="mb-10">
        <div className="grid gap-4 sm:grid-cols-3">
          <HighlightCell
            index="A"
            label="Öne Çıkan Kategori"
            value={topCategory ? getCategoryLabel(topCategory.name) : "-"}
            detail={topCategory ? `${topCategory.count} not` : "Henüz yeterli not yok"}
          />
          <HighlightCell
            index="B"
            label="En Yoğun Ay"
            value={strongestMonth?.month ?? "-"}
            detail={strongestMonth ? `${strongestMonth.count} not` : "Henüz yeterli not yok"}
          />
          <HighlightCell
            index="C"
            label="Puanlı Notlar"
            value={`%${ratedShare}`}
            detail={topStatus ? `En sık durum: ${topStatus.name}` : "Henüz durum seçilmemiş"}
          />
        </div>
      </Reveal>

      {/* ═══ Charts Grid ═══ */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Monthly Production */}
        <Reveal order={3}>
          <ChartCard index="01" title="Aylara Göre Notlar">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={data.monthlySeries}
                  margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
                >
                  <defs>
                    <linearGradient id="statsAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--gold)" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="var(--gold)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="month" tick={TICK_STYLE} axisLine={false} tickLine={false} />
                  <YAxis
                    allowDecimals={false}
                    tick={TICK_STYLE}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    cursor={{ stroke: "var(--border)", strokeDasharray: "4 4" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    name="Not"
                    stroke="var(--gold)"
                    fill="url(#statsAreaGrad)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{
                      r: 5,
                      fill: "var(--accent-2)",
                      stroke: "var(--bg-card)",
                      strokeWidth: 2,
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </Reveal>

        {/* Category Distribution */}
        <Reveal order={4}>
          <ChartCard index="02" title="Kategorilere Göre Notlar">
            <div className="flex h-72 items-center">
              <div className="relative w-1/2">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={data.categories}
                      dataKey="count"
                      nameKey="name"
                      innerRadius={60}
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
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="dn-display text-4xl italic leading-none text-[var(--text-primary)]">
                    {data.kpis.totalPosts}
                  </span>
                  <span className="dn-mono mt-1 text-[9.5px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                    Not
                  </span>
                </div>
              </div>
              <div className="flex-1 space-y-3 pl-4">
                {data.categories.slice(0, 5).map((item, index) => {
                  const pct =
                    data.kpis.totalPosts > 0
                      ? Math.round((item.count / data.kpis.totalPosts) * 100)
                      : 0;
                  return (
                    <div key={item.name} className="flex items-center gap-3">
                      <span
                        className="h-2 w-2 flex-shrink-0 rounded-full"
                        style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                      />
                      <span className="flex-1 truncate text-sm text-[var(--text-secondary)]">
                        {getCategoryLabel(item.name)}
                      </span>
                      <span className="text-sm font-semibold tabular-nums text-[var(--text-primary)]">
                        {item.count}
                      </span>
                      <span className="dn-mono w-9 text-right text-[10.5px] tabular-nums text-[var(--text-muted)]">
                        %{pct}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </ChartCard>
        </Reveal>

        {/* Rating Distribution */}
        <Reveal order={5}>
          <ChartCard index="03" title="Verdiğin Puanlar">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.ratingDistribution}
                  margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
                >
                  <CartesianGrid stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="label" tick={TICK_STYLE} axisLine={false} tickLine={false} />
                  <YAxis
                    allowDecimals={false}
                    tick={TICK_STYLE}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    cursor={{ fill: "rgb(var(--gold-rgb)/0.06)" }}
                  />
                  <Bar dataKey="count" name="Not" radius={[10, 10, 0, 0]} fill="var(--gold)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </Reveal>

        {/* Status & Tags */}
        <Reveal order={6}>
          <ChartCard index="04" title="Durumlar ve Etiketler">
            <div className="grid gap-8 sm:grid-cols-2">
              {/* Statuses */}
              <div>
                <p className={`${monoLabel} mb-4`}>Durumlar</p>
                <div className="space-y-4">
                  {data.statuses.map((item) => {
                    const pct =
                      data.kpis.totalPosts > 0
                        ? Math.round((item.count / data.kpis.totalPosts) * 100)
                        : 0;
                    return (
                      <div key={item.name}>
                        <div className="mb-1.5 flex items-baseline justify-between text-sm">
                          <span className="text-[var(--text-secondary)]">{item.name}</span>
                          <span className="font-semibold tabular-nums text-[var(--text-primary)]">
                            {item.count}
                          </span>
                        </div>
                        <div className="h-1 overflow-hidden rounded-full bg-[var(--bg-raised)]">
                          <div
                            className="h-full rounded-full bg-accent-2 transition-all duration-700 ease-out-expo"
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
                <p className={`${monoLabel} mb-4`}>En Çok Kullandıkların</p>
                {data.topTags.length === 0 ? (
                  <p className="text-xs leading-5 text-[var(--text-muted)]">
                    Henüz etiket yok. Notlarına etiket ekledikçe burada görünecek.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {data.topTags.map((tag) => (
                      <Link
                        key={tag.name}
                        href={`/tag/${tag.name}`}
                        className="flex cursor-pointer items-center gap-1.5 rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors duration-200 ease-out-expo hover:border-accent/40 hover:text-[var(--gold)]"
                      >
                        <HashIcon size={10} weight="bold" />
                        {tag.name}
                        <span className="dn-mono ml-0.5 text-[10px] tabular-nums text-[var(--text-muted)]">
                          {tag.count}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </ChartCard>
        </Reveal>
      </div>
    </main>
  );
}

/* ══════════════════════════════════════════════
   Sub-Components
   ══════════════════════════════════════════════ */

function InsightCell({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="border-b border-[var(--border)] py-5 last:border-b-0 sm:border-b-0 sm:px-6 sm:first:pl-0 sm:last:pr-0">
      <p className={monoLabel}>{label}</p>
      <p className="dn-display mt-2 text-3xl italic leading-none tracking-[-0.01em] text-[var(--text-primary)]">
        {value}
      </p>
      <p className="mt-2.5 text-xs leading-5 text-[var(--text-muted)]">{detail}</p>
    </div>
  );
}

function KpiCell({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div className="border-[var(--border)] p-5 sm:p-6 md:[&:not(:last-child)]:border-r [&:nth-child(-n+2)]:border-b md:[&:nth-child(-n+2)]:border-b-0 [&:nth-child(odd)]:border-r">
      <p className={monoLabel}>{label}</p>
      <p
        className={`dn-display mt-3 text-5xl italic tabular-nums leading-[0.9] tracking-[-0.02em] sm:text-6xl ${
          accent ? "text-[var(--gold)]" : "text-[var(--text-primary)]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function HighlightCell({
  index,
  label,
  value,
  detail,
}: {
  index: string;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[22px] border border-[var(--border)] bg-[var(--bg-card)] p-6 transition-colors duration-300 ease-out-expo hover:border-accent/30">
      <p className={monoLabel}>
        <span className="text-[var(--gold)]">({index})</span> {label}
      </p>
      <p className="mt-3 text-2xl font-bold tracking-[-0.03em] text-[var(--text-primary)]">
        {value}
      </p>
      <p className="mt-1 text-xs text-[var(--text-muted)]">{detail}</p>
    </div>
  );
}
