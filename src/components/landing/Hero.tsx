"use client";

/*
  LAYOUT: Full-viewport editorial hero.
  TOP: mono meta row (index · categories · scroll cue), hairline below.
  CENTER: giant 3-line headline (4 lines on mobile) — grotesk / serif italic mix,
          with "reel" capsules (cycling posters) set inline like words.
  RIGHT (lg+): three floating poster cards, mouse + scroll parallax at different depths.
  BOTTOM: 3-col row — manifesto blurb · CTAs · mono fact list.
*/
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { ArrowDownIcon, ArrowUpRightIcon } from "@phosphor-icons/react";
import { EASE_OUT_EXPO, Magnetic, MaskLine } from "./Motion";
import { MEDIA, REEL, REEL_B } from "./data";

function Reel({ images, offset = 0, className = "" }: { images: string[]; offset?: number; className?: string }) {
  const [i, setI] = useState(0);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce) return;
    let interval: ReturnType<typeof setInterval> | undefined;
    const start = setTimeout(() => {
      interval = setInterval(() => setI((v) => (v + 1) % images.length), 1800);
    }, offset);
    return () => {
      clearTimeout(start);
      if (interval) clearInterval(interval);
    };
  }, [images.length, offset, reduce]);

  return (
    <span
      className={`relative inline-block h-[0.74em] w-[1.6em] translate-y-[0.04em] overflow-hidden rounded-full bg-[var(--bg-raised)] align-baseline ring-1 ring-[var(--border)] ${className}`}
    >
      <AnimatePresence initial={false}>
        <motion.span
          key={images[i]}
          className="absolute inset-0"
          initial={{ clipPath: "inset(100% 0% 0% 0%)", scale: 1.25 }}
          animate={{ clipPath: "inset(0% 0% 0% 0%)", scale: 1 }}
          exit={{ opacity: 1 }}
          transition={{ duration: 0.9, ease: EASE_OUT_EXPO }}
        >
          <Image src={images[i]} alt="" fill sizes="240px" className="object-cover" priority={i === 0} />
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

const FLOATERS = [
  { src: `${MEDIA}/perfect-days.webp`, title: "Perfect Days", rating: "5.0", cls: "right-[6%] top-[22%] w-[176px] rotate-[6deg]", depth: 1.4 },
  { src: `${MEDIA}/outer-wilds.webp`, title: "Outer Wilds", rating: "5.0", cls: "right-[19%] top-[44%] w-[146px] -rotate-[8deg]", depth: 0.8 },
  { src: `${MEDIA}/kyoto.webp`, title: "Kyoto", rating: "4.5", cls: "right-[4%] top-[58%] w-[124px] rotate-[3deg]", depth: 1.9 },
];

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const headY = useTransform(scrollYProgress, [0, 1], ["0%", "28%"]);
  const headOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);
  const floatY = useTransform(scrollYProgress, [0, 1], [0, -260]);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const smx = useSpring(mx, { stiffness: 60, damping: 18 });
  const smy = useSpring(my, { stiffness: 60, damping: 18 });

  return (
    <section
      ref={ref}
      className="relative flex min-h-[100svh] flex-col overflow-hidden px-5 pb-8 pt-24 sm:px-10 sm:pb-10 sm:pt-28"
      onPointerMove={(e) => {
        if (reduce || e.pointerType !== "mouse") return;
        mx.set(e.clientX / globalThis.innerWidth - 0.5);
        my.set(e.clientY / globalThis.innerHeight - 0.5);
      }}
    >
      {/* meta row */}
      <motion.div
        className="dn-mono mx-auto flex w-full max-w-[1600px] items-center justify-between border-b border-[var(--border)] pb-3 text-[10.5px] uppercase tracking-[0.16em] text-[var(--text-muted)]"
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, delay: 0.2 }}
      >
        <span>
          <span className="text-[var(--gold)]">(01)</span> Kişisel kültür arşivi
        </span>
        <span className="hidden md:inline">Film — Dizi — Oyun — Kitap — Gezi</span>
        <span className="inline-flex items-center gap-1.5">
          Kaydır <ArrowDownIcon size={11} className="animate-bounce" />
        </span>
      </motion.div>

      {/* floating posters */}
      <motion.div aria-hidden className="pointer-events-none absolute inset-0 hidden lg:block" style={{ y: floatY }}>
        {FLOATERS.map((f, i) => (
          <Floater key={f.src} f={f} i={i} smx={smx} smy={smy} />
        ))}
      </motion.div>

      {/* headline */}
      <motion.div
        className="relative mx-auto flex w-full max-w-[1600px] flex-1 flex-col justify-center py-10"
        style={reduce ? undefined : { y: headY, opacity: headOpacity }}
      >
        <h1 className="text-[clamp(3.6rem,17vw,6rem)] font-extrabold leading-[0.9] tracking-[-0.055em] text-[var(--text-primary)] md:text-[clamp(5rem,10.4vw,11.5rem)]">
          <span className="sr-only">Sana kalan her şeyin arşivi.</span>
          {/* desktop: 3 lines */}
          <span aria-hidden className="hidden md:block">
            <MaskLine delay={0.15}>
              Sana <Reel images={REEL} /> kalan
            </MaskLine>
            <MaskLine delay={0.27} className="pl-[14vw]">
              <span className="dn-display font-normal italic tracking-[-0.03em]">her şeyin</span>
            </MaskLine>
            <MaskLine delay={0.39}>
              arşivi<span className="text-[var(--gold)]">.</span>{" "}
              <Reel images={REEL_B} offset={900} className="w-[1.25em]" />
            </MaskLine>
          </span>
          {/* mobile: 4 lines */}
          <span aria-hidden className="block md:hidden">
            <MaskLine delay={0.15}>
              Sana <Reel images={REEL} />
            </MaskLine>
            <MaskLine delay={0.25}>kalan</MaskLine>
            <MaskLine delay={0.35}>
              <span className="dn-display font-normal italic tracking-[-0.03em]">her şeyin</span>
            </MaskLine>
            <MaskLine delay={0.45}>
              arşivi<span className="text-[var(--gold)]">.</span>
            </MaskLine>
          </span>
        </h1>
      </motion.div>

      {/* bottom row */}
      <motion.div
        className="relative mx-auto grid w-full max-w-[1600px] gap-8 border-t border-[var(--border)] pt-6 md:grid-cols-[1.2fr_1fr_0.8fr] md:items-end"
        initial={reduce ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.1, ease: EASE_OUT_EXPO, delay: 0.7 }}
      >
        <p className="max-w-[420px] text-[15px] leading-relaxed text-[var(--text-secondary)] sm:text-base">
          Film, dizi, oyun, kitap ve gezilerden geriye kalanlar.{" "}
          <span className="text-[var(--text-primary)]">Puanla, etiketle, kendi cümlelerinle sakla</span> —
          yıllar sonra aynı duyguyla geri dön.
        </p>

        <div className="flex flex-wrap items-center gap-4">
          <Magnetic>
            <Link
              href="/register"
              data-cursor="Başla"
              className="group relative inline-flex h-14 items-center gap-3 overflow-hidden rounded-full bg-[var(--gold)] pl-7 pr-2 text-[15px] font-semibold text-[var(--text-on-accent)] transition-transform duration-300 active:scale-95"
            >
              <span className="relative">Arşivini başlat</span>
              <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[var(--text-on-accent)] text-[var(--gold)] transition-transform duration-500 ease-out-expo group-hover:rotate-45">
                <ArrowUpRightIcon size={16} weight="bold" />
              </span>
            </Link>
          </Magnetic>
          <Link
            href="/login"
            className="group relative text-[15px] font-medium text-[var(--text-primary)] transition-colors duration-200"
          >
            Giriş yap
            <span className="absolute -bottom-1 left-0 h-px w-full bg-current transition-transform duration-500 ease-out-expo group-hover:scale-x-0 group-hover:origin-right" />
          </Link>
        </div>

        <dl className="dn-mono grid grid-cols-3 gap-4 text-[10.5px] uppercase tracking-[0.12em] text-[var(--text-muted)] md:grid-cols-1 md:gap-1.5 md:justify-self-end md:text-right">
          <div className="flex flex-col gap-0.5 md:flex-row md:justify-end md:gap-2">
            <dt className="order-2 md:order-1">arşiv türü</dt>
            <dd className="order-1 text-[var(--text-primary)] md:order-2">05</dd>
          </div>
          <div className="flex flex-col gap-0.5 md:flex-row md:justify-end md:gap-2">
            <dt className="order-2 md:order-1">puan adımı</dt>
            <dd className="order-1 text-[var(--text-primary)] md:order-2">½</dd>
          </div>
          <div className="flex flex-col gap-0.5 md:flex-row md:justify-end md:gap-2">
            <dt className="order-2 md:order-1">ücret</dt>
            <dd className="order-1 text-[var(--gold)] md:order-2">₺0</dd>
          </div>
        </dl>
      </motion.div>
    </section>
  );
}

