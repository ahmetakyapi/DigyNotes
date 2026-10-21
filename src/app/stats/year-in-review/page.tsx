"use client";

/*
  LAYOUT: "Wrapped"-style year in review — one tall editorial column (max-w-6xl).
  HERO: mono eyebrow · the year set enormous in serif italic with a lavender dot · mono year pills
        · intro sentence + back pill.
  CHAPTERS: full-width rows split by hairlines. Left rail = topic label (sticky, md+ only),
            right = one big statement sentence (bold grotesk + serif-italic accent word) followed by
            the supporting number / chart / list.
  MOTION: hero animates on mount (re-keys per year); every chapter reveals on scroll (once),
          all disabled with reduced motion.
*/
import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CalendarBlankIcon,
  FlagIcon,
  FlagCheckeredIcon,
  HashIcon,
  StarIcon,
} from "@phosphor-icons/react";
import { getCategoryLabel, normalizeFixedCategory } from "@/lib/categories";
import { getPostImageSrc } from "@/lib/post-image";
import {
  getActiveMonthCount,
  getShareLabel,
  getSparseDataLabel,
  getTopItem,
} from "@/lib/stats-insights";
import { ResilientImage } from "@/components/ResilientImage";
import { Em } from "@/components/ui/PageHeader";
import { formatRating } from "@/lib/number-format";

/* ── Types ── */
interface YearData {
  year: number;
  isEmpty: boolean;
  totalPosts: number;
  avgRating: number;
  uniqueTagCount: number;
  maxStreak: number;
  busiestMonth: { month: string; monthLong?: string; count: number } | null;
  categories: { name: string; count: number }[];
  monthlySeries: { month: string; monthLong?: string; count: number }[];
  topTags: { name: string; count: number }[];
  topRated: {
    id: string;
    title: string;
    category: string;
    rating: number;
    image: string;
    creator: string | null;
  }[];
  ratingDistribution: { label: string; count: number }[];
  firstPost: { id: string; title: string; category: string; createdAt: string };
  lastPost: { id: string; title: string; category: string; createdAt: string };
}

/* ── Constants ── */
const EASE = [0.16, 1, 0.3, 1] as const;

/* recharts is ~100 KB gzip: the charts load on their own (YearCharts), so the page hydrates
   and asks for its numbers without waiting for them (the effect below preloads the chunk).
   Each skeleton fills the fixed-height box the chart sits in, so nothing shifts. */
function ChartSkeleton() {
  return <div className="h-full w-full animate-pulse rounded-2xl bg-[var(--bg-raised)]" />;
}
const CategoryChart = dynamic(() => import("./YearCharts").then((m) => m.CategoryChart), {
  ssr: false,
  loading: ChartSkeleton,
});
const MonthlyChart = dynamic(() => import("./YearCharts").then((m) => m.MonthlyChart), {
  ssr: false,
  loading: ChartSkeleton,
});
const RatingChart = dynamic(() => import("./YearCharts").then((m) => m.RatingChart), {
  ssr: false,
  loading: ChartSkeleton,
});

/* Verb that completes "Bu yıl en çok <Kategori> ..." — null falls back to a neutral phrasing. */
const CATEGORY_VERBS: Record<string, string | null> = {
  movies: "izledin",
  series: "izledin",
  book: "okudun",
  game: "oynadın",
  travel: null,
  other: null,
};

const monoLabel = "text-[12.5px] text-[var(--text-muted)] font-medium";
const statementClass =
  "max-w-4xl text-[clamp(2rem,5.2vw,4rem)] font-extrabold leading-[0.98] tracking-[-0.03em] text-[var(--text-primary)]";

/* ── Helpers ── */
function formatDate(iso: string) {
  // Same calendar as the API's Istanbul year/month buckets, whatever the browser's zone.
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    timeZone: "Europe/Istanbul",
  });
}

