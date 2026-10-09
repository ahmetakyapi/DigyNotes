"use client";

/*
  LAYOUT: Pinned scroll-cinema hero (section 340vh, sticky 100svh stage).
  ACT 1 (0 → .3)   — Editorial headline (3 lines desktop / 4 mobile) with inline poster reels,
                     meta row, floating posters, bottom row (blurb · CTAs · facts).
                     On scroll the lines drift apart, blur and fade; posters fly off.
  ACT 2 (.1 → .5)  — A capsule "aperture" opens from the centre to full-bleed, revealing a
                     tilted wall of covers that slowly de-zooms.
  ACT 3 (.46 → .85) — Over the wall: "İzle. Oku. Oyna. Gez." word by word, then "Hepsini Not Al.",
                     plus a glass note card whose stars fill with scroll (0 → 4.5).
  ACT 4 (.86 → 1)  — Stage shrinks into a rounded card and hands over to the next section.
  Reduced motion: no pin, Act 1 only.
*/
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { ArrowDownIcon, ArrowUpRightIcon } from "@phosphor-icons/react";
import { EASE_OUT_EXPO, Magnetic, MaskLine } from "./Motion";
import { IntroFilm } from "@/components/intro/IntroFilm";
import { MEDIA, REEL, REEL_B, type ReelItem } from "./data";

/* ── Inline cycling poster capsule ──
   A tilted "projector window" set inside the headline: covers wipe up one after another,
   a mono caption names the current title, and a hairline at the bottom fills per frame. */
const REEL_MS = 2000;
function Reel({
  items,
  offset = 0,
  width = "w-[1.8em]",
}: {
  items: ReelItem[];
  offset?: number;
  width?: string;
}) {
  const [i, setI] = useState(0);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce) return;
    let interval: ReturnType<typeof setInterval> | undefined;
    const start = setTimeout(() => {
      setI((v) => (v + 1) % items.length);
      interval = setInterval(() => setI((v) => (v + 1) % items.length), REEL_MS);
    }, REEL_MS + offset);
    return () => {
      clearTimeout(start);
      if (interval) clearInterval(interval);
    };
  }, [items.length, offset, reduce]);
  const item = items[i];

  return (
    <span
      className={`group/reel relative inline-block h-[0.82em] ${width} translate-y-[0.06em] -rotate-[3deg] overflow-hidden rounded-full bg-[var(--bg-raised)] align-baseline shadow-[var(--shadow-deep)] ring-[1.5px] ring-accent/45 transition-transform duration-700 ease-out-expo hover:rotate-0 hover:scale-[1.04]`}
    >
      <AnimatePresence initial={false}>
        <motion.span
          key={item.src}
          className="absolute inset-0"
          initial={{ clipPath: "inset(100% 0% 0% 0%)", scale: 1.3 }}
          animate={{ clipPath: "inset(0% 0% 0% 0%)", scale: 1.06 }}
          exit={{ opacity: 1 }}
          transition={{ duration: 0.9, ease: EASE_OUT_EXPO }}
        >
          <Image
            src={item.src}
            alt=""
            fill
            sizes="(min-width:768px) 300px, 45vw"
            className="object-cover"
            priority={i === 0}
          />
        </motion.span>
      </AnimatePresence>
      <span className="absolute inset-0 bg-gradient-to-t from-[rgb(var(--ink-rgb)/0.75)] via-transparent to-transparent" />
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={item.title}
          className="dn-mono absolute bottom-[0.17em] left-[0.42em] flex items-center gap-[0.35em] whitespace-nowrap text-[clamp(7px,0.085em,12px)] font-medium uppercase tracking-[0.14em] text-[#f2efe8]"
          initial={{ y: "120%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          exit={{ y: "-120%", opacity: 0 }}
          transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
        >
          <span className="inline-block h-[0.55em] w-[0.55em] rounded-full bg-[#b9a8ff]" />
          {item.kind} · {item.title}
        </motion.span>
      </AnimatePresence>
      {!reduce && (
        <motion.span
          key={`bar-${i}`}
          className="absolute bottom-0 left-0 h-[2px] bg-[#b9a8ff]"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: (i === 0 ? REEL_MS + offset : REEL_MS) / 1000, ease: "linear" }}
        />
      )}
    </span>
  );
}

