"use client";

import { EASE } from "@/lib/variants";

import { useRef } from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";

export function SectionDivider({ color = "rgba(16,185,129,0.3)" }: { readonly color?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-20px" });
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const glowOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [0, 0.8, 0]);

  return (
    <div ref={ref} className="relative py-2 sm:py-4">
      <motion.div
        className="mx-auto h-px w-0"
        animate={isInView ? { width: "66%" } : {}}
        transition={{ duration: 1.2, ease: EASE }}
        style={{
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
        }}
      />
      {/* Center glow dot */}
      <motion.div
        className="pointer-events-none absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 70%)`,
          opacity: glowOpacity,
          filter: "blur(12px)",
        }}
      />
    </div>
  );
}
