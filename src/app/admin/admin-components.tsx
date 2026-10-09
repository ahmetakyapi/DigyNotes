"use client";

import { CaretLeftIcon, CaretRightIcon, TrashIcon } from "@phosphor-icons/react";
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

/** Shared recharts axis tick style (mono, muted). */
export const AXIS_TICK = {
  fill: "var(--text-muted)",
  fontSize: 10,
} as const;

/* ─────────────────────────── sub-components ────────────────── */

/* LAYOUT: KPI strip — one hairline-bordered rounded frame; cells divided by 1px hairlines
   (gap-px over a var(--border) backdrop).
   Each cell: mono index + label on top, big serif-italic number below. */
export function KpiStrip({ children }: { readonly children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--border)] sm:grid-cols-3 lg:grid-cols-6">
      {children}
    </div>
  );
}

export function KpiCard({
  value,
  label,
  index,
  sub,
}: {
  readonly value: number;
  readonly label: string;
  readonly index?: string;
  readonly sub?: string;
}) {
  return (
    <div className="group relative bg-[var(--bg-card)] px-5 py-5 transition-colors duration-300 ease-out-expo hover:bg-[var(--bg-raised)]">
      <p className="dn-mono flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
        {index && <span className="text-[var(--gold)]">({index})</span>}
        {label}
      </p>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="dn-display text-[44px] italic tabular-nums leading-none tracking-[-0.02em] text-[var(--text-primary)]">
          {fmtNumber(value)}
        </span>
        {sub && <span className="text-sm text-[var(--text-muted)]">{sub}</span>}
      </div>
    </div>
  );
}