const WALL = [
  "perfect-days",
  "elden-ring",
  "severance",
  "kurk-mantolu-madonna",
  "kyoto",
  "aftersun",
  "outer-wilds",
  "stoner",
  "shogun",
  "past-lives",
  "kapadokya",
  "disco-elysium",
  "dark",
  "klara-and-the-sun",
  "dune-part-two",
  "hades",
  "lizbon",
  "the-bear",
  "anatomy-of-a-fall",
  "mardin",
  "dune",
  "perfect-days",
  "elden-ring",
  "severance",
];

const FLOATERS = [
  {
    src: `${MEDIA}/perfect-days.webp`,
    title: "Perfect Days",
    rating: "5.0",
    cls: "right-[5%] top-[20%] w-[150px] rotate-[6deg] xl:w-[176px]",
    depth: 1.4,
    fly: [-120, -520, 18],
  },
  {
    src: `${MEDIA}/outer-wilds.webp`,
    title: "Outer Wilds",
    rating: "5.0",
    cls: "right-[19%] top-[40%] w-[124px] -rotate-[8deg] xl:top-[44%] xl:w-[146px]",
    depth: 0.8,
    fly: [-260, -380, -24],
  },
  {
    src: `${MEDIA}/kyoto.webp`,
    title: "Kyoto",
    rating: "4.5",
    cls: "right-[4%] top-[58%] hidden w-[124px] rotate-[3deg] xl:block",
    depth: 1.9,
    fly: [160, -300, 30],
  },
];

