"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export function SplashCursor() {
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const trailX = useMotionValue(-100);
  const trailY = useMotionValue(-100);

  const [visible, setVisible] = useState(false);

  const springX = useSpring(cursorX, { damping: 28, stiffness: 220, mass: 0.6 });
  const springY = useSpring(cursorY, { damping: 28, stiffness: 220, mass: 0.6 });
  const trailSpringX = useSpring(trailX, { damping: 45, stiffness: 140, mass: 1.2 });
  const trailSpringY = useSpring(trailY, { damping: 45, stiffness: 140, mass: 1.2 });

  useEffect(() => {
    // Dokunmatik cihazlarda gösterme
    if (globalThis.matchMedia("(pointer: coarse)").matches) return;

    setVisible(true);

    const onMove = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      trailX.set(e.clientX);
      trailY.set(e.clientY);
    };

    globalThis.addEventListener("mousemove", onMove);
    return () => globalThis.removeEventListener("mousemove", onMove);
  }, [cursorX, cursorY, trailX, trailY]);

  if (!visible) return null;

  return (
    <>
      {/* Ana cursor halkası */}
      <motion.div
        className="pointer-events-none fixed z-[9999]"
        style={{
          x: springX,
          y: springY,
          translateX: "-50%",
          translateY: "-50%",
        }}
      >
        <div
          className="h-8 w-8 rounded-full border"
          style={{
            borderColor: "rgba(196,162,75,0.55)",
            background: "radial-gradient(circle, rgba(196,162,75,0.08) 0%, transparent 70%)",
            boxShadow: "0 0 16px rgba(196,162,75,0.18), inset 0 0 8px rgba(196,162,75,0.06)",
          }}
        />
      </motion.div>

      {/* Trailing dot */}
      <motion.div
        className="pointer-events-none fixed z-[9998]"
        style={{
          x: trailSpringX,
          y: trailSpringY,
          translateX: "-50%",
          translateY: "-50%",
        }}
      >
        <div
          className="h-2.5 w-2.5 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(196,162,75,0.7) 0%, transparent 70%)",
            boxShadow: "0 0 12px rgba(196,162,75,0.45)",
          }}
        />
      </motion.div>
    </>
  );
}
