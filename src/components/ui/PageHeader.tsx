"use client";

/*
  LAYOUT: Editorial page masthead shared by every app screen.
  ROW 1: mono eyebrow "(03) — Akış" · optional right-aligned action slot.
  ROW 2: oversized grotesk title (serif-italic accent word allowed) · big serif stats on md+.
  ROW 3: short description, then a hairline that draws itself left → right.
*/
import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

const EASE = [0.16, 1, 0.3, 1] as const;

export type HeaderStatItem = { value: ReactNode; label: string };

export function PageHeader({
  index,
  eyebrow,
  title,
  description,
  stats,
  actions,
  className = "",
}: {
  index?: string;
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  stats?: HeaderStatItem[];
  actions?: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const visibleStats = (stats ?? []).filter((s) => s.value !== 0 && s.value !== "0" && s.value != null);
  return (
    <header className={`mb-8 sm:mb-10 ${className}`}>
      <div className="flex items-center justify-between gap-4">
        <motion.p
          className="dn-mono flex items-center gap-2 text-[10.5px] uppercase tracking-[0.16em] text-[var(--text-muted)]"
          initial={reduce ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          {index && <span className="text-[var(--gold)]">({index})</span>}
          <span className="h-px w-5 bg-[var(--border)]" />
          {eyebrow}
        </motion.p>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>

      <div className="mt-4 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <h1 className="max-w-[760px] overflow-hidden pb-[0.06em] pt-[0.12em] text-[clamp(2.4rem,6vw,4.4rem)] font-extrabold leading-[0.92] tracking-[-0.05em] text-[var(--text-primary)]">
          <motion.span
            className="block"
            initial={reduce ? false : { y: "105%" }}
            animate={{ y: "0%" }}
            transition={{ duration: 1, ease: EASE, delay: 0.05 }}
          >
            {title}
          </motion.span>
        </h1>

        {visibleStats.length > 0 && (
          <motion.dl
            className="flex items-end gap-6 sm:gap-8"
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.2 }}
          >
            {visibleStats.map((s) => (
              <div key={s.label} className="flex flex-col">
                <dd className="dn-display text-[38px] italic leading-none tracking-[-0.02em] text-[var(--text-primary)] sm:text-5xl">
                  {s.value}
                </dd>
                <dt className="dn-mono order-last mt-1 text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
                  {s.label}
                </dt>
              </div>
            ))}
          </motion.dl>
        )}
      </div>

      {description && (
        <motion.p
          className="mt-4 max-w-[560px] text-[15px] leading-relaxed text-[var(--text-secondary)]"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.25 }}
        >
          {description}
        </motion.p>
      )}

      <motion.div
        className="mt-6 h-px w-full origin-left bg-[var(--border)]"
        initial={reduce ? false : { scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1.2, ease: EASE, delay: 0.15 }}
      />
    </header>
  );
}

/** Serif-italic accent word for headline titles. */
export function Em({ children }: { children: ReactNode }) {
  return <span className="dn-display font-normal italic tracking-[-0.02em]">{children}</span>;
}

/** Accent full stop that ends DigyNotes headlines. */
export function Dot() {
  return <span className="text-[var(--gold)]">.</span>;
}