const MOBILE_STRIP = [
  `${MEDIA}/outer-wilds.webp`,
  `${MEDIA}/perfect-days.webp`,
  `${MEDIA}/kyoto.webp`,
];
const VERBS = ["İzle.", "Oku.", "Oyna.", "Gez."];

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start start", "end end"] });

  /* ACT 1 — headline breakup */
  const l1x = useTransform(p, [0, 0.3], ["0%", "-34%"]);
  const l2x = useTransform(p, [0, 0.3], ["0%", "26%"]);
  const l3x = useTransform(p, [0, 0.3], ["0%", "-18%"]);
  const headScale = useTransform(p, [0, 0.3], [1, 1.12]);
  const headOpacity = useTransform(p, [0.08, 0.28], [1, 0]);
  const headBlur = useTransform(p, [0.05, 0.28], ["blur(0px)", "blur(10px)"]);
  const chromeOpacity = useTransform(p, [0, 0.1], [1, 0]);
  const chromeY = useTransform(p, [0, 0.1], [0, 30]);

  /* ACT 2 — aperture */
  const open = useTransform(p, [0.1, 0.48], [0, 1]);
  const exit = useTransform(p, [0.86, 1], [0, 1]);
  const clipPath = useTransform([open, exit], ([o, e]: number[]) => {
    const ease = 1 - Math.pow(1 - o, 3);
    const v = 46 * (1 - ease);
    const h = 42 * (1 - ease);
    const r = 999 * (1 - ease) + 36 * e;
    const ex = 3.5 * e;
    return `inset(${v + ex}% ${h + ex}% ${v + ex}% ${h + ex}% round ${r}px)`;
  });
  const wallScale = useTransform(p, [0.1, 0.85], [1.55, 1.05]);
  const wallY = useTransform(p, [0.1, 1], ["4%", "-10%"]);
  const veil = useTransform(p, [0.35, 0.55], [0.15, 0.62]);

  /* ACT 3 — words + note card */
  const outro = useTransform(p, [0.78, 0.85], [0, 1]);
  const wordsOpacity = useTransform(p, [0.72, 0.77], [1, 0]);
  const stageOpacity = useTransform(p, [0.09, 0.13], [0, 1]);
  const outroScale = useTransform(outro, [0, 1], [0.9, 1]);
  const cardY = useTransform(p, [0.5, 0.62], [80, 0]);
  const cardOpacity = useTransform(p, [0.5, 0.6], [0, 1]);
  const ratingMV = useTransform(p, [0.56, 0.8], [0, 4.5]);
  const [rating, setRating] = useState(0);
  useMotionValueEvent(ratingMV, "change", (v) => setRating(Math.round(v * 2) / 2));

  /* Mouse parallax for floaters */
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const smx = useSpring(mx, { stiffness: 60, damping: 18 });
  const smy = useSpring(my, { stiffness: 60, damping: 18 });

  const line = (x: MotionValue<string>) => (reduce ? undefined : { x });

  return (
    <section
      ref={ref}
      className="relative"
      style={{ height: reduce ? "auto" : "340vh" }}
      onPointerMove={(e) => {
        if (reduce || e.pointerType !== "mouse") return;
        mx.set(e.clientX / globalThis.innerWidth - 0.5);
        my.set(e.clientY / globalThis.innerHeight - 0.5);
      }}
    >
      <IntroFilm />
      <div className={`${reduce ? "relative" : "sticky top-0 h-[100svh]"} overflow-hidden`}>
        {/* ── ACT 1 ── */}
        <div className="relative flex h-full min-h-[100svh] flex-col px-5 pb-6 pt-20 sm:px-10 sm:pb-8 sm:pt-24">
          <motion.div
            className="dn-mono mx-auto flex w-full max-w-[1600px] items-center justify-between border-b border-[var(--border)] pb-3 text-[10.5px] uppercase tracking-[0.16em] text-[var(--text-muted)]"
            style={reduce ? undefined : { opacity: chromeOpacity }}
          >
            <span>
              <span className="text-[var(--gold)]">(01)</span> Kişisel Not Defterin
            </span>
            <span className="hidden md:inline">Film — Dizi — Oyun — Kitap — Gezi</span>
            <span className="inline-flex items-center gap-1.5">
              Kaydır <ArrowDownIcon size={11} className="animate-bounce" />
            </span>
          </motion.div>

          <div aria-hidden className="pointer-events-none absolute inset-0 hidden lg:block">
            {FLOATERS.map((f, i) => (
              <Floater key={f.src} f={f} i={i} smx={smx} smy={smy} p={p} reduce={!!reduce} />
            ))}
          </div>

          <motion.div
            className="relative mx-auto flex w-full max-w-[1600px] flex-1 flex-col justify-center py-6"
            style={
              reduce
                ? undefined
                : {
                    scale: headScale,
                    opacity: headOpacity,
                    filter: headBlur,
                    transformOrigin: "30% 50%",
                  }
            }
          >
            <h1 className="text-[clamp(3.6rem,17vw,6rem)] font-extrabold leading-[0.9] tracking-[-0.04em] text-[var(--text-primary)] md:text-[clamp(5rem,10.4vw,11.5rem)]">
              <span className="sr-only">Sana Kalan Her Şey, Burada.</span>
              <span aria-hidden className="hidden md:block">
                <motion.span className="block" style={line(l1x)}>
                  <MaskLine delay={0.15}>
                    Sana <Reel items={REEL} /> Kalan
                  </MaskLine>
                </motion.span>
                <motion.span className="block" style={line(l2x)}>
                  <MaskLine delay={0.27} className="pl-[14vw]">
                    <span className="dn-display font-normal italic tracking-[-0.03em]">
                      Her Şey,
                    </span>
                  </MaskLine>
                </motion.span>
                <motion.span className="block" style={line(l3x)}>
                  <MaskLine delay={0.39}>
                    Burada<span className="text-[var(--gold)]">.</span>{" "}
                    <Reel items={REEL_B} offset={900} width="w-[1.4em]" />
                  </MaskLine>
                </motion.span>
              </span>
              <span aria-hidden className="block md:hidden">
                <motion.span className="block" style={line(l1x)}>
                  <MaskLine delay={0.15}>
                    Sana <Reel items={REEL} width="w-[2.3em]" />
                  </MaskLine>
                </motion.span>
                <motion.span className="block" style={line(l2x)}>
                  <MaskLine delay={0.25}>Kalan</MaskLine>
                </motion.span>
                <motion.span className="block" style={line(l3x)}>
                  <MaskLine delay={0.35}>
                    <span className="dn-display font-normal italic tracking-[-0.03em]">
                      Her Şey,
                    </span>
                  </MaskLine>
                </motion.span>
                <motion.span className="block" style={line(l2x)}>
                  <MaskLine delay={0.45}>
                    Burada<span className="text-[var(--gold)]">.</span>
                  </MaskLine>
                </motion.span>
              </span>
            </h1>

            <div aria-hidden className="mt-8 flex justify-center gap-3 md:hidden">
              {MOBILE_STRIP.map((src, i) => (
                <div
                  key={src}
                  className={`w-[27%] ${["translate-y-3 -rotate-6", "z-10 -translate-y-1", "translate-y-3 rotate-6"][i]}`}
                >
                  <motion.div
                    className="relative aspect-[2/3] overflow-hidden rounded-xl border border-[var(--border)] shadow-[var(--shadow-deep)]"
                    initial={reduce ? false : { opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1.2, ease: EASE_OUT_EXPO, delay: 0.55 + i * 0.1 }}
                  >
                    <Image src={src} alt="" fill sizes="30vw" className="object-cover" />
                  </motion.div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            className="relative mx-auto grid w-full max-w-[1600px] gap-6 border-t border-[var(--border)] pt-5 md:grid-cols-[1.2fr_1fr_0.8fr] md:items-end"
            style={reduce ? undefined : { opacity: chromeOpacity, y: chromeY }}
          >
            <p className="max-w-[420px] text-[15px] leading-relaxed text-[var(--text-secondary)] sm:text-base">
              İzlediğin filmi, okuduğun kitabı, gezdiğin şehri not al.{" "}
              <span className="text-[var(--text-primary)]">
                Puan ver, etiket ekle, aklından geçenleri yaz.
              </span>{" "}
              Yıllar sonra dönüp baktığında o anı yeniden hatırla.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Magnetic>
                <Link
                  href="/register"
                  data-cursor="Başla"
                  className="group relative inline-flex h-14 items-center gap-3 overflow-hidden rounded-full bg-[var(--gold)] pl-7 pr-2 text-[15px] font-semibold text-[var(--text-on-accent)] transition-transform duration-300 active:scale-95"
                >
                  <span className="relative">Hemen Başla</span>
                  <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[var(--text-on-accent)] text-[var(--gold)] transition-transform duration-500 ease-out-expo group-hover:rotate-45">
                    <ArrowUpRightIcon size={16} weight="bold" />
                  </span>
                </Link>
              </Magnetic>
              <Link
                href="/login"
                className="group relative text-[15px] font-medium text-[var(--text-primary)]"
              >
                Giriş Yap
                <span className="absolute -bottom-1 left-0 h-px w-full bg-current transition-transform duration-500 ease-out-expo group-hover:origin-right group-hover:scale-x-0" />
              </Link>
            </div>
            <dl className="dn-mono hidden gap-1.5 text-right text-[10.5px] uppercase tracking-[0.12em] text-[var(--text-muted)] md:grid md:justify-self-end">
              {[
                ["Kategori", "05", ""],
                ["Yarım Puan", "½", ""],
                ["Ücretsiz", "₺0", "text-[var(--gold)]"],
              ].map(([k, v, c]) => (
                <div key={k} className="flex justify-end gap-2">
                  <dt>{k}</dt>
                  <dd className={c || "text-[var(--text-primary)]"}>{v}</dd>
                </div>
              ))}
            </dl>
          </motion.div>
        </div>

        {/* ── ACT 2–4: aperture stage ── */}
        {!reduce && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-20 overflow-hidden bg-[#0b0b0a]"
            style={{ clipPath, opacity: stageOpacity }}
          >
            <motion.div
              className="absolute inset-[-20%] grid grid-cols-4 gap-3 sm:grid-cols-6 sm:gap-4"
              style={{ scale: wallScale, y: wallY, rotate: -8 }}
            >
              {WALL.map((name, i) => (
                <div
                  key={`${name}-${i}`}
                  className={`relative aspect-[2/3] overflow-hidden rounded-xl sm:rounded-2xl ${i % 2 ? "translate-y-[18%]" : ""}`}
                >
                  <Image
                    src={`${MEDIA}/${name}.webp`}
                    alt=""
                    fill
                    sizes="(min-width:640px) 18vw, 26vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </motion.div>
            <motion.div className="absolute inset-0 bg-[#0b0b0a]" style={{ opacity: veil }} />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(11,11,10,0.85)_100%)]" />

            <motion.div
              className="absolute inset-0 flex flex-col items-start justify-center px-6 sm:px-14 lg:px-24"
              style={{ opacity: wordsOpacity }}
            >
              <div className="flex flex-wrap gap-x-[0.28em] text-[clamp(3.4rem,11vw,11rem)] font-extrabold leading-[0.88] tracking-[-0.04em] text-[#f2efe8]">
                {VERBS.map((w, i) => (
                  <Verb
                    key={w}
                    word={w}
                    p={p}
                    range={[0.46 + i * 0.05, 0.52 + i * 0.05]}
                    italic={i % 2 === 1}
                  />
                ))}
              </div>
            </motion.div>
            <motion.div
              className="absolute inset-0 flex items-center justify-center px-6"
              style={{ opacity: outro, scale: outroScale }}
            >
              <p className="text-center text-[clamp(3.4rem,11vw,11rem)] font-extrabold leading-[0.88] tracking-[-0.04em] text-[#f2efe8]">
                Hepsini{" "}
                <span className="dn-display font-normal italic tracking-[-0.03em] text-[#b9a8ff]">
                  Not Al.
                </span>
              </p>
            </motion.div>

            <motion.div
              className="absolute bottom-[7%] right-[5%] w-[min(86vw,340px)] rounded-[22px] border border-white/15 bg-[rgba(19,19,17,0.62)] p-3 backdrop-blur-xl sm:bottom-[9%] sm:right-[6%]"
              style={{ y: cardY, opacity: cardOpacity }}
            >
              <div className="flex items-center gap-3">
                <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-lg">
                  <Image
                    src={`${MEDIA}/perfect-days.webp`}
                    alt=""
                    fill
                    sizes="60px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="dn-mono flex items-center gap-2 text-[9.5px] uppercase tracking-[0.14em]">
                    <span className="text-[#b9a8ff]">Film</span>
                    <span className="text-white/50">İzlendi</span>
                  </div>
                  <p className="dn-display text-2xl italic leading-tight text-[#f2efe8]">
                    Perfect Days
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <StarsBar value={rating} />
                    <span className="dn-mono text-[11px] tabular-nums text-[#f2efe8]">
                      {rating.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {!reduce && (
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-30 h-[2px]">
            <motion.div className="h-full origin-left bg-[var(--gold)]" style={{ scaleX: p }} />
          </div>
        )}
      </div>
    </section>
  );
}

function Verb({
  word,
  p,
  range,
  italic,
}: {
  word: string;
  p: MotionValue<number>;
  range: [number, number];
  italic: boolean;
}) {
  const opacity = useTransform(p, range, [0, 1]);
  const y = useTransform(p, range, ["60%", "0%"]);
  const rotate = useTransform(p, range, [6, 0]);
  return (
    <span className="overflow-hidden pb-[0.06em] pt-[0.1em]">
      <motion.span
        className={`inline-block ${italic ? "dn-display font-normal italic tracking-[-0.03em] text-[#b9a8ff]" : ""}`}
        style={{ opacity, y, rotate }}
      >
        {word}
      </motion.span>
    </span>
  );
}

function StarsBar({ value }: { value: number }) {
  return (
    <span className="relative inline-flex">
      <span className="flex gap-[3px] text-white/20">
        {[0, 1, 2, 3, 4].map((i) => (
          <Star key={i} />
        ))}
      </span>
      <span
        className="absolute inset-y-0 left-0 flex gap-[3px] overflow-hidden text-[#b9a8ff]"
        style={{ width: `${(value / 5) * 100}%` }}
      >
        {[0, 1, 2, 3, 4].map((i) => (
          <Star key={i} />
        ))}
      </span>
    </span>
  );
}

function Star() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 fill-current" aria-hidden>
      <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z" />
    </svg>
  );
}

function Floater({
  f,
  i,
  smx,
  smy,
  p,
  reduce,
}: {
  f: (typeof FLOATERS)[number];
  i: number;
  smx: MotionValue<number>;
  smy: MotionValue<number>;
  p: MotionValue<number>;
  reduce: boolean;
}) {
  const mxv = useTransform(smx, (v) => v * -60 * f.depth);
  const myv = useTransform(smy, (v) => v * -40 * f.depth);
  const flyX = useTransform(p, [0, 0.3], [0, f.fly[0]]);
  const flyY = useTransform(p, [0, 0.3], [0, f.fly[1]]);
  const flyR = useTransform(p, [0, 0.3], [0, f.fly[2]]);
  const opacity = useTransform(p, [0.12, 0.3], [1, 0]);
  return (
    <motion.figure
      className={`absolute ${f.cls}`}
      style={reduce ? undefined : { x: flyX, y: flyY, rotate: flyR, opacity }}
    >
      <motion.div style={{ x: mxv, y: myv }}>
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 80, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1.4, ease: EASE_OUT_EXPO, delay: 0.5 + i * 0.12 }}
          className="overflow-hidden rounded-[18px] border border-[var(--border)] bg-[var(--bg-card)] p-1.5 shadow-[var(--shadow-deep)]"
        >
          <div className="relative aspect-[2/3] overflow-hidden rounded-[13px]">
            <Image src={f.src} alt="" fill sizes="200px" className="object-cover" />
          </div>
          <figcaption className="flex items-center justify-between px-1.5 pb-0.5 pt-2">
            <span className="truncate text-[11px] font-semibold text-[var(--text-primary)]">
              {f.title}
            </span>
            <span className="dn-mono text-[10px] text-[var(--gold)]">★ {f.rating}</span>
          </figcaption>
        </motion.div>
      </motion.div>
    </motion.figure>
  );
}
