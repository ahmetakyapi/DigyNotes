"use client";

/*
  LAYOUT: "Wrapped"-style year in review — one tall editorial column (max-w-6xl).
  HERO: mono eyebrow · the year set enormous in serif italic with a lavender dot · mono year pills
        · intro sentence + back pill.
  CHAPTERS: full-width rows split by hairlines. Left rail = "Bölüm 0X" + kicker (sticky on md+),
            right = one big statement sentence (bold grotesk + serif-italic accent word) followed by
            the supporting number / chart / list.
  MOTION: hero animates on mount (re-keys per year); every chapter reveals on scroll (once),
          all disabled with reduced motion.
*/
import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
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
  Cell,
} from "recharts";
import { getCategoryLabel, normalizeFixedCategory } from "@/lib/categories";
import { getPostImageSrc } from "@/lib/post-image";
import {
  getActiveMonthCount,
  getShareLabel,
  getSparseDataLabel,
  getTopItem,
} from "@/lib/stats-insights";
import { ResilientImage } from "@/components/ResilientImage";
import { Em, Dot } from "@/components/ui/PageHeader";

/* ── Types ── */
interface YearData {
  year: number;
  isEmpty: boolean;
  totalPosts: number;
  avgRating: number;
  uniqueTagCount: number;
  maxStreak: number;
  busiestMonth: { month: string; count: number } | null;
  categories: { name: string; count: number }[];
  monthlySeries: { month: string; count: number }[];
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

/* Verb that completes "Bu yıl en çok <Kategori> ..." — null falls back to a neutral phrasing. */
const CATEGORY_VERBS: Record<string, string | null> = {
  movies: "izledin",
  series: "izledin",
  book: "okudun",
  game: "oynadın",
  travel: null,
  other: null,
};

const monoLabel = "dn-mono text-[10.5px] uppercase tracking-[0.16em] text-[var(--text-muted)]";
const statementClass =
  "max-w-4xl text-[clamp(2rem,5.2vw,4rem)] font-extrabold leading-[0.98] tracking-[-0.045em] text-[var(--text-primary)]";

/* ── Helpers ── */
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "long" });
}

