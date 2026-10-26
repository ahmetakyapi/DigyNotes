"use client";

import { useRef, type ReactNode } from "react";
import { motion, useReducedMotion, useScroll, useSpring } from "motion/react";

/*
  LAYOUT: wraps a note body; a 2px accent line pinned to the top of the viewport fills
  from left to right as the body scrolls past (start under the sticky header → body end
  at the bottom of the screen).
  MOTION: transform only (scaleX from a scroll motion value, no React re-render per
  frame); spring-smoothed, straight value under reduced motion. Short notes get no bar.
*/
export function ReadingProgress({
  enabled,
  children,
}: {
  readonly enabled: boolean;
  readonly children: ReactNode;
}) {
  // The ref is attached in every branch (ERR-UI-001); only the bar is conditional.
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 120px", "end end"] });
  const smooth = useSpring(scrollYProgress, { stiffness: 220, damping: 34, restDelta: 0.001 });

  return (
    <div ref={ref}>
      {enabled && (
        <motion.div
          aria-hidden
          className="pointer-events-none fixed inset-x-0 top-0 z-[45] h-[2px] origin-left bg-[var(--gold)]"
          style={{ scaleX: reduce ? scrollYProgress : smooth }}
        />
      )}
      {children}
    </div>
  );
}
