"use client";

/* Fade/rise-in wrapper for the stats sections, shared by page.tsx and the lazily
   loaded StatsCharts. Disabled with reduced motion. */
import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

const EASE = [0.16, 1, 0.3, 1] as const;

export function Reveal({
  order,
  className = "",
  children,
}: {
  order: number;
  className?: string;
  children: ReactNode;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: EASE, delay: 0.15 + order * 0.08 }}
    >
      {children}
    </motion.div>
  );
}