function Floater({
  f,
  i,
  smx,
  smy,
}: {
  f: (typeof FLOATERS)[number];
  i: number;
  smx: MotionValue<number>;
  smy: MotionValue<number>;
}) {
  const x = useTransform(smx, (v) => v * -60 * f.depth);
  const y = useTransform(smy, (v) => v * -40 * f.depth);
  return (
    <motion.figure className={`absolute ${f.cls}`} style={{ x, y }}>
      <motion.div
        initial={{ opacity: 0, y: 80, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 1.4, ease: EASE_OUT_EXPO, delay: 0.5 + i * 0.12 }}
        className="overflow-hidden rounded-[18px] border border-[var(--border)] bg-[var(--bg-card)] p-1.5 shadow-[0_40px_80px_-30px_rgb(var(--ink-rgb)/0.7)]">
        <div className="relative aspect-[2/3] overflow-hidden rounded-[13px]">
          <Image src={f.src} alt="" fill sizes="200px" className="object-cover" />
        </div>
        <figcaption className="flex items-center justify-between px-1.5 pb-0.5 pt-2">
          <span className="truncate text-[11px] font-semibold text-[var(--text-primary)]">{f.title}</span>
          <span className="dn-mono text-[10px] text-[var(--gold)]">★ {f.rating}</span>
        </figcaption>
      </motion.div>
    </motion.figure>
  );
}
