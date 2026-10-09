"use client";

/*
  LAYOUT: Centered empty state inside a dashed hairline frame.
  TOP: illustration — three fanned "index cards" (outline) gently floating, the front one
       carrying the page icon and an accent dot.
  MIDDLE: Title Case headline with optional serif accent, one-line description.
  BOTTOM: up to two actions (primary pill + ghost link).
*/
import Link from "next/link";
import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

const EASE = [0.16, 1, 0.3, 1] as const;

type Action = { label: string; href?: string; onClick?: () => void };

function ActionButton({ action, primary }: { action: Action; primary: boolean }) {
  const cls = primary
    ? "inline-flex h-11 cursor-pointer items-center gap-2 rounded-full bg-[var(--gold)] px-5 text-sm font-semibold text-[var(--text-on-accent)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[var(--gold-light)] active:scale-95"
    : "inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border border-[var(--border)] px-5 text-sm font-medium text-[var(--text-secondary)] transition-colors duration-200 hover:border-[var(--text-muted)] hover:text-[var(--text-primary)] active:scale-95";
  if (action.href)
    return (
      <Link href={action.href} className={cls}>
        {action.label}
      </Link>
    );
  return (
    <button type="button" onClick={action.onClick} className={cls}>
      {action.label}
    </button>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  primary,
  secondary,
  compact = false,
  children,
}: {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  primary?: Action;
  secondary?: Action;
  compact?: boolean;
  children?: ReactNode;
}) {
  const reduce = useReducedMotion();
  const float = (d: number) =>
    reduce
      ? undefined
      : {
          y: [0, -6, 0],
          transition: { duration: 5, repeat: Infinity, ease: "easeInOut" as const, delay: d },
        };

  return (
    <motion.div
      className={`relative overflow-hidden rounded-[28px] border border-dashed border-[var(--border)] bg-[var(--bg-card)] px-6 text-center ${
        compact ? "py-10" : "py-14 sm:py-16"
      }`}
      initial={reduce ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: EASE }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(ellipse_at_top,rgb(var(--gold-rgb)/0.09),transparent_70%)]"
      />

      <div aria-hidden className="relative mx-auto mb-8 h-[112px] w-[150px]">
        <motion.div
          animate={float(0.4)}
          className="absolute left-0 top-4 h-[92px] w-[64px] -rotate-[12deg] rounded-xl border border-[var(--border)] bg-[var(--bg-raised)]"
        />
        <motion.div
          animate={float(0.8)}
          className="absolute right-0 top-4 h-[92px] w-[64px] rotate-[12deg] rounded-xl border border-[var(--border)] bg-[var(--bg-raised)]"
        />
        <motion.div
          animate={float(0)}
          className="absolute left-1/2 top-0 flex h-[104px] w-[72px] -translate-x-1/2 flex-col items-center justify-center gap-2 rounded-xl border border-[var(--text-faint)] bg-[var(--bg-card)] text-[var(--gold)]"
        >
          {icon}
          <span className="h-1 w-8 rounded-full bg-[var(--border)]" />
          <span className="h-1 w-5 rounded-full bg-[var(--border)]" />
          <span className="absolute -right-1.5 -top-1.5 h-3 w-3 rounded-full bg-[var(--gold)] ring-4 ring-[var(--bg-card)]" />
        </motion.div>
      </div>

      <h2 className="relative mx-auto max-w-[460px] text-2xl font-extrabold leading-tight tracking-[-0.035em] text-[var(--text-primary)] sm:text-[28px]">
        {title}
      </h2>
      {description && (
        <p className="relative mx-auto mt-3 max-w-[420px] text-sm leading-relaxed text-[var(--text-secondary)]">
          {description}
        </p>
      )}
      {children}
      {(primary || secondary) && (
        <div className="relative mt-7 flex flex-wrap items-center justify-center gap-3">
          {primary && <ActionButton action={primary} primary />}
          {secondary && <ActionButton action={secondary} primary={false} />}
        </div>
      )}
    </motion.div>
  );
}
