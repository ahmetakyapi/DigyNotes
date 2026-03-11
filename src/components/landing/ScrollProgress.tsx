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
          ? "linear-gradient(90deg, #c58f24, #e1c168, #6f91d8)"
          : "linear-gradient(90deg, var(--gold), #e0c068, #818cf8)",
        boxShadow: isLight
          ? "0 0 8px rgba(197,143,36,0.28), 0 0 20px rgba(111,145,216,0.12)"
          : "0 0 10px rgba(201,168,76,0.5), 0 0 30px rgba(201,168,76,0.2)",
      }}
    />
  );
}
