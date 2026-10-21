"use client";

/*
  LAYOUT: 2×2 chart grid in hairline cards (monthly area, category donut + legend,
  rating bars, statuses + top tags); lavender primary, apricot secondary.
  Split out of page.tsx and loaded with next/dynamic so recharts stays out of the
  page's first bundle.
*/
import Link from "next/link";
import type { ReactNode } from "react";
import { HashIcon } from "@phosphor-icons/react";
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
import { getCategoryLabel } from "@/lib/categories";
import { Reveal } from "./Reveal";

export interface StatsData {
  kpis: {
    totalPosts: number;
    avgRating: number;
    postsThisYear: number;
    uniqueTags: number;
  };
  monthlySeries: { month: string; monthLong?: string; count: number }[];
  categories: { name: string; count: number }[];
  statuses: { name: string; count: number }[];
  topTags: { name: string; count: number }[];
  ratingDistribution: { label: string; count: number }[];
}

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

/* Readable axis labels (owner rule): sans, 12px, muted — not tiny mono. */
const TICK_STYLE = {
  fontSize: 12,
  fill: "var(--text-muted)",
  fontFamily: "var(--font-sans), ui-sans-serif, system-ui, sans-serif",
};

const monoLabel = "text-[12.5px] text-[var(--text-muted)] font-medium";

function ChartCard({
  title,
  aside,
  children,
}: {
  title: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="h-full rounded-[24px] border border-[var(--border)] bg-[var(--bg-card)] p-6 transition-colors duration-300 ease-out-expo hover:border-accent/30 sm:p-7">
      <div className="mb-6 flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

export default function StatsCharts({ data }: { data: StatsData }) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {/* Monthly Production */}
      <Reveal order={2}>
        <ChartCard title="Aylara Göre Notlar">
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
                <YAxis allowDecimals={false} tick={TICK_STYLE} axisLine={false} tickLine={false} />
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
      <Reveal order={3}>
        <ChartCard title="Kategorilere Göre Notlar">
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
                <span className="mt-1 text-[12px] font-medium text-[var(--text-muted)]">Not</span>
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
                    <span className="dn-mono w-9 text-right text-[12.5px] tabular-nums text-[var(--text-muted)]">
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
      <Reveal order={4}>
        <ChartCard title="Verdiğin Puanlar">
          <div className="h-72">
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
                <Bar dataKey="count" name="Not" radius={[10, 10, 0, 0]} fill="var(--gold)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </Reveal>

      {/* Status & Tags */}
      <Reveal order={5}>
        <ChartCard title="Durumlar ve Etiketler">
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
                      href={`/tag/${encodeURIComponent(tag.name)}`}
                      className="flex cursor-pointer items-center gap-1.5 rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors duration-200 ease-out-expo hover:border-accent/40 hover:text-[var(--gold)]"
                    >
                      <HashIcon size={10} weight="bold" />
                      {tag.name}
                      <span className="dn-mono ml-0.5 text-[12px] tabular-nums text-[var(--text-muted)]">
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
  );
}
