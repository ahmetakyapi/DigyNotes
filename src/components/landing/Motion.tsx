"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Lenis from "lenis";
import {
  motion,
  MotionConfig,
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
  type MotionValue,
} from "framer-motion";
import { EASE_OUT_EXPO } from "@/lib/variants";
import { useHydratedReducedMotion } from "@/hooks/useReducedMotion";

export { EASE_OUT_EXPO };

/* ── Lenis smooth scroll (landing only) ── */
export function SmoothScroll() {
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce) return;
    const lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, smoothWheel: true });
    activeLenis = lenis;
    if (scrollPaused) lenis.stop();
    let raf = 0;
    const loop = (t: number) => {
      lenis.raf(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      if (activeLenis === lenis) activeLenis = null;
      lenis.destroy();
    };
  }, [reduce]);
  return null;
}

/* Pauses page scrolling while the intro film plays. lenis.stop() swallows wheel events
   and adds .lenis-stopped (overflow: hidden in globals.css), which also stops keys and
   touch. Module-level so the order in which SmoothScroll and IntroFilm mount is moot. */
let activeLenis: Lenis | null = null;
let scrollPaused = false;
export function setSmoothScrollPaused(paused: boolean) {
  scrollPaused = paused;
  if (paused) activeLenis?.stop();
  else activeLenis?.start();
}

/* Reduced motion that hydrates cleanly (framer's hook fails hydration when markup
   branches on it); lives in src/hooks, re-exported for the landing sections. */
export { useHydratedReducedMotion };

/* Wraps the landing: reveals that mounted with their `initial` state before the
   post-hydration re-render finish without movement for reduced-motion visitors. */
export function LandingMotion({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

/* ── Masked line reveal: text slides up from behind an overflow mask ── */
export function MaskLine({
  children,
  delay = 0,
  className = "",
  once = true,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  once?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once, margin: "0px 0px -10% 0px" });
  const reduce = useHydratedReducedMotion();
  return (
    <span
      ref={ref}
      className={`-mt-[0.14em] block overflow-hidden pb-[0.08em] pt-[0.14em] ${className}`}
    >
      <motion.span
        className="block will-change-transform [text-wrap:balance]"
        initial={reduce ? false : { y: "110%", rotate: 2 }}
        animate={inView ? { y: "0%", rotate: 0 } : undefined}
        transition={{ duration: 1.1, ease: EASE_OUT_EXPO, delay }}
      >
        {children}
      </motion.span>
    </span>
  );
}

/* ── Fade-up for blocks ── */
export function FadeUp({
  children,
  delay = 0,
  className = "",
  y = 28,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  y?: number;
}) {
  const reduce = useHydratedReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: 1, ease: EASE_OUT_EXPO, delay }}
    >
      {children}
    </motion.div>
  );
}

/* ── Magnetic wrapper: pulls its child toward the pointer ── */
export function Magnetic({
  children,
  strength = 0.35,
}: {
  children: ReactNode;
  strength?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 18 });
  const sy = useSpring(y, { stiffness: 220, damping: 18 });
  return (
    <motion.div
      ref={ref}
      className="inline-block"
      style={{ x: sx, y: sy }}
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse" || !ref.current) return;
        const r = ref.current.getBoundingClientRect();
        x.set((e.clientX - (r.left + r.width / 2)) * strength);
        y.set((e.clientY - (r.top + r.height / 2)) * strength);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}

/* ── Wrap helper for infinite loops ── */
export function wrap(min: number, max: number, v: number) {
  const range = max - min;
  return ((((v - min) % range) + range) % range) + min;
}

export type MV = MotionValue<number>;
