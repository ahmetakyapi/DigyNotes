"use client";

import { motion, useScroll, useSpring } from "framer-motion";
import { useTheme } from "@/components/ThemeProvider";

export function ScrollProgress() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      className="fixed left-0 right-0 top-0 z-[60] h-[2px] origin-left"
      style={{
        scaleX,
        background: isLight
          ? "linear-gradient(90deg, #059669, #34d399, #0ea5e9)"
          : "linear-gradient(90deg, var(--gold), #34d399, #0ea5e9)",
        boxShadow: isLight
          ? "0 0 8px rgba(5,150,105,0.28), 0 0 20px rgba(14,165,233,0.12)"
          : "0 0 10px rgba(16,185,129,0.5), 0 0 30px rgba(16,185,129,0.2)",
      }}
    />
  );
}
