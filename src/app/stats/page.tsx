"use client";

/*
  LAYOUT: Personal stats — editorial, single column (max-w-6xl).
  ROW 1: shared PageHeader (14) with headline stats + "Yılın Özeti" pill.
  ROW 2: pull-quote — accent left rule, large statement, three hairline insights.
  ROW 3: KPI strip — four cells divided by hairlines, enormous serif-italic numbers.
  ROW 4: 2×2 chart grid in hairline cards; lavender primary, apricot secondary.
  (A third row of category / month / rated-share cards repeated the insights word for
  word and was dropped; so was the "(i) Kısaca" kicker above the statement.)
  MOTION: sections fade/rise in sequence (motion), disabled with reduced motion.
*/
import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { ArrowRightIcon, ChartBarIcon, CalendarBlankIcon } from "@phosphor-icons/react";
import { getCategoryLabel } from "@/lib/categories";
import {
  getActiveMonthCount,
  getRecentMomentum,
  getShareLabel,
  getSparseDataLabel,
  getTopItem,
} from "@/lib/stats-insights";
import { PageHeader, Em } from "@/components/ui/PageHeader";
import { formatRating } from "@/lib/number-format";
import { Reveal } from "./Reveal";
import type { StatsData } from "./StatsCharts";

/* recharts is ~100 KB gzip: the chart grid loads on its own, so the page hydrates and
   asks for its numbers without waiting for it (the effect below preloads the chunk). */
const StatsCharts = dynamic(() => import("./StatsCharts"), {
  ssr: false,
  loading: () => (
    <div className="grid gap-5 lg:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-80 animate-pulse rounded-[24px] border border-[var(--border)] bg-[var(--bg-card)]"
        />
      ))}
    </div>
  ),
});

/* ── Constants ── */
const monoLabel = "text-[12.5px] text-[var(--text-muted)] font-medium";

function StatsHeader({ data }: { data?: StatsData }) {
  return (
    <PageHeader
      index="14"
      eyebrow="İstatistikler"
      title={
        <>
          Rakamlarla <Em>Notların</Em>
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
    // Start the chart chunk now, in parallel with the data request.
    void import("./StatsCharts");
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
          <p className="max-w-4xl text-[clamp(1.6rem,3.6vw,2.75rem)] font-bold leading-[1.08] tracking-[-0.035em] text-[var(--text-primary)] [text-wrap:balance]">
            {topCategory ? (
              <>
                En çok <Em>{getCategoryLabel(topCategory.name).toLocaleLowerCase("tr-TR")}</Em>{" "}
                kategorisinde not tutuyorsun
              </>
            ) : (
              <>
                Notların farklı kategorilere <Em>dağılmış</Em>
              </>
            )}
          </p>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[var(--text-secondary)]">
            {strongestMonth
              ? `En çok not aldığın ay ${strongestMonth.monthLong ?? strongestMonth.month}: ${strongestMonth.count} not.`
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
                ? `En sık durum: ${topStatus.name.toLocaleLowerCase("tr-TR")}.`
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
            value={data.kpis.avgRating > 0 ? formatRating(data.kpis.avgRating) : "—"}
          />
          <KpiCell label="Bu Yıl" value={data.kpis.postsThisYear} />
          <KpiCell label="Farklı Etiket" value={data.kpis.uniqueTags} />
        </div>
      </Reveal>

      {/* ═══ Charts Grid ═══ (recharts loads lazily, see StatsCharts) */}
      <StatsCharts data={data} />
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
