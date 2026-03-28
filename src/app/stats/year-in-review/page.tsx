"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarBlank,
  ChartBar,
  Crown,
  Fire,
  Hash,
  Sparkle,
  Star,
  TrendUp,
  Timer,
  Crosshair,
  Lightning,
  Flag,
  FlagCheckered,
  ArrowLeft,
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
import { getCategoryLabel } from "@/lib/categories";
import { getPostImageSrc } from "@/lib/post-image";
import {
  getActiveMonthCount,
  getShareLabel,
  getSparseDataLabel,
  getTopItem,
} from "@/lib/stats-insights";
import { ResilientImage } from "@/components/ResilientImage";

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
const CATEGORY_COLORS: Record<string, string> = {
  movies: "#6888c0",
  series: "#c8b090",
  game: "#34d399",
  book: "#10b981",
  travel: "#60a88a",
  other: "#9aaacd",
};

const TOOLTIP_STYLE = {
  background: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: 14,
  color: "var(--text-primary)",
  fontSize: 12,
  boxShadow: "0 12px 32px rgba(0,0,0,0.4)",
};

const RANK_STYLES = [
  "bg-[rgba(200,176,144,0.15)] text-[#c8b090] border-[rgba(200,176,144,0.3)]",
  "bg-[rgba(148,168,200,0.12)] text-[#94a8c8] border-[rgba(148,168,200,0.25)]",
  "bg-[rgba(200,140,100,0.12)] text-[#c88c64] border-[rgba(200,140,100,0.25)]",
];

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
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="mb-8 flex items-center justify-between">
          <div className="h-12 w-48 animate-pulse rounded-xl bg-[var(--bg-card)]" />
          <div className="h-10 w-64 animate-pulse rounded-xl bg-[var(--bg-card)]" />
        </div>
        <div className="mb-6 h-72 animate-pulse rounded-[28px] border border-[var(--border)] bg-[var(--bg-card)]" />
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]" />
          ))}
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]" />
          ))}
        </div>
      </main>
    );
  }

  /* ── Empty ── */
  if (!data || data.isEmpty) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--gold)]">
              Yıllık Özet
            </p>
            <h1 className="text-3xl font-black text-[var(--text-primary)]">{year}</h1>
          </div>
          <YearSelector year={year} onChange={setYear} max={currentYear} />
        </div>
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg-card)] px-6 py-20 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(16,185,129,0.1)]">
            <CalendarBlank size={26} weight="duotone" className="text-[var(--gold)]" />
          </div>
          <h2 className="text-lg font-bold text-[var(--text-primary)]">
            {year} yılında henüz not eklenmemiş
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--text-secondary)]">
            Not eklemeye başladığında burada yıllık özetin görünecek. Farklı aylara yayılan notlar,
            puanlar ve etiketler yıl hikayesini daha anlamlı hale getirir.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {["Farklı aylarda not ekle", "Puan ve etiket kullan", "Yıl içi ritmi biriktir"].map(
              (tip) => (
                <span
                  key={tip}
                  className="rounded-lg border border-[var(--border)] bg-[var(--bg-raised)] px-3 py-1.5 text-xs text-[var(--text-muted)]"
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
  const favoriteCatColor = CATEGORY_COLORS[favoriteCategory?.name] ?? "var(--gold)";
  const activeMonths = getActiveMonthCount(data.monthlySeries);
  const topTag = getTopItem(data.topTags);
  const ratedCount = data.ratingDistribution.reduce((sum, item) => sum + item.count, 0);
  const ratedShare = data.totalPosts > 0 ? Math.round((ratedCount / data.totalPosts) * 100) : 0;
  const sparseDataLabel = getSparseDataLabel(data.totalPosts, activeMonths);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      {/* ═══ Header ═══ */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--gold)]">
            Yıllık Özet
          </p>
          <h1 className="text-4xl font-black tracking-tight text-[var(--text-primary)]">{year}</h1>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-[var(--text-secondary)]">
            {favoriteCategory
              ? `${year} içinde arşivin en çok ${getCategoryLabel(favoriteCategory.name).toLowerCase()} etrafında yoğunlaşmış.`
              : `${year} yılına ait notların burada bir araya geliyor.`}{" "}
            {data.busiestMonth
              ? `${data.busiestMonth.month} ayı en hareketli dönem olmuş.`
              : "Yıl içi ritim için daha fazla aya yayılan veri gerekiyor."}
          </p>
        </div>
        <YearSelector year={year} onChange={setYear} max={currentYear} />
      </div>

      {/* ═══ Hero Insight ═══ */}
      <section className="relative mb-8 overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--bg-card)] shadow-[var(--shadow-soft)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_15%_25%,rgba(16,185,129,0.1),transparent_55%),radial-gradient(ellipse_50%_40%_at_85%_75%,rgba(14,165,233,0.07),transparent_45%)]" />

        <div className="relative grid gap-3 p-6 sm:grid-cols-3 sm:p-8">
          <InsightMiniCard
            icon={<Crosshair size={14} weight="bold" className="text-[#c8b090]" />}
            label="Yılın Odağı"
            value={
              favoriteCategory
                ? `${getCategoryLabel(favoriteCategory.name)} ${getShareLabel(favoriteCategory.count, data.totalPosts)}`
                : "-"
            }
            detail={
              favoriteCategory
                ? `${favoriteCategory.count} not ile yılın baskın teması olmuş.`
                : "Kategori yorumu için yeterli veri yok."
            }
          />
          <InsightMiniCard
            icon={<Timer size={14} weight="bold" className="text-[#34d399]" />}
            label="Yılın Ritmi"
            value={`${activeMonths}/12 ay aktif`}
            detail={
              data.maxStreak > 1
                ? `En uzun seri ${data.maxStreak} gün sürmüş.`
                : "Henüz seri davranışı belirginleşmemiş."
            }
          />
          <InsightMiniCard
            icon={<Lightning size={14} weight="bold" className="text-[#6888c0]" />}
            label="Yılın İzi"
            value={topTag ? `#${topTag.name}` : `%${ratedShare} puanlı`}
            detail={
              topTag
                ? `${topTag.count} kullanım ile tekrar eden temayı gösteriyor.`
                : `Notlarının %${ratedShare}'i puanlanmış durumda.`
            }
          />
        </div>

        {sparseDataLabel && (
          <div className="mx-6 mb-6 rounded-xl border border-dashed border-[var(--border)] bg-[rgba(0,0,0,0.15)] px-4 py-3 text-xs leading-5 text-[var(--text-muted)] sm:mx-8">
            {sparseDataLabel}
          </div>
        )}
      </section>

      {/* ═══ KPI Grid ═══ */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard
          icon={<ChartBar size={16} weight="duotone" />}
          accent="#10b981"
          label="Toplam Not"
          value={data.totalPosts}
        />
        <KpiCard
          icon={<Star size={16} weight="fill" />}
          accent="#c8b090"
          label="Ort. Puan"
          value={data.avgRating > 0 ? data.avgRating : "—"}
        />
        <KpiCard
          icon={<Hash size={16} weight="duotone" />}
          accent="#34d399"
          label="Etiket"
          value={data.uniqueTagCount}
        />
        <KpiCard
          icon={<Fire size={16} weight="duotone" />}
          accent="#fb923c"
          label="En Uzun Seri"
          value={`${data.maxStreak} gün`}
        />
      </div>

      {/* ═══ Highlight Cards ═══ */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        {favoriteCategory && (
          <HighlightCard
            icon={<Crown size={20} weight="duotone" style={{ color: favoriteCatColor }} />}
            accent={favoriteCatColor}
            label="En Çok Not Aldığın Kategori"
            value={getCategoryLabel(favoriteCategory.name)}
            detail={`${favoriteCategory.count} not`}
          />
        )}
        {data.busiestMonth && (
          <HighlightCard
            icon={<TrendUp size={20} weight="duotone" className="text-[var(--gold)]" />}
            accent="var(--gold)"
            label="En Aktif Ay"
            value={data.busiestMonth.month}
            detail={`${data.busiestMonth.count} not`}
          />
        )}
      </div>

      {/* ═══ Charts ═══ */}
      <div className="mb-8 grid gap-5 lg:grid-cols-2">
        {/* Monthly Activity */}
        <div className="group rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 transition-all duration-300 hover:border-[color-mix(in_srgb,var(--gold)_25%,transparent)]">
          <div className="mb-5 flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[rgba(16,185,129,0.1)]">
              <TrendUp size={14} weight="bold" className="text-[#10b981]" />
            </div>
            <h2 className="text-sm font-semibold tracking-wide text-[var(--text-primary)]">
              Aylık Aktivite
            </h2>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.monthlySeries} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="yirAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ stroke: "var(--border)", strokeDasharray: "4 4" }} />
                <Area
                  type="monotone"
                  dataKey="count"
                  name="Not"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fill="url(#yirAreaGrad)"
                  dot={false}
                  activeDot={{ r: 5, fill: "#10b981", stroke: "var(--bg-card)", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="group rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 transition-all duration-300 hover:border-[color-mix(in_srgb,var(--gold)_25%,transparent)]">
          <div className="mb-5 flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[rgba(104,136,192,0.12)]">
              <Crosshair size={14} weight="bold" className="text-[#6888c0]" />
            </div>
            <h2 className="text-sm font-semibold tracking-wide text-[var(--text-primary)]">
              Kategori Dağılımı
            </h2>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.categories.map((c) => ({ ...c, label: getCategoryLabel(c.name) }))}
                margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(16,185,129,0.06)" }} />
                <Bar dataKey="count" name="Not" radius={[8, 8, 0, 0]}>
                  {data.categories.map((c, idx) => (
                    <Cell key={idx} fill={CATEGORY_COLORS[c.name] ?? "#10b981"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ═══ Top Rated Posts ═══ */}
      {data.topRated.length > 0 && (
        <section className="mb-8 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 transition-all duration-300 hover:border-[color-mix(in_srgb,var(--gold)_25%,transparent)]">
          <div className="mb-5 flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[rgba(200,176,144,0.12)]">
              <Sparkle size={14} weight="fill" className="text-[#c8b090]" />
            </div>
            <h2 className="text-sm font-semibold tracking-wide text-[var(--text-primary)]">
              En Yüksek Puanlı Notlar
            </h2>
          </div>
          <div className="space-y-1">
            {data.topRated.map((post, idx) => (
              <Link
                key={post.id}
                href={`/posts/${post.id}`}
                className="group/item flex items-center gap-3 rounded-xl px-3 py-3 transition-all duration-200 hover:bg-[var(--bg-raised)]"
              >
                {/* Rank badge */}
                <span
                  className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border text-xs font-bold ${
                    idx < 3 ? RANK_STYLES[idx] : "border-[var(--border)] bg-[var(--bg-raised)] text-[var(--text-muted)]"
                  }`}
                >
                  {idx + 1}
                </span>

                {/* Poster */}
                <div className="relative h-11 w-8 flex-shrink-0 overflow-hidden rounded-lg border border-[var(--border)]">
                  <ResilientImage
                    src={getPostImageSrc(post.image, post.category)}
                    alt={post.title}
                    fill
                    variant="tall"
                    className="object-cover"
                    sizes="32px"
                  />
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--text-primary)] transition-colors duration-200 group-hover/item:text-[var(--gold)]">
                    {post.title}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                    {getCategoryLabel(post.category)}
                    {post.creator ? ` · ${post.creator}` : ""}
                  </p>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-1.5 rounded-lg bg-[rgba(200,176,144,0.1)] px-2.5 py-1">
                  <Star size={12} weight="fill" className="text-[#c8b090]" />
                  <span className="text-sm font-bold tabular-nums text-[#c8b090]">{post.rating}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ═══ Tags ═══ */}
      {data.topTags.length > 0 && (
        <section className="mb-8 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 transition-all duration-300 hover:border-[color-mix(in_srgb,var(--gold)_25%,transparent)]">
          <div className="mb-5 flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[rgba(52,211,153,0.1)]">
              <Hash size={14} weight="bold" className="text-[#34d399]" />
            </div>
            <h2 className="text-sm font-semibold tracking-wide text-[var(--text-primary)]">
              En Çok Kullanılan Etiketler
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.topTags.map((tag) => (
              <Link
                key={tag.name}
                href={`/tag/${tag.name}`}
                className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-raised)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-all duration-200 hover:border-[color-mix(in_srgb,var(--gold)_30%,transparent)] hover:text-[var(--gold)]"
              >
                <Hash size={10} weight="bold" />
                {tag.name}
                <span className="ml-0.5 tabular-nums text-[var(--text-muted)]">({tag.count})</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ═══ First & Last Post ═══ */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <TimelineCard
          icon={<Flag size={16} weight="duotone" className="text-[#34d399]" />}
          accent="#34d399"
          label="İlk Not"
          post={data.firstPost}
        />
        <TimelineCard
          icon={<FlagCheckered size={16} weight="duotone" className="text-[#6888c0]" />}
          accent="#6888c0"
          label="Son Not"
          post={data.lastPost}
        />
      </div>

      {/* ═══ Rating Distribution ═══ */}
      <section className="mb-8 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 transition-all duration-300 hover:border-[color-mix(in_srgb,var(--gold)_25%,transparent)]">
        <div className="mb-5 flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[rgba(200,176,144,0.1)]">
            <Star size={14} weight="fill" className="text-[#c8b090]" />
          </div>
          <h2 className="text-sm font-semibold tracking-wide text-[var(--text-primary)]">
            Puan Dağılımı
          </h2>
        </div>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.ratingDistribution} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(16,185,129,0.06)" }} />
              <Bar dataKey="count" name="Not" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* ═══ Back Link ═══ */}
      <div className="flex items-center justify-center py-4">
        <Link
          href="/stats"
          className="group flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-5 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition-all duration-200 hover:border-[color-mix(in_srgb,var(--gold)_30%,transparent)] hover:text-[var(--gold)]"
        >
          <ArrowLeft
            size={14}
            weight="bold"
            className="transition-transform duration-200 group-hover:-translate-x-0.5"
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
    <div className="flex items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-1">
      {years.map((y) => (
        <button
          key={y}
          onClick={() => onChange(y)}
          className={`cursor-pointer rounded-lg px-3.5 py-2 text-xs font-semibold transition-all duration-200 ${
            y === year
              ? "bg-[var(--gold)] text-white shadow-[0_2px_8px_rgba(16,185,129,0.3)]"
              : "text-[var(--text-muted)] hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)]"
          }`}
        >
          {y}
        </button>
      ))}
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
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">
          {label}
        </span>
      </div>
      <p className="text-2xl font-black tabular-nums text-[var(--text-primary)]">{value}</p>
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
      <div
        className="absolute left-0 right-0 top-0 h-[2px] opacity-60 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }}
      />
      <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--text-muted)]">
        {label}
      </p>
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ background: `${accent}18` }}
        >
          {icon}
        </div>
        <div>
          <p className="text-lg font-bold text-[var(--text-primary)]">{value}</p>
          <p className="text-xs text-[var(--text-muted)]">{detail}</p>
        </div>
      </div>
    </div>
  );
}

function TimelineCard({
  icon,
  accent,
  label,
  post,
}: {
  icon: React.ReactNode;
  accent: string;
  label: string;
  post: { id: string; title: string; category: string; createdAt: string };
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 transition-all duration-300 hover:border-[color-mix(in_srgb,var(--gold)_25%,transparent)]">
      <div
        className="absolute left-0 right-0 top-0 h-[2px] opacity-50 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }}
      />
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--text-muted)]">
          {label}
        </p>
      </div>
      <Link href={`/posts/${post.id}`} className="group/link block">
        <p className="text-sm font-medium text-[var(--text-primary)] transition-colors duration-200 group-hover/link:text-[var(--gold)]">
          {post.title}
        </p>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          {getCategoryLabel(post.category)} · {formatDate(post.createdAt)}
        </p>
      </Link>
    </div>
  );
}
