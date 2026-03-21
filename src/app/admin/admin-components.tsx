"use client";

import type { AdminFeedback } from "./admin-types";

/* ─────────────────────────── helpers ───────────────────────── */

export function fmtShortDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

export function fmtTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("tr-TR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function fmtNumber(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

/* ─────────────────────────── sub-components ────────────────── */

export function KpiCard({
  value,
  label,
  color,
  icon,
  sub,
}: {
  readonly value: number;
  readonly label: string;
  readonly color: string;
  readonly icon: React.ReactNode;
  readonly sub?: string;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border p-5 transition-all duration-200 hover:border-opacity-60"
      style={{ background: `${color}08`, borderColor: `${color}20` }}
    >
      <div
        className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-10 blur-2xl"
        style={{ background: color }}
      />
      <div className="relative">
        <div
          className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl border"
          style={{ background: `${color}15`, borderColor: `${color}25`, color }}
        >
          {icon}
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-[28px] font-black leading-none text-[var(--text-primary)]">
            {fmtNumber(value)}
          </span>
          {sub && <span className="text-sm text-[var(--text-muted)]">{sub}</span>}
        </div>
        <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
          {label}
        </p>
      </div>
    </div>
  );
}

export function Card({
  title,
  children,
  action,
}: {
  readonly title: string;
  readonly children: React.ReactNode;
  readonly action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-[13px] font-semibold text-[var(--text-primary)]">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

export function WorkspaceGuide({
  eyebrow,
  title,
  description,
  cards,
}: {
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly cards: readonly { label: string; text: string }[];
}) {
  return (
    <section className="rounded-[28px] border border-[var(--border)] bg-[linear-gradient(180deg,rgba(18,26,45,0.9),rgba(10,16,30,0.76))] p-5 shadow-[var(--shadow-soft)] sm:p-6">
      <span className="bg-[#10b981]/8 inline-flex rounded-full border border-[#10b981]/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#10b981]">
        {eyebrow}
      </span>
      <h2 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-[var(--text-primary)] sm:text-[28px]">
        {title}
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-secondary)]">{description}</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-[var(--border)] bg-[rgba(7,12,22,0.42)] px-4 py-4"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-faint)]">
              {card.label}
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{card.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ActionFeedbackBanner({ feedback }: { readonly feedback: AdminFeedback }) {
  const palette =
    feedback.tone === "success"
      ? {
          border: "border-[#34d399]/20",
          bg: "bg-[#34d399]/10",
          title: "text-[#34d399]",
        }
      : feedback.tone === "warning"
        ? {
            border: "border-[#fb923c]/20",
            bg: "bg-[#fb923c]/10",
            title: "text-[#fb923c]",
          }
        : {
            border: "border-[#e53e3e]/20",
            bg: "bg-[#e53e3e]/10",
            title: "text-[#e53e3e]",
          };

  return (
    <div className={`rounded-2xl border px-4 py-3 ${palette.border} ${palette.bg}`}>
      <p className={`text-sm font-semibold ${palette.title}`}>{feedback.title}</p>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">{feedback.detail}</p>
      {feedback.followUp && (
        <p className="mt-2 text-xs leading-5 text-[var(--text-muted)]">
          Sonraki adım: {feedback.followUp}
        </p>
      )}
    </div>
  );
}

export const DarkTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-base)] px-3.5 py-2.5 text-xs shadow-2xl">
      {label && <p className="mb-1.5 text-[var(--text-muted)]">{label}</p>}
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: p.color }} />
          <span className="text-[var(--text-secondary)]">{p.name}:</span>
          <span className="font-bold" style={{ color: p.color }}>
            {p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export function Spinner() {
  return (
    <div className="flex h-40 items-center justify-center">
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-[var(--border)] border-t-[#10b981]" />
    </div>
  );
}

export function RangePills<T extends string>({
  value,
  options,
  onChange,
}: {
  readonly value: T;
  readonly options: Record<T, string>;
  readonly onChange: (v: T) => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-1">
      {(Object.entries(options) as [T, string][]).map(([k, label]) => (
        <button
          key={k}
          onClick={() => onChange(k)}
          className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-colors duration-150 ${
            value === k
              ? "bg-[#10b981] text-[var(--text-on-accent)]"
              : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