export function Card({
  title,
  index,
  children,
  action,
}: {
  readonly title: string;
  readonly index?: string;
  readonly children: React.ReactNode;
  readonly action?: React.ReactNode;
}) {
  return (
    <div className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-card)] p-5 transition-colors duration-300 ease-out-expo hover:border-[var(--text-faint)] sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          {index && (
            <p className="dn-mono text-[10.5px] uppercase tracking-[0.16em] text-[var(--gold)]">
              ({index})
            </p>
          )}
          <h3 className="mt-1 text-[15px] font-semibold tracking-[-0.01em] text-[var(--text-primary)]">
            {title}
          </h3>
        </div>
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
    <section className="rounded-[28px] border border-[var(--border)] bg-[var(--bg-card)] p-5 sm:p-6">
      <p className="dn-mono text-[10.5px] uppercase tracking-[0.16em] text-[var(--gold)]">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-xl font-bold tracking-[-0.02em] text-[var(--text-primary)] sm:text-2xl">
        {title}
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-secondary)]">{description}</p>
      <div className="mt-5 grid overflow-hidden rounded-[20px] border border-[var(--border)] sm:grid-cols-3">
        {cards.map((card, i) => (
          <div
            key={card.label}
            className={`px-4 py-4 ${i > 0 ? "border-t border-[var(--border)] sm:border-l sm:border-t-0" : ""}`}
          >
            <p className="dn-mono text-[10.5px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
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
          frame: "border-accent/25 bg-accent/5",
          dot: "bg-accent",
          tag: "text-accent",
          label: "Tamam",
        }
      : feedback.tone === "warning"
        ? {
            frame: "border-accent-2/30 bg-accent-2/5",
            dot: "bg-accent-2",
            tag: "text-accent-2",
            label: "Dikkat",
          }
        : {
            frame: "border-danger/30 bg-danger/5",
            dot: "bg-danger",
            tag: "text-danger",
            label: "Hata",
          };

  return (
    <div className={`rounded-[20px] border px-5 py-4 ${palette.frame}`}>
      <div className="flex items-center gap-2.5">
        <span className={`h-1.5 w-1.5 rounded-full ${palette.dot}`} />
        <span className={`dn-mono text-[10.5px] uppercase tracking-[0.16em] ${palette.tag}`}>
          {palette.label}
        </span>
        <p className="text-sm font-semibold text-[var(--text-primary)]">{feedback.title}</p>
      </div>
      <p className="mt-1.5 text-sm text-[var(--text-secondary)]">{feedback.detail}</p>
      {feedback.followUp && (
        <p className="mt-2 text-xs leading-5 text-[var(--text-muted)]">
          <span className="dn-mono uppercase tracking-[0.12em]">Sonraki Adım ·</span>{" "}
          {feedback.followUp}
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
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-3.5 py-2.5 text-xs shadow-[var(--shadow-soft)]">
      {label && (
        <p className="dn-mono mb-1.5 text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
          {label}
        </p>
      )}
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: p.color }} />
          <span className="text-[var(--text-secondary)]">{p.name}</span>
          <span className="dn-display ml-auto text-base italic tabular-nums leading-none text-[var(--text-primary)]">
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
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-[var(--border)] border-t-accent" />
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
    <div className="inline-flex flex-wrap items-center rounded-full border border-[var(--border)] bg-[var(--bg-card)] p-1">
      {(Object.entries(options) as [T, string][]).map(([k, label]) => (
        <button
          key={k}
          type="button"
          onClick={() => onChange(k)}
          className={`cursor-pointer rounded-full px-3.5 py-1.5 text-[11.5px] font-semibold transition-colors duration-200 ease-out-expo active:scale-95 ${
            value === k
              ? "bg-accent text-[var(--text-on-accent)]"
              : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function Pagination({
  page,
  totalPages,
  onPrev,
  onNext,
}: {
  readonly page: number;
  readonly totalPages: number;
  readonly onPrev: () => void;
  readonly onNext: () => void;
}) {
  if (totalPages <= 1) return null;
  const btn =
    "inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[var(--border)] px-3.5 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors duration-200 hover:border-[var(--text-muted)] hover:text-[var(--text-primary)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-30";
  return (
    <div className="flex items-center justify-between border-t border-[var(--border)] px-4 py-3 sm:px-5">
      <span className="dn-mono text-[10.5px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
        Sayfa <span className="text-[var(--text-primary)]">{page}</span> / {totalPages}
      </span>
      <div className="flex gap-2">
        <button type="button" onClick={onPrev} disabled={page === 1} className={btn}>
          <CaretLeftIcon size={12} weight="bold" />
          Önceki
        </button>
        <button type="button" onClick={onNext} disabled={page === totalPages} className={btn}>
          Sonraki
          <CaretRightIcon size={12} weight="bold" />
        </button>
      </div>
    </div>
  );
}

export function ConfirmModal({
  title,
  message,
  detail,
  onCancel,
  onConfirm,
  confirmLabel = "Evet, Sil",
}: {
  readonly title: string;
  readonly message: React.ReactNode;
  readonly detail: string;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
  readonly confirmLabel?: string;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-overlay)] px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-sm rounded-[24px] border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-[var(--shadow-deep)]">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-danger/30 text-danger">
            <TrashIcon size={16} weight="bold" />
          </span>
          <p className="dn-mono text-[10.5px] uppercase tracking-[0.16em] text-danger">
            Kalıcı İşlem
          </p>
        </div>
        <h3 className="mb-1.5 text-lg font-bold tracking-[-0.02em] text-[var(--text-primary)]">
          {title}
        </h3>
        <p className="mb-1 text-sm text-[var(--text-secondary)]">{message}</p>
        <p className="mb-6 text-xs text-[var(--text-muted)]">{detail}</p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="cursor-pointer rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors duration-200 hover:border-[var(--text-muted)] hover:text-[var(--text-primary)] active:scale-95"
          >
            İptal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="cursor-pointer rounded-full bg-danger px-4 py-2 text-sm font-semibold text-[var(--bg-base)] transition-all duration-200 hover:bg-danger/90 active:scale-95"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
