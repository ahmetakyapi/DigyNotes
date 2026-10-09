"use client";

/*
  LAYOUT: Two full-bleed ticker rows between hairlines, running in opposite directions.
  Speed and direction react to scroll velocity (skew on fast scroll).
*/
import { useRef } from "react";
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from "framer-motion";
import { wrap } from "./Motion";

function Row({
  children,
  baseVelocity,
}: {
  children: React.ReactNode;
  baseVelocity: number;
}) {
  const reduce = useReducedMotion();
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, { damping: 50, stiffness: 400 });
  const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 4], { clamp: false });
  const skew = useTransform(smoothVelocity, [-2000, 2000], [8, -8]);
  const x = useTransform(baseX, (v) => `${wrap(-25, 0, v)}%`);
  const direction = useRef(1);

  useAnimationFrame((_, delta) => {
    if (reduce) return;
    let moveBy = direction.current * baseVelocity * (delta / 1000);
    const vf = velocityFactor.get();
    if (vf < 0) direction.current = -1;
    else if (vf > 0) direction.current = 1;
    moveBy += direction.current * moveBy * vf;
    baseX.set(baseX.get() + moveBy);
  });

  return (
    <div className="flex overflow-hidden whitespace-nowrap">
      <motion.div className="flex flex-nowrap" style={{ x, skewX: reduce ? 0 : skew }}>
        {[0, 1, 2, 3].map((k) => (
          <span key={k} className="flex shrink-0 items-center" aria-hidden={k > 0}>
            {children}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

const WORDS = ["Film", "Dizi", "Oyun", "Kitap", "Gezi"];

function Star() {
  return (
    <svg viewBox="0 0 24 24" className="mx-[0.35em] h-[0.42em] w-[0.42em] shrink-0 fill-[var(--gold)]" aria-hidden>
      <path d="M12 0c.6 6.4 5 11 12 12-7 1-11.4 5.6-12 12-.6-6.4-5-11-12-12 7-1 11.4-5.6 12-12Z" />
    </svg>
  );
}

export function Marquee() {
  return (
    <section aria-label="Arşiv türleri" className="relative border-y border-[var(--border)] py-6 sm:py-10">
      <Row baseVelocity={-2.2}>
        {WORDS.map((w) => (
          <span
            key={w}
            className="flex items-center text-[clamp(3.5rem,11vw,10rem)] font-extrabold leading-[1] tracking-[-0.05em] text-[var(--text-primary)]"
          >
            {w}
            <Star />
          </span>
        ))}
      </Row>
      <Row baseVelocity={2.2}>
        {["izle", "oku", "oyna", "gez", "yaz"].map((w) => (
          <span
            key={w}
            className="dn-display flex items-center px-[0.2em] text-[clamp(3.5rem,11vw,10rem)] italic leading-[1.05] tracking-[-0.03em] text-transparent [-webkit-text-stroke:1px_var(--text-muted)]"
          >
            {w}
            <span className="mx-[0.3em] not-italic text-[var(--text-faint)] [-webkit-text-stroke:0]">/</span>
          </span>
        ))}
      </Row>
    </section>
  );
}