/* ── Main Page ── */
export default function YearInReviewPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [data, setData] = useState<YearData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/users/me/year-in-review?year=${year}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((payload) => {
        setData(payload);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [year]);

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

  /* ── Empty ── */
  if (!data || data.isEmpty) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <YearHero year={year} onYearChange={setYear} max={currentYear}>
          <p className="max-w-xl text-[15px] leading-relaxed text-[var(--text-secondary)]">
            Bu yılın sayfaları henüz boş.
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
            Not eklemeye başladığında burada yıllık özetin görünecek. Farklı aylara yayılan notlar,
            puanlar ve etiketler yıl hikayesini daha anlamlı hale getirir.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {["Farklı Aylarda Not Ekle", "Puan ve Etiket Kullan", "Yıl İçi Ritmi Biriktir"].map(
              (tip) => (
                <span
                  key={tip}
                  className="dn-mono rounded-full border border-[var(--border)] px-3 py-1.5 text-[10.5px] uppercase tracking-[0.12em] text-[var(--text-muted)]"
                >
                  {tip}
                </span>
              )
            )}
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

  let chapterCount = 0;
  const nextChapter = () => String(++chapterCount).padStart(2, "0");

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      {/* ═══ Hero ═══ */}
      <YearHero year={year} onYearChange={setYear} max={currentYear}>
        <p className="max-w-xl text-[15px] leading-relaxed text-[var(--text-secondary)]">
          {favoriteCategory
            ? `${year} içinde arşivin en çok ${getCategoryLabel(favoriteCategory.name).toLowerCase()} etrafında yoğunlaşmış.`
            : `${year} yılına ait notların burada bir araya geliyor.`}{" "}
          {data.busiestMonth
            ? `${data.busiestMonth.month} ayı en hareketli dönem olmuş.`
            : "Yıl içi ritim için daha fazla aya yayılan veri gerekiyor."}
        </p>
      </YearHero>

      {/* ═══ Chapter: Hacim ═══ */}
      <Chapter
        index={nextChapter()}
        kicker="Hacim"
        statement={
          <>
            Bu yıl <Em>{data.totalPosts}</Em> not yazdın
            <Dot />
          </>
        }
      >
        <div className="grid grid-cols-2 border-y border-[var(--border)] md:grid-cols-4">
          <BigNumber label="Toplam Not" value={data.totalPosts} accent />
          <BigNumber label="Ort. Puan" value={data.avgRating > 0 ? data.avgRating : "—"} />
          <BigNumber label="Etiket" value={data.uniqueTagCount} />
          <BigNumber label="En Uzun Seri" value={data.maxStreak} unit="gün" />
        </div>
      </Chapter>

      {/* ═══ Chapter: Odak ═══ */}
      <Chapter
        index={nextChapter()}
        kicker="Yılın Odağı"
        statement={
          favoriteCategory ? (
            favoriteVerb ? (
              <>
                Bu yıl en çok <Em>{getCategoryLabel(favoriteCategory.name)}</Em> {favoriteVerb}
                <Dot />
              </>
            ) : (
              <>
                Bu yıl en çok <Em>{getCategoryLabel(favoriteCategory.name)}</Em> kategorisinde not
                tuttun
                <Dot />
              </>
            )
          ) : (
            <>
              Bu yılın odağı henüz <Em>belirsiz</Em>
              <Dot />
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
                ? `${getCategoryLabel(favoriteCategory.name)} · ${favoriteCategory.count} not ile yılın baskın teması olmuş.`
                : "Kategori yorumu için yeterli veri yok."}
            </p>
          </div>
          <ChartFrame label="Kategori Dağılımı">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.categories.map((c) => ({ ...c, label: getCategoryLabel(c.name) }))}
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
                  <Bar dataKey="count" name="Not" radius={[10, 10, 0, 0]}>
                    {data.categories.map((c, idx) => (
                      <Cell
                        key={c.name}
                        fill={idx === 0 ? "var(--gold)" : "var(--accent-2)"}
                        fillOpacity={idx === 0 ? 1 : 0.7}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartFrame>
        </div>
      </Chapter>

      {/* ═══ Chapter: Ritim ═══ */}
      <Chapter
        index={nextChapter()}
        kicker="Yılın Ritmi"
        statement={
          data.busiestMonth ? (
            <>
              En hareketli ayın <Em>{data.busiestMonth.month}</Em> oldu
              <Dot />
            </>
          ) : (
            <>
              Yılın ritmi henüz <Em>şekilleniyor</Em>
              <Dot />
            </>
          )
        }
      >
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:gap-12">
          <ChartFrame label="Aylık Aktivite">
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={data.monthlySeries}
                  margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
                >
                  <defs>
                    <linearGradient id="yirAreaGrad" x1="0" y1="0" x2="0" y2="1">
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
                    strokeWidth={2}
                    fill="url(#yirAreaGrad)"
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
          </ChartFrame>
          <div className="flex flex-col divide-y divide-[var(--border)] border-y border-[var(--border)]">
            <StatLine
              label="En Aktif Ay"
              value={data.busiestMonth ? `${data.busiestMonth.count} not` : "-"}
              detail={data.busiestMonth?.month}
            />
            <StatLine
              label="Aktif Ay"
              value={`${activeMonths}/12`}
              detail={
                data.maxStreak > 1
                  ? `En uzun seri ${data.maxStreak} gün sürmüş.`
                  : "Henüz seri davranışı belirginleşmemiş."
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
          index={nextChapter()}
          kicker="En Yüksek Puanlı Notlar"
          statement={
            <>
              Yılın <Em>en iyileri</Em>
              <Dot />
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
                    <p className="dn-mono mt-1 truncate text-[10.5px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
                      {getCategoryLabel(post.category)}
                      {post.creator ? ` · ${post.creator}` : ""}
                    </p>
                  </div>

                  {/* Rating */}
                  <div className="flex flex-shrink-0 items-center gap-1.5 rounded-full border border-accent-2/30 bg-accent-2/10 px-3 py-1">
                    <StarIcon size={12} weight="fill" className="text-[var(--accent-2)]" />
                    <span className="text-sm font-bold tabular-nums text-[var(--accent-2)]">
                      {post.rating}
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
        index={nextChapter()}
        kicker="Yılın İzi"
        statement={
          topTag ? (
            <>
              Yılın izi <Em>#{topTag.name}</Em> oldu
              <Dot />
            </>
          ) : (
            <>
              Notlarının <Em>%{ratedShare}</Em>&apos;i puanlandı
              <Dot />
            </>
          )
        }
      >
        <p className="max-w-xl text-[15px] leading-relaxed text-[var(--text-secondary)]">
          {topTag
            ? `${topTag.count} kullanım ile tekrar eden temayı gösteriyor.`
            : `Notlarının %${ratedShare}'i puanlanmış durumda.`}
        </p>
        {data.topTags.length > 0 && (
          <div className="mt-6">
            <p className={`${monoLabel} mb-3`}>En Çok Kullanılan Etiketler</p>
            <div className="flex flex-wrap gap-2">
              {data.topTags.map((tag, idx) => (
                <Link
                  key={tag.name}
                  href={`/tag/${tag.name}`}
                  className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-200 ease-out-expo ${
                    idx === 0
                      ? "border-accent/40 bg-accent/10 text-[var(--gold)] hover:border-accent"
                      : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-primary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <HashIcon size={12} weight="bold" />
                  {tag.name}
                  <span className="dn-mono ml-0.5 text-[10.5px] tabular-nums text-[var(--text-muted)]">
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
        index={nextChapter()}
        kicker="Puan Dağılımı"
        statement={
          data.avgRating > 0 ? (
            <>
              Ortalama puanın <Em>{data.avgRating}</Em> oldu
              <Dot />
            </>
          ) : (
            <>
              Bu yıl henüz <Em>puan</Em> vermedin
              <Dot />
            </>
          )
        }
      >
        <ChartFrame label={`%${ratedShare} puanlı`}>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.ratingDistribution}
                margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
              >
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="label" tick={TICK_STYLE} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={TICK_STYLE} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  cursor={{ fill: "rgb(var(--gold-rgb)/0.06)" }}
                />
                <Bar dataKey="count" name="Not" fill="var(--gold)" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartFrame>
      </Chapter>

      {/* ═══ Chapter: Başlangıç ve Son ═══ */}
      <Chapter
        index={nextChapter()}
        kicker="İlk ve Son"
        statement={
          <>
            Yıl <Em>{formatDate(data.firstPost.createdAt)}</Em> tarihinde başladı
            <Dot />
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
          Genel İstatistiklere Dön
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
        <p className="dn-mono flex items-center gap-2 text-[10.5px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
          <span className="text-[var(--gold)]">(14)</span>
          <span className="h-px w-5 bg-[var(--border)]" />
          Yıllık Özet
        </p>
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

      <h1 className="mt-6 overflow-hidden pb-[0.04em] pt-[0.1em]">
        <motion.span
          key={year}
          className="dn-display block text-[clamp(7rem,22vw,18rem)] italic leading-[0.8] tracking-[-0.05em] text-[var(--text-primary)]"
          initial={reduce ? false : { y: "100%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          transition={{ duration: 1.1, ease: EASE }}
        >
          {year}
          <span className="text-[var(--gold)]">.</span>
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

/* LAYOUT: chapter row — hairline on top, left rail (Bölüm 0X + kicker), right statement + body */
function Chapter({
  index,
  kicker,
  statement,
  children,
}: {
  index: string;
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
      <div className="md:sticky md:top-24 md:self-start">
        <p className="dn-mono text-[10.5px] uppercase tracking-[0.16em] text-[var(--gold)]">
          Bölüm {index}
        </p>
        <p className="dn-mono mt-1.5 text-[10.5px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
          {kicker}
        </p>
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
      <p className="dn-mono mt-2 text-[10.5px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
        {getCategoryLabel(post.category)} · {formatDate(post.createdAt)}
      </p>
    </Link>
  );
}
