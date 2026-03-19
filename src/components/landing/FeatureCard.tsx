"use client";

import { motion } from "framer-motion";
import { useCardTilt } from "@/hooks/useCardTilt";
import { EASE } from "@/lib/variants";

interface FeatureCardProps {
  readonly Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  readonly title: string;
  readonly desc: string;
  readonly iconColor: string;
  readonly iconBg: string;
  readonly iconBorder: string;
  readonly index: number;
}

export function FeatureCard({
  Icon,
  title,
  desc,
  iconColor,
  iconBg,
  iconBorder,
  index,
}: FeatureCardProps) {
  const { ref, rx, ry, shine, onMove, onLeave } = useCardTilt(5);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay: index * 0.08, ease: EASE }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}
      className="glass group relative h-full overflow-hidden rounded-2xl p-6 transition-shadow hover:shadow-xl sm:p-7"
    >
      {/* Holographic shine */}
      <motion.div className="pointer-events-none absolute inset-0" style={{ background: shine }} />

      {/* Top accent line */}
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${iconColor}50, transparent)`,
        }}
      />

      {/* Icon */}
      <div
        className="relative z-10 mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border sm:mb-5"
        style={{ background: iconBg, borderColor: iconBorder }}
      >
        <Icon className="h-5 w-5" style={{ color: iconColor }} />
      </div>

      <h3 className="relative z-10 mb-2 text-[15px] font-semibold text-[var(--text-primary)] sm:text-base">
        {title}
      </h3>
      <p className="relative z-10 text-[13px] leading-relaxed text-[var(--text-secondary)] sm:text-sm">
        {desc}
      </p>
    </motion.div>
  );
}
