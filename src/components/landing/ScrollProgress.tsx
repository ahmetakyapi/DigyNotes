"use client";

import { motion, useScroll, useSpring } from "framer-motion";

export function ScrollProgress() {
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
        background: "linear-gradient(90deg, var(--gold), #e0c068, #818cf8)",
        boxShadow: "0 0 10px rgba(201,168,76,0.5), 0 0 30px rgba(201,168,76,0.2)",
      }}
    />
  );
}