/* ── Main Page ── */
export default function YearInReviewPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [data, setData] = useState<YearData | null>(null);
  const [loading, setLoading] = useState(true);
  // A failed request is not "no notes this year": it gets its own state with a retry.
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    // Start the chart chunk now, in parallel with the data request.
    void import("./YearCharts");
    setLoading(true);
    setFailed(false);
    fetch(`/api/users/me/year-in-review?year=${year}`)
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then((payload: YearData) => {
        if (!cancelled) setData(payload);
      })
      .catch(() => {
        if (!cancelled) {
          setData(null);
          setFailed(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      // A quick year switch must not let the older response land last.
      cancelled = true;
    };
  }, [year, reloadKey]);

  /* ── Loading ── */
  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-6 h-3 w-40 animate-pulse rounded-full bg-[var(--bg-card)]" />
        <div className="mb-8 h-[clamp(6rem,18vw,14rem)] w-[min(100%,36rem)] animate-pulse rounded-[28px] bg-[var(--bg-card)]" />
        <div className="mb-16 flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-9 w-16 animate-pulse rounded-full bg-[var(--bg-card)]" />
          ))}
        </div>
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="mb-6 h-64 animate-pulse rounded-[28px] border border-[var(--border)] bg-[var(--bg-card)]"
          />
        ))}
      </main>
    );
  }

  /* ── Error ── */
  if (failed) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <YearHero year={year} onYearChange={setYear} max={currentYear}>
          <p className="max-w-xl text-[15px] leading-relaxed text-[var(--text-secondary)]">
            Yılın özeti yüklenemedi. Biraz sonra tekrar dene.
          </p>
        </YearHero>

        <div className="mt-12 rounded-[28px] border border-[var(--border)] bg-[var(--bg-card)] px-6 py-16 text-center">
          <button
            type="button"
            onClick={() => setReloadKey((key) => key + 1)}
            className="inline-flex h-11 cursor-pointer items-center rounded-full border border-[var(--border)] px-5 text-sm font-medium text-[var(--text-secondary)] transition-colors duration-200 ease-out-expo hover:border-[var(--text-primary)] hover:text-[var(--text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)]"
          >
            Tekrar Dene
          </button>
        </div>
      </main>
    );
  }

  /* ── Empty ── */
  if (!data || data.isEmpty) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <YearHero year={year} onYearChange={setYear} max={currentYear}>
          <p className="max-w-xl text-[15px] leading-relaxed text-[var(--text-secondary)]">
            Bu yıl henüz not eklemedin.
          </p>
        </YearHero>

        <div className="mt-12 rounded-[28px] border border-dashed border-[var(--border)] bg-[var(--bg-card)] px-6 py-16 text-center sm:py-20">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-accent/25 bg-accent/10">
            <CalendarBlankIcon size={26} weight="duotone" className="text-[var(--gold)]" />
          </div>
          <h2 className="text-2xl font-bold tracking-[-0.03em] text-[var(--text-primary)]">
            {year} yılında henüz not eklenmemiş
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[var(--text-secondary)]">
            Not eklemeye başladığında yılın özeti burada görünecek. Ne kadar çok not, puan ve etiket
            eklersen özetin o kadar dolu olur.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {["Düzenli Not Ekle", "Puan Ver", "Etiket Kullan"].map((tip) => (
              <span
                key={tip}
                className="rounded-full border border-[var(--border)] px-3 py-1.5 text-[12.5px] font-medium text-[var(--text-muted)]"
              >
                {tip}
              </span>
            ))}
          </div>
        </div>
      </main>
    );
  }

  /* ── Derived data ── */
  const favoriteCategory = data.categories[0];
  const activeMonths = getActiveMonthCount(data.monthlySeries);
  const topTag = getTopItem(data.topTags);
  const ratedCount = data.ratingDistribution.reduce((sum, item) => sum + item.count, 0);
  const ratedShare = data.totalPosts > 0 ? Math.round((ratedCount / data.totalPosts) * 100) : 0;
  const sparseDataLabel = getSparseDataLabel(data.totalPosts, activeMonths);
  const favoriteKey = favoriteCategory
    ? (normalizeFixedCategory(favoriteCategory.name) ?? favoriteCategory.name)
    : null;
  const favoriteVerb = favoriteKey ? (CATEGORY_VERBS[favoriteKey] ?? null) : null;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      {/* ═══ Hero ═══ */}
      <YearHero year={year} onYearChange={setYear} max={currentYear}>
        <p className="max-w-xl text-[15px] leading-relaxed text-[var(--text-secondary)]">
          {favoriteCategory
            ? `${year} yılında en çok ${getCategoryLabel(favoriteCategory.name).toLocaleLowerCase("tr-TR")} notu almışsın.`
            : `${year} yılında aldığın notların özeti.`}{" "}
          {data.busiestMonth
            ? `En çok not aldığın ay ${data.busiestMonth.monthLong ?? data.busiestMonth.month}.`
            : "Aylara göre görmek için birkaç ay daha not eklemen gerekiyor."}
        </p>
      </YearHero>

      {/* ═══ Chapter: Hacim ═══ */}
      <Chapter
        kicker="Not Sayısı"
        statement={
          <>
            Bu yıl <Em>{data.totalPosts}</Em> not yazdın
          </>
        }
      >
        <div className="grid grid-cols-2 border-y border-[var(--border)] md:grid-cols-4">
          <BigNumber label="Toplam Not" value={data.totalPosts} accent />
          <BigNumber
            label="Ort. Puan"
            value={data.avgRating > 0 ? formatRating(data.avgRating) : "—"}
          />
          <BigNumber label="Etiket" value={data.uniqueTagCount} />
          <BigNumber label="En Uzun Seri" value={data.maxStreak} unit="gün" />
        </div>
      </Chapter>

      {/* ═══ Chapter: Odak ═══ */}
      <Chapter
        kicker="Kategoriler"
        statement={
          favoriteCategory ? (
            favoriteVerb ? (
              <>
                Bu yıl en çok <Em>{getCategoryLabel(favoriteCategory.name)}</Em> {favoriteVerb}
              </>
            ) : (
              <>
                Bu yıl en çok <Em>{getCategoryLabel(favoriteCategory.name)}</Em> kategorisinde not
                aldın
              </>
            )
          ) : (
            <>
              Bu yıl notların farklı kategorilere <Em>dağılmış</Em>
            </>
          )
        }
      >
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-12">
          <div>
            <p className={monoLabel}>En Çok Not Aldığın Kategori</p>
            <p className="dn-display mt-3 text-[clamp(3.5rem,9vw,6.5rem)] italic leading-[0.85] tracking-[-0.03em] text-[var(--gold)]">
              {favoriteCategory ? getShareLabel(favoriteCategory.count, data.totalPosts) : "-"}
            </p>
            <p className="mt-4 max-w-sm text-sm leading-6 text-[var(--text-secondary)]">
              {favoriteCategory
                ? `${getCategoryLabel(favoriteCategory.name)} · ${favoriteCategory.count} not. Bu yıl en çok bu kategoride not aldın.`
                : "Henüz yeterli not yok."}
            </p>
          </div>
          <ChartFrame label="Kategorilere Göre">
            <div className="h-56">
              <CategoryChart categories={data.categories} />
            </div>
          </ChartFrame>
        </div>
      </Chapter>

      {/* ═══ Chapter: Ritim ═══ */}
      <Chapter
        kicker="Aylar"
        statement={
          data.busiestMonth ? (
            <>
              En çok not aldığın ay{" "}
              <Em>{data.busiestMonth.monthLong ?? data.busiestMonth.month}</Em>
            </>
          ) : (
            <>
              Aylık tablo için biraz daha <Em>not</Em> gerekiyor
            </>
          )
        }
      >
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:gap-12">
          <ChartFrame label="Aylara Göre Notlar">
            <div className="h-60">
              <MonthlyChart series={data.monthlySeries} />
            </div>
          </ChartFrame>
          <div className="flex flex-col divide-y divide-[var(--border)] border-y border-[var(--border)]">
            <StatLine
              label="En Yoğun Ay"
              value={data.busiestMonth ? `${data.busiestMonth.count} not` : "-"}
              detail={data.busiestMonth?.monthLong ?? data.busiestMonth?.month}
            />
            <StatLine
              label="Not Aldığın Aylar"
              value={`${activeMonths}/12`}
              detail={
                data.maxStreak > 1
                  ? `En uzun serin ${data.maxStreak} gün.`
                  : "Henüz üst üste not aldığın bir seri yok."
              }
            />
          </div>
        </div>
        {sparseDataLabel && (
          <p className="mt-6 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg-inset-soft)] px-4 py-3 text-xs leading-5 text-[var(--text-secondary)]">
            {sparseDataLabel}
          </p>
        )}
      </Chapter>

      {/* ═══ Chapter: En İyiler ═══ */}
      {data.topRated.length > 0 && (
        <Chapter
          kicker="En Yüksek Puanlılar"
          statement={
            <>
              Yılın <Em>En İyileri</Em>
            </>
          }
        >
          <ol className="divide-y divide-[var(--border)] border-y border-[var(--border)]">
            {data.topRated.map((post, idx) => (
              <li key={post.id}>
                <Link
                  href={`/posts/${post.id}`}
                  className="group/item flex cursor-pointer items-center gap-4 py-4 transition-colors duration-200 ease-out-expo sm:gap-6"
                >
                  {/* Rank */}
                  <span
                    className={`dn-display w-10 flex-shrink-0 text-4xl italic leading-none sm:w-14 sm:text-5xl ${
                      idx === 0 ? "text-[var(--gold)]" : "text-[var(--text-faint)]"
                    }`}
                  >
                    {String(idx + 1).padStart(2, "0")}
                  </span>

                  {/* Poster */}
                  <div className="relative h-16 w-11 flex-shrink-0 overflow-hidden rounded-xl border border-[var(--border)]">
                    <ResilientImage
                      src={getPostImageSrc(post.image, post.category)}
                      alt={post.title}
                      fill
                      variant="tall"
                      className="object-cover transition-transform duration-500 ease-out-expo group-hover/item:scale-105"
                      sizes="44px"
                    />
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-lg font-semibold tracking-[-0.02em] text-[var(--text-primary)] transition-colors duration-200 group-hover/item:text-[var(--gold)] sm:text-xl">
                      {post.title}
                    </p>
                    <p className="mt-1 truncate text-[12.5px] font-medium text-[var(--text-muted)]">
                      {getCategoryLabel(post.category)}
                      {post.creator ? ` · ${post.creator}` : ""}
                    </p>
                  </div>

                  {/* Rating */}
                  <div className="flex flex-shrink-0 items-center gap-1.5 rounded-full border border-accent-2/30 bg-accent-2/10 px-3 py-1">
                    <StarIcon size={12} weight="fill" className="text-[var(--accent-2)]" />
                    <span className="text-sm font-bold tabular-nums text-[var(--accent-2)]">
                      {formatRating(post.rating)}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        </Chapter>
      )}

      {/* ═══ Chapter: İz ═══ */}
      <Chapter
        kicker="Etiketler"
        statement={
          topTag ? (
            <>
              En çok kullandığın etiket <Em>#{topTag.name}</Em>
            </>
          ) : (
            <>
              Notlarının <Em>%{ratedShare}</Em> kadarına puan verdin
            </>
          )
        }
      >
        <p className="max-w-xl text-[15px] leading-relaxed text-[var(--text-secondary)]">
          {topTag
            ? `Bu yıl ${topTag.count} notta kullandın.`
            : `Puan verdiğin notların oranı %${ratedShare}.`}
        </p>
        {data.topTags.length > 0 && (
          <div className="mt-6">
            <p className={`${monoLabel} mb-3`}>En Çok Kullanılan Etiketler</p>
            <div className="flex flex-wrap gap-2">
              {data.topTags.map((tag, idx) => (
                <Link
                  key={tag.name}
                  href={`/tag/${encodeURIComponent(tag.name)}`}
                  className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-200 ease-out-expo ${
                    idx === 0
                      ? "border-accent/40 bg-accent/10 text-[var(--gold)] hover:border-accent"
                      : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-primary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <HashIcon size={12} weight="bold" />
                  {tag.name}
                  <span className="dn-mono ml-0.5 text-[12.5px] tabular-nums text-[var(--text-muted)]">
                    ({tag.count})
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </Chapter>

      {/* ═══ Chapter: Puanlar ═══ */}
      <Chapter
        kicker="Puanlar"
        statement={
          data.avgRating > 0 ? (
            <>
              Ortalama puanın <Em>{formatRating(data.avgRating)}</Em> oldu
            </>
          ) : (
            <>
              Bu yıl henüz <Em>puan</Em> vermedin
            </>
          )
        }
      >
        <ChartFrame label={`%${ratedShare} puanlı`}>
          <div className="h-48">
            <RatingChart distribution={data.ratingDistribution} />
          </div>
        </ChartFrame>
      </Chapter>

      {/* ═══ Chapter: Başlangıç ve Son ═══ */}
      <Chapter
        kicker="İlk ve Son"
        statement={
          <>
            İlk notunu <Em>{formatDate(data.firstPost.createdAt)}</Em> tarihinde yazdın
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <TimelineCard
            icon={<FlagIcon size={16} weight="duotone" className="text-[var(--gold)]" />}
            label="İlk Not"
            post={data.firstPost}
          />
          <TimelineCard
            icon={
              <FlagCheckeredIcon size={16} weight="duotone" className="text-[var(--accent-2)]" />
            }
            label="Son Not"
            post={data.lastPost}
          />
        </div>
      </Chapter>

      {/* ═══ Back Link ═══ */}
      <div className="flex items-center justify-center border-t border-[var(--border)] pt-12">
        <Link
          href="/stats"
          className="group flex cursor-pointer items-center gap-2 rounded-full border border-[var(--border)] px-5 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition-colors duration-200 ease-out-expo hover:border-[var(--text-primary)] hover:text-[var(--text-primary)] active:scale-95"
        >
          <ArrowLeftIcon
            size={14}
            weight="bold"
            className="transition-transform duration-200 ease-out-expo group-hover:-translate-x-0.5"
          />
          İstatistiklere Dön
        </Link>
      </div>
    </main>
  );
}

/* ══════════════════════════════════════════════
   Sub-Components
   ══════════════════════════════════════════════ */

/* LAYOUT: hero — mono eyebrow + back pill, giant year, mono year pills, intro copy slot */
function YearHero({
  year,
  onYearChange,
  max,
  children,
}: {
  year: number;
  onYearChange: (y: number) => void;
  max: number;
  children: ReactNode;
}) {
  const reduce = useReducedMotion();
  return (
    <header className="pb-12 sm:pb-16">
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/stats"
          className="group inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[var(--border)] px-3.5 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors duration-200 ease-out-expo hover:border-[var(--text-primary)] hover:text-[var(--text-primary)] active:scale-95"
        >
          Tüm İstatistikler
          <ArrowRightIcon
            size={12}
            weight="bold"
            className="transition-transform duration-200 ease-out-expo group-hover:translate-x-0.5"
          />
        </Link>
      </div>

      {/* The size sits on the h1 too, so its em padding scales with the numerals: at
          leading 0.8 the italic digits rise ~0.11em above the line box, and the old
          0.1em of a 16px h1 (1.6px) cut their tops off. */}
      <h1 className="mt-6 overflow-hidden pb-[0.02em] pt-[0.15em] text-[clamp(7rem,22vw,18rem)] leading-[0.8]">
        <motion.span
          key={year}
          className="dn-display block text-[clamp(7rem,22vw,18rem)] italic leading-[0.8] tracking-[-0.035em] text-[var(--text-primary)]"
          initial={reduce ? false : { y: "100%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          transition={{ duration: 1.1, ease: EASE }}
        >
          {year}
        </motion.span>
      </h1>

      <motion.div
        className="mt-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between"
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: EASE, delay: 0.25 }}
      >
        {children}
        <YearSelector year={year} onChange={onYearChange} max={max} />
      </motion.div>
    </header>
  );
}

function YearSelector({
  year,
  onChange,
  max,
}: {
  year: number;
  onChange: (y: number) => void;
  max: number;
}) {
  const years = Array.from({ length: 5 }, (_, i) => max - i);
  return (
    <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Yıl Seç">
      {years.map((y) => (
        <button
          key={y}
          type="button"
          onClick={() => onChange(y)}
          aria-pressed={y === year}
          className={`dn-mono cursor-pointer rounded-full border px-3.5 py-2 text-[11px] tracking-[0.12em] transition-colors duration-200 ease-out-expo active:scale-95 ${
            y === year
              ? "border-accent bg-accent text-[var(--text-on-accent)]"
              : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--text-primary)] hover:text-[var(--text-primary)]"
          }`}
        >
          {y}
        </button>
      ))}
    </div>
  );
}

/* LAYOUT: chapter row — hairline on top, left rail (topic label, md+ only), right statement
   + body. No "Bölüm 0X" index and no label above the heading on phones: the statement
   carries the chapter (owner rule: no kickers, no (01) indexes). */
function Chapter({
  kicker,
  statement,
  children,
}: {
  kicker: string;
  statement: ReactNode;
  children: ReactNode;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.section
      className="grid gap-6 border-t border-[var(--border)] py-14 sm:py-20 md:grid-cols-[180px_minmax(0,1fr)] md:gap-10"
      initial={reduce ? false : { opacity: 0, y: 48 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.9, ease: EASE }}
    >
      <div className="hidden md:sticky md:top-24 md:block md:self-start">
        <p className="text-[12.5px] font-medium text-[var(--text-muted)]">{kicker}</p>
      </div>
      <div className="min-w-0">
        <h2 className={statementClass}>{statement}</h2>
        <div className="mt-10">{children}</div>
      </div>
    </motion.section>
  );
}

function ChartFrame({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-card)] p-5 sm:p-6">
      <p className={`${monoLabel} mb-5`}>{label}</p>
      {children}
    </div>
  );
}

function BigNumber({
  label,
  value,
  unit,
  accent = false,
}: {
  label: string;
  value: string | number;
  unit?: string;
  accent?: boolean;
}) {
  return (
    <div className="border-[var(--border)] py-6 pr-4 md:[&:not(:last-child)]:border-r [&:nth-child(-n+2)]:border-b md:[&:nth-child(-n+2)]:border-b-0 [&:nth-child(even)]:pl-4 md:[&:nth-child(n+2)]:pl-6 [&:nth-child(odd)]:border-r">
      <p className={monoLabel}>{label}</p>
      <p
        className={`dn-display mt-3 text-6xl italic tabular-nums leading-[0.85] tracking-[-0.03em] sm:text-7xl ${
          accent ? "text-[var(--gold)]" : "text-[var(--text-primary)]"
        }`}
      >
        {value}
        {unit && (
          <span className="dn-mono ml-2 align-baseline text-[11px] not-italic tracking-[0.12em] text-[var(--text-muted)]">
            {unit}
          </span>
        )}
      </p>
    </div>
  );
}

function StatLine({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="py-5">
      <p className={monoLabel}>{label}</p>
      <p className="dn-display mt-2 text-5xl italic leading-none tracking-[-0.02em] text-[var(--text-primary)]">
        {value}
      </p>
      {detail && <p className="mt-2 text-xs leading-5 text-[var(--text-muted)]">{detail}</p>}
    </div>
  );
}

function TimelineCard({
  icon,
  label,
  post,
}: {
  icon: ReactNode;
  label: string;
  post: { id: string; title: string; category: string; createdAt: string };
}) {
  return (
    <Link
      href={`/posts/${post.id}`}
      className="group/link block cursor-pointer rounded-[24px] border border-[var(--border)] bg-[var(--bg-card)] p-6 transition-colors duration-300 ease-out-expo hover:border-accent/40"
    >
      <div className="mb-4 flex items-center gap-2">
        {icon}
        <p className={monoLabel}>{label}</p>
      </div>
      <p className="text-xl font-semibold tracking-[-0.02em] text-[var(--text-primary)] transition-colors duration-200 group-hover/link:text-[var(--gold)]">
        {post.title}
      </p>
      <p className="mt-2 text-[12.5px] font-medium text-[var(--text-muted)]">
        {getCategoryLabel(post.category)} · {formatDate(post.createdAt)}
      </p>
    </Link>
  );
}
