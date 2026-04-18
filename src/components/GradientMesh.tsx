"use client";

import { motion, useReducedMotion } from "framer-motion";

const ORB_CLASS =
  "absolute rounded-full blur-3xl will-change-transform pointer-events-none";

export function GradientMesh() {
  const reduceMotion = useReducedMotion();

  const duration = (base: number) => (reduceMotion ? 0 : base);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      style={{ transform: "translateZ(0)" }}
    >
      {/* Emerald — top-left */}
      <motion.div
        className={`${ORB_CLASS} left-[-10%] top-[-20%] h-[60vmin] w-[60vmin] opacity-[0.08]`}
        style={{
          background:
            "radial-gradient(closest-side, rgba(16,185,129,0.9), rgba(16,185,129,0) 70%)",
        }}
        animate={
          reduceMotion
            ? undefined
            : { x: [0, 40, -20, 0], y: [0, 30, -10, 0] }
        }
        transition={{
          duration: duration(28),
          repeat: reduceMotion ? 0 : Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Cyan — bottom-right */}
      <motion.div
        className={`${ORB_CLASS} right-[-15%] bottom-[-25%] h-[70vmin] w-[70vmin] opacity-[0.07]`}
        style={{
          background:
            "radial-gradient(closest-side, rgba(6,182,212,0.9), rgba(6,182,212,0) 70%)",
        }}
        animate={
          reduceMotion
            ? undefined
            : { x: [0, -30, 20, 0], y: [0, -20, 20, 0] }
        }
        transition={{
          duration: duration(32),
          repeat: reduceMotion ? 0 : Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Deep indigo — center drift */}
      <motion.div
        className={`${ORB_CLASS} left-[30%] top-[40%] h-[50vmin] w-[50vmin] opacity-[0.05]`}
        style={{
          background:
            "radial-gradient(closest-side, rgba(99,102,241,0.85), rgba(99,102,241,0) 70%)",
        }}
        animate={
          reduceMotion
            ? undefined
            : { x: [0, -25, 35, 0], y: [0, 25, -15, 0] }
        }
        transition={{
          duration: duration(40),
          repeat: reduceMotion ? 0 : Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}
