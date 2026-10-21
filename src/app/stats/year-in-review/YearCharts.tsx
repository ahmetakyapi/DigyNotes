"use client";

/*
  The three year-in-review charts (category bars, monthly area, rating bars). Split out of
  page.tsx and loaded with next/dynamic so recharts stays out of the page's first bundle.
  Each fills the fixed-height box the page gives it.
*/
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

export function CategoryChart({ categories }: { categories: { name: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={categories.map((c) => ({ ...c, label: getCategoryLabel(c.name) }))}
        margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
      >
        <CartesianGrid stroke="var(--border)" vertical={false} />
        <XAxis dataKey="label" tick={TICK_STYLE} axisLine={false} tickLine={false} />
        <YAxis allowDecimals={false} tick={TICK_STYLE} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgb(var(--gold-rgb)/0.06)" }} />
        <Bar dataKey="count" name="Not" radius={[10, 10, 0, 0]}>
          {categories.map((c, idx) => (
            <Cell
              key={c.name}
              fill={idx === 0 ? "var(--gold)" : "var(--accent-2)"}
              fillOpacity={idx === 0 ? 1 : 0.7}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function MonthlyChart({
  series,
}: {
  series: { month: string; monthLong?: string; count: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={series} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
        <defs>
          <linearGradient id="yirAreaGrad" x1="0" y1="0" x2="0" y2="1">
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
  );
}

export function RatingChart({
  distribution,
}: {
  distribution: { label: string; count: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={distribution} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
        <CartesianGrid stroke="var(--border)" vertical={false} />
        <XAxis dataKey="label" tick={TICK_STYLE} axisLine={false} tickLine={false} />
        <YAxis allowDecimals={false} tick={TICK_STYLE} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgb(var(--gold-rgb)/0.06)" }} />
        <Bar dataKey="count" name="Not" fill="var(--gold)" radius={[10, 10, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
