"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

interface CounterProps {
  readonly value: number;
  readonly label: string;
  readonly suffix?: string;
  readonly color?: string;
  readonly delay?: number;
}

function Counter({ value, label, suffix = "+", color = "var(--gold)", delay = 0 }: CounterProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const timeout = setTimeout(() => {
      let start = 0;
      const end = value;
      const duration = 1200;
      const stepTime = Math.max(Math.floor(duration / end), 30);
      const timer = setInterval(() => {
        start += 1;
        setCount(start);
        if (start >= end) clearInterval(timer);
      }, stepTime);
      return () => clearInterval(timer);
    }, delay * 1000);
    return () => clearTimeout(timeout);
  }, [isInView, value, delay]);

  return (
    <motion.div
      ref={ref}
      className="flex flex-col items-center gap-1.5"
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.16, 0.8, 0.24, 1] }}
    >
      <span
        className="text-3xl font-black tabular-nums sm:text-4xl"
        style={{
          color,
          textShadow: `0 0 20px color-mix(in srgb, ${color} 30%, transparent)`,
        }}
      >
        {count}
        {suffix}
      </span>
      <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] sm:text-xs">
        {label}
      </span>
    </motion.div>
  );
}

export function StatsRow() {
  return (
    <motion.div
      className="mx-auto my-6 flex w-full max-w-lg items-center justify-around sm:my-10"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <Counter value={5} label="Kategori" suffix="" color="var(--gold)" delay={0} />
      <div className="h-8 w-px rounded-full bg-[var(--border)]" style={{ opacity: 0.5 }} />
      <Counter value={100} label="Limitsiz" suffix="%" color="#818cf8" delay={0.1} />
      <div className="h-8 w-px rounded-full bg-[var(--border)]" style={{ opacity: 0.5 }} />
      <Counter value={5} label="dk'da Başla" suffix="" color="#60a88a" delay={0.2} />
    </motion.div>
  );
}
