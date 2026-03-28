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
    <div className="group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 transition-all duration-300 hover:border-[color-mix(in_srgb,var(--gold)_25%,transparent)]">
      {/* Accent line at top */}
      <div
        className="absolute left-0 right-0 top-0 h-[2px] opacity-50 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: `linear-gradient(90deg, ${color}, transparent 70%)` }}
      />
      {/* Soft glow */}
      <div
        className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-[0.07] blur-2xl transition-opacity duration-300 group-hover:opacity-[0.12]"
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
          <span className="text-[28px] font-black tabular-nums leading-none text-[var(--text-primary)]">
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
  icon,
  accent,
  children,
  action,
}: {
  readonly title: string;
  readonly icon?: React.ReactNode;
  readonly accent?: string;
  readonly children: React.ReactNode;
  readonly action?: React.ReactNode;
}) {
  return (
    <div className="group rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 transition-all duration-300 hover:border-[color-mix(in_srgb,var(--gold)_20%,transparent)]">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {icon && (
            <div
              className="flex h-7 w-7 items-center justify-center rounded-lg"
              style={{ background: `${accent ?? "var(--gold)"}18` }}
            >
              {icon}
            </div>
          )}
          <h3 className="text-[13px] font-semibold text-[var(--text-primary)]">{title}</h3>
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
    <section className="relative overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-[var(--shadow-soft)] sm:p-6">
      {/* Decorative gradient mesh */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_10%_20%,rgba(16,185,129,0.08),transparent_50%),radial-gradient(ellipse_40%_40%_at_90%_80%,rgba(14,165,233,0.05),transparent_40%)]" />

      <div className="relative">
        <span className="inline-flex rounded-full border border-[#10b981]/20 bg-[#10b981]/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#10b981]">
          {eyebrow}
        </span>
        <h2 className="mt-4 text-xl font-bold tracking-[-0.02em] text-[var(--text-primary)] sm:text-2xl">
          {title}
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-secondary)]">
          {description}
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {cards.map((card) => (
            <div
              key={card.label}
              className="rounded-2xl border border-[var(--border)] bg-[rgba(7,12,22,0.42)] px-4 py-4 backdrop-blur-sm transition-all duration-300 hover:border-[color-mix(in_srgb,var(--gold)_15%,transparent)]"
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-faint)]">
                {card.label}
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{card.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ActionFeedbackBanner({ feedback }: { readonly feedback: AdminFeedback }) {
  const palette =
    feedback.tone === "success"
      ? {
          border: "border-[#34d399]/20",
          bg: "bg-[#34d399]/8",
          title: "text-[#34d399]",
          dot: "#34d399",
        }
      : feedback.tone === "warning"
        ? {
            border: "border-[#fb923c]/20",
            bg: "bg-[#fb923c]/8",
            title: "text-[#fb923c]",
            dot: "#fb923c",
          }
        : {
            border: "border-[#e53e3e]/20",
            bg: "bg-[#e53e3e]/8",
            title: "text-[#e53e3e]",
            dot: "#e53e3e",
          };

  return (
    <div className={`rounded-2xl border px-4 py-3 ${palette.border} ${palette.bg}`}>
      <div className="flex items-center gap-2">
        <span
          className="h-2 w-2 rounded-full"
          style={{ background: palette.dot }}
        />
        <p className={`text-sm font-semibold ${palette.title}`}>{feedback.title}</p>
      </div>
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
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-base)] px-3.5 py-2.5 text-xs shadow-[0_12px_32px_rgba(0,0,0,0.4)]">
      {label && <p className="mb-1.5 text-[var(--text-muted)]">{label}</p>}
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: p.color }} />
          <span className="text-[var(--text-secondary)]">{p.name}:</span>
          <span className="font-bold tabular-nums" style={{ color: p.color }}>
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
          className={`cursor-pointer rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all duration-200 ${
            value === k
              ? "bg-[var(--gold)] text-white shadow-[0_2px_8px_rgba(16,185,129,0.3)]"
              : "text-[var(--text-muted)] hover:bg-[var(--bg-raised)] hover:text-[var(--text-secondary)]"
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
  return (
    <div className="flex items-center justify-between border-t border-[var(--border)] px-4 py-3">
      <span className="text-xs tabular-nums text-[var(--text-muted)]">
        Sayfa {page} / {totalPages}
      </span>
      <div className="flex gap-2">
        <button
          onClick={onPrev}
          disabled={page === 1}
          className="cursor-pointer rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-muted)] transition-all duration-200 hover:border-[color-mix(in_srgb,var(--gold)_30%,transparent)] hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-25"
        >
          ← Önceki
        </button>
        <button
          onClick={onNext}
          disabled={page === totalPages}
          className="cursor-pointer rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-muted)] transition-all duration-200 hover:border-[color-mix(in_srgb,var(--gold)_30%,transparent)] hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-25"
        >
          Sonraki →
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-[0_24px_48px_rgba(0,0,0,0.5)]">
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-[#e53e3e]/20 bg-[#e53e3e]/10">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#e53e3e"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </div>
        <h3 className="mb-1 text-base font-bold text-[var(--text-primary)]">{title}</h3>
        <p className="mb-1 text-sm text-[var(--text-secondary)]">{message}</p>
        <p className="mb-5 text-xs text-[var(--text-muted)]">{detail}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="cursor-pointer rounded-lg px-4 py-2 text-sm text-[var(--text-muted)] transition-colors duration-200 hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)]"
          >
            İptal
          </button>
          <button
            onClick={onConfirm}
            className="cursor-pointer rounded-lg bg-[#e53e3e] px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-[#f05252] active:scale-95"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
