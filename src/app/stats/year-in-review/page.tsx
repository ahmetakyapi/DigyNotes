"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  CalendarBlank,
  ChartBar,
  Crown,
  Fire,
  Hash,
  Sparkle,
  Star,
  TrendUp,
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

const customLoader = ({ src }: { src: string }) => src;

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

const CATEGORY_COLORS: Record<string, string> = {
  movies: "#6888c0",
  series: "#c8b090",
  game: "#818cf8",
  book: "#c4a24b",
  travel: "#60a88a",
  other: "#9aaacd",
};

function KpiCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
      <div className="mb-3 flex items-center gap-2">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ background: `${accent ?? "var(--gold)"}1a` }}
        >
          {icon}
        </div>
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">
          {label}
        </span>
      </div>
      <p className="text-2xl font-black text-[var(--text-primary)]">{value}</p>
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
  });
}

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

  // Loading state
  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]"
            />
          ))}
        </div>
      </main>
    );
  }

  // Empty state
  if (!data || data.isEmpty) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Yılın Özeti</h1>
          <YearSelector year={year} onChange={setYear} max={currentYear} />
        </div>
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg-card)] px-6 py-20 text-center">
          <div className="bg-[var(--gold)]/10 mx-auto flex h-16 w-16 items-center justify-center rounded-2xl text-[var(--gold)]">
            <CalendarBlank size={28} weight="duotone" />
          </div>
          <h2 className="mt-5 text-lg font-semibold text-[var(--text-primary)]">
            {year} yılında henüz not eklenmemiş
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-[var(--text-secondary)]">
            Not eklemeye başladığında burada yıllık özetin görünecek.
          </p>
        </div>
      </main>
    );
  }

  const favoriteCategory = data.categories[0];
  const favoriteCatColor = CATEGORY_COLORS[favoriteCategory?.name] ?? "var(--gold)";

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-[var(--gold)]">
            Yıllık Özet
          </p>
          <h1 className="text-3xl font-black text-[var(--text-primary)]">{year}</h1>
        </div>
        <YearSelector year={year} onChange={setYear} max={currentYear} />
      </div>

      {/* KPI Grid */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <KpiCard
          icon={<ChartBar size={16} weight="duotone" className="text-[var(--gold)]" />}
          label="Toplam Not"
          value={data.totalPosts}
        />
        <KpiCard
          icon={<Star size={16} weight="fill" className="text-[var(--gold)]" />}
          label="Ort. Puan"
          value={data.avgRating > 0 ? data.avgRating : "—"}
        />
        <KpiCard
          icon={<Hash size={16} weight="duotone" className="text-[#818cf8]" />}
          label="Etiket"
          value={data.uniqueTagCount}
          accent="#818cf8"
        />
        <KpiCard
          icon={<Fire size={16} weight="duotone" className="text-[#fb923c]" />}
          label="En Uzun Seri"
          value={`${data.maxStreak} gün`}
          accent="#fb923c"
        />
      </div>

      {/* Highlight Cards */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 sm:gap-4">
        {/* Favori Kategori */}
        {favoriteCategory && (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">
              En Çok Not Aldığın Kategori
            </p>
            <div className="mt-3 flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ background: `${favoriteCatColor}1a` }}
              >
                <Crown size={18} weight="duotone" style={{ color: favoriteCatColor }} />
              </div>
              <div>
                <p className="text-lg font-bold text-[var(--text-primary)]">
                  {getCategoryLabel(favoriteCategory.name)}
                </p>
                <p className="text-xs text-[var(--text-muted)]">{favoriteCategory.count} not</p>
              </div>
            </div>
          </div>
        )}

        {/* En Aktif Ay */}
        {data.busiestMonth && (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">
              En Aktif Ay
            </p>
            <div className="mt-3 flex items-center gap-3">
              <div className="bg-[var(--gold)]/10 flex h-10 w-10 items-center justify-center rounded-xl">
                <TrendUp size={18} weight="duotone" className="text-[var(--gold)]" />
              </div>
              <div>
                <p className="text-lg font-bold text-[var(--text-primary)]">
                  {data.busiestMonth.month}
                </p>
                <p className="text-xs text-[var(--text-muted)]">{data.busiestMonth.count} not</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Aylık Grafik */}
      <div className="mb-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
        <h2 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">Aylık Aktivite</h2>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data.monthlySeries}
              margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
            >
              <defs>
                <linearGradient id="yirGold" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#c4a24b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#c4a24b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
              <Tooltip
                contentStyle={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
                labelStyle={{ color: "var(--text-primary)" }}
              />
              <Area
                type="monotone"
                dataKey="count"
                name="Not"
                stroke="#c4a24b"
                strokeWidth={2}
                fill="url(#yirGold)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Kategori Dağılımı */}
      <div className="mb-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
        <h2 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">Kategori Dağılımı</h2>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data.categories.map((c) => ({
                ...c,
                label: getCategoryLabel(c.name),
              }))}
              margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
              <Tooltip
                contentStyle={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
                labelStyle={{ color: "var(--text-primary)" }}
              />
              <Bar dataKey="count" name="Not" radius={[6, 6, 0, 0]}>
                {data.categories.map((c, idx) => (
                  <Cell key={idx} fill={CATEGORY_COLORS[c.name] ?? "#c4a24b"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* En İyi Puanlı Notlar */}
      {data.topRated.length > 0 && (
        <div className="mb-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
            <Sparkle size={14} weight="fill" className="text-[var(--gold)]" />
            En Yüksek Puanlı Notlar
          </h2>
          <div className="space-y-2.5">
            {data.topRated.map((post, idx) => (
              <Link
                key={post.id}
                href={`/posts/${post.id}`}
                className="flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 transition-colors hover:border-[var(--border)] hover:bg-[var(--bg-raised)]"
              >
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-[var(--bg-raised)] text-xs font-bold text-[var(--text-muted)]">
                  {idx + 1}
                </span>
                <div className="relative h-10 w-7 flex-shrink-0 overflow-hidden rounded-md border border-[var(--border)]">
                  <Image
                    loader={customLoader}
                    src={getPostImageSrc(post.image)}
                    alt={post.title}
                    fill
                    className="object-cover"
                    sizes="28px"
                    unoptimized
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                    {post.title}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {getCategoryLabel(post.category)}
                    {post.creator ? ` · ${post.creator}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-[var(--gold)]">
                  <Star size={12} weight="fill" />
                  <span className="text-sm font-bold">{post.rating}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* En Çok Kullanılan Etiketler */}
      {data.topTags.length > 0 && (
        <div className="mb-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
          <h2 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">
            En Çok Kullanılan Etiketler
          </h2>
          <div className="flex flex-wrap gap-2">
            {data.topTags.map((tag) => (
              <Link
                key={tag.name}
                href={`/tag/${tag.name}`}
                className="hover:border-[var(--gold)]/30 flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-raised)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--gold)]"
              >
                <Hash size={10} weight="bold" />
                {tag.name}
                <span className="ml-0.5 text-[var(--text-muted)]">({tag.count})</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* İlk & Son Not */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 sm:gap-4">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">
            İlk Not
          </p>
          <Link href={`/posts/${data.firstPost.id}`} className="group block">
            <p className="text-sm font-medium text-[var(--text-primary)] transition-colors group-hover:text-[var(--gold)]">
              {data.firstPost.title}
            </p>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">
              {getCategoryLabel(data.firstPost.category)} · {formatDate(data.firstPost.createdAt)}
            </p>
          </Link>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">
            Son Not
          </p>
          <Link href={`/posts/${data.lastPost.id}`} className="group block">
            <p className="text-sm font-medium text-[var(--text-primary)] transition-colors group-hover:text-[var(--gold)]">
              {data.lastPost.title}
            </p>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">
              {getCategoryLabel(data.lastPost.category)} · {formatDate(data.lastPost.createdAt)}
            </p>
          </Link>
        </div>
      </div>

      {/* Puan Dağılımı */}
      <div className="mb-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
        <h2 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">Puan Dağılımı</h2>
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data.ratingDistribution}
              margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
              <Bar dataKey="count" name="Not" fill="#c4a24b" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Link back to stats */}
      <div className="flex items-center justify-center gap-4 py-4">
        <Link
          href="/stats"
          className="hover:border-[var(--gold)]/30 rounded-lg border border-[var(--border)] px-5 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--gold)]"
        >
          Genel İstatistiklere Dön
        </Link>
      </div>
    </main>
  );
}

/* ── Year Selector ── */
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
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            y === year
              ? "bg-[var(--gold)]/15 text-[var(--gold)]"
              : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          }`}
        >
          {y}
        </button>
      ))}
    </div>
  );
}
