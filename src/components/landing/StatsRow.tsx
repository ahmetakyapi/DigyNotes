"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useSpring } from "framer-motion";
import { useTheme } from "@/components/ThemeProvider";

/* ── Data ── */
const STATS = [
  {
    value: 6,
    label: "Kategori",
    suffix: "",
    color: "var(--gold)",
    glowColor: "rgba(16,185,129,0.35)",
  },
  { value: 5, label: "Yıldız", suffix: "★", color: "#0ea5e9", glowColor: "rgba(14,165,233,0.35)" },
  {
    value: 100,
    label: "Tamamen Ücretsiz",
    suffix: "%",
    color: "#f59e0b",
    glowColor: "rgba(245,158,11,0.35)",
  },
] as const;

/* ── Animated Counter ── */
function Counter({
  value,
  label,
  suffix = "",
  color = "var(--gold)",
  glowColor = "rgba(16,185,129,0.35)",
  delay = 0,
}: {
  readonly value: number;
  readonly label: string;
  readonly suffix?: string;
  readonly color?: string;
  readonly glowColor?: string;
  readonly delay?: number;
}) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [count, setCount] = useState(0);
  const [done, setDone] = useState(false);

  const punchScale = useSpring(1, { damping: 12, stiffness: 300 });

  useEffect(() => {
    if (!isInView) return;
    const timeout = setTimeout(() => {
      let start = 0;
      const end = value;
      const duration = 1400;
      const stepTime = Math.max(Math.floor(duration / end), 24);
      const timer = setInterval(() => {
        start += 1;
        setCount(start);
        if (start >= end) {
          clearInterval(timer);
          setDone(true);
          punchScale.set(1.18);
          setTimeout(() => punchScale.set(1), 200);
        }
      }, stepTime);
      return () => clearInterval(timer);
    }, delay * 1000);
    return () => clearTimeout(timeout);
  }, [isInView, value, delay, punchScale]);

  return (
    <motion.div
      ref={ref}
      className="group relative flex flex-col items-center gap-2"
      initial={{ opacity: 0, y: 30, scale: 0.85, filter: "blur(10px)" }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" } : {}}
      transition={{ duration: 0.7, delay, ease: [0.16, 0.8, 0.24, 1] }}
    >
      {/* Background glow pulse when done */}
      <motion.div
        className="pointer-events-none absolute -inset-4 rounded-full opacity-0"
        style={{ background: `radial-gradient(circle, ${glowColor}, transparent 70%)` }}
        animate={done ? { opacity: [0, 0.5, 0] } : {}}
        transition={{ duration: 1.2, ease: "easeOut" }}
      />

      <motion.span
        className="relative text-3xl font-black tabular-nums sm:text-5xl"
        style={{
          color,
          scale: punchScale,
          textShadow: isLight
            ? `0 6px 18px ${glowColor.replace("0.35", "0.16")}, 0 1px 0 rgba(255,255,255,0.38)`
            : `0 0 24px ${glowColor}, 0 0 48px ${glowColor.replace("0.35", "0.15")}`,
        }}
      >
        {count}
        {suffix}
      </motion.span>

      <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--text-muted)] sm:text-xs">
        {label}
      </span>
    </motion.div>
  );
}

/* ── Animated Divider ── */
function AnimatedDivider({ delay = 0 }: { readonly delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      className="mx-4 h-12 w-px sm:mx-8 sm:h-14"
      initial={{ scaleY: 0, opacity: 0 }}
      animate={isInView ? { scaleY: 1, opacity: 1 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.16, 0.8, 0.24, 1] }}
    >
      <div
        className="h-full w-full rounded-full"
        style={{
          background: "linear-gradient(to bottom, transparent, var(--border), transparent)",
        }}
      />
    </motion.div>
  );
}

/* ── Main Component ── */
export function StatsRow() {
  return (
    <motion.div
      className="relative mx-auto my-6 flex w-full max-w-lg items-center justify-center px-4 sm:my-12 sm:max-w-xl sm:px-0"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
    >
      {STATS.map((stat, i) => (
        <div key={stat.label} className="flex items-center">
          {i > 0 && <AnimatedDivider delay={i * 0.12} />}
          <Counter {...stat} delay={i * 0.15} />
        </div>
      ))}
    </motion.div>
  );
}
