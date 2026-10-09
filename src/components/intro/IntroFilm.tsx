"use client";

/*
  LAYOUT: One-time (per session) ~5.5s opening "short film" over the landing page.
  TOP: five story-progress bars (Instagram-story style) · BOTTOM-RIGHT: "Geç" skip.
  CENTER stage: card area (upper) + headline (lower), glow tint changes per scene.
  STORY:
    01 "Bir Film İzledin."      poster drops in, tilting into place
    02 "Bir Kitap Bitirdin."    card turns like a page (rotateY) into a book cover
    03 "Bir Şehirde Kayboldun." circular iris opens onto a city photograph
    04 "Hepsi Bir İz Bıraktı."  the three fan out, then collapse into one lavender dot
    05 mark                     the dot becomes the end of "Digynotes." + tagline
    → the curtain splits (top half lifts, bottom half drops) to reveal the page.
  Clock lives at module level so StrictMode double effects / remounts resume, never restart.
  Tap anywhere or "Geç" to skip. Reduced motion: never shown.
*/
import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const M = "/landing/media";
const EASE = [0.16, 1, 0.3, 1] as const;
const SPLIT_EASE = [0.83, 0, 0.17, 1] as const;

const SCENES = [
  { at: 0, glow: "185,168,255" },
  { at: 1050, glow: "255,176,136" },
  { at: 2100, glow: "185,168,255" },
  { at: 3150, glow: "255,176,136" },
  { at: 4150, glow: "185,168,255" },
] as const;
const SPLIT_AT = 5050;
const END_AT = 6000;
const SAFETY_AT = 7500;

let startedAt: number | null = null;
let done = false;

type Phase = number | "split" | "off";

function phaseFor(elapsed: number): Phase {
  if (elapsed >= END_AT) return "off";
  if (elapsed >= SPLIT_AT) return "split";
  let idx = 0;
  SCENES.forEach((s, i) => {
    if (elapsed >= s.at) idx = i;
  });
  return idx;
}

const em = (t: string) => (
  <span className="dn-display font-normal italic tracking-[-0.02em] text-[#b9a8ff]">{t}</span>
);

const LINES: ReactNode[][] = [
  ["Bir", em("Film"), "İzledin."],
  ["Bir", em("Kitap"), "Bitirdin."],
  ["Bir", em("Şehirde"), "Kayboldun."],
  ["Hepsi", "Bir", em("İz"), "Bıraktı."],
];

function Headline({ scene }: { scene: number }) {
  const words = LINES[scene];
  if (!words) return null;
  return (
    <motion.p
      key={scene}
      className="flex flex-wrap justify-center gap-x-[0.24em] text-center text-[clamp(2.3rem,8vw,5.2rem)] font-extrabold leading-[0.95] tracking-[-0.05em] text-[#f2efe8]"
      exit={{ opacity: 0, y: -24, filter: "blur(6px)", transition: { duration: 0.22 } }}
    >
      {words.map((w, i) => (
        <span key={i} className="inline-block overflow-hidden pb-[0.08em] pt-[0.1em]">
          <motion.span
            className="inline-block"
            initial={{ y: "110%", rotate: 4 }}
            animate={{ y: "0%", rotate: 0 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.12 + i * 0.07 }}
          >
            {w}
          </motion.span>
        </span>
      ))}
    </motion.p>
  );
}

const CARD =
  "relative aspect-[2/3] w-[min(44vw,210px)] overflow-hidden rounded-[18px] ring-1 ring-white/10";

function Cards({ scene }: { scene: number }) {
  return (
    <div className="relative flex h-[min(66vw,330px)] w-full items-center justify-center [perspective:1200px]">
      <AnimatePresence>
        {scene === 0 && (
          <motion.div
            key="film"
            className={`${CARD} absolute`}
            initial={{ y: "70vh", rotate: -16 }}
            animate={{ y: 0, rotate: -4 }}
            exit={{
              rotateY: -90,
              opacity: 0.6,
              transition: { duration: 0.35, ease: [0.4, 0, 1, 1] },
            }}
            transition={{ duration: 0.9, ease: EASE }}
          >
            <Image
              src={`${M}/perfect-days.webp`}
              alt=""
              fill
              sizes="220px"
              className="object-cover"
              priority
            />
          </motion.div>
        )}
        {scene === 1 && (
          <motion.div
            key="book"
            className={`${CARD} absolute`}
            initial={{ rotateY: 90, rotate: 3 }}
            animate={{ rotateY: 0, rotate: 3 }}
            exit={{ scale: 0.9, opacity: 0, transition: { duration: 0.3 } }}
            transition={{ duration: 0.55, ease: [0, 0, 0.2, 1], delay: 0.3 }}
          >
            <Image
              src={`${M}/stoner.webp`}
              alt=""
              fill
              sizes="220px"
              className="object-cover"
              priority
            />
          </motion.div>
        )}
        {scene === 2 && (
          <motion.div
            key="city"
            className="absolute aspect-[4/5] w-[min(56vw,270px)] overflow-hidden rounded-[22px] ring-1 ring-white/10"
            initial={{ clipPath: "circle(0% at 50% 50%)", scale: 1.15 }}
            animate={{ clipPath: "circle(80% at 50% 50%)", scale: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.25 } }}
            transition={{ duration: 1, ease: EASE, delay: 0.2 }}
          >
            <Image
              src={`${M}/kyoto.webp`}
              alt=""
              fill
              sizes="280px"
              className="object-cover"
              priority
            />
          </motion.div>
        )}
        {scene === 3 &&
          ["perfect-days", "stoner", "kyoto"].map((n, i) => (
            <motion.div
              key={`fan-${n}`}
              className="absolute aspect-[2/3] w-[min(30vw,140px)] overflow-hidden rounded-[14px] ring-1 ring-white/10"
              initial={{ x: 0, rotate: 0, scale: 0.6, opacity: 0 }}
              animate={{
                x: ["0%", `${(i - 1) * 78}%`, `${(i - 1) * 78}%`, "0%"],
                rotate: [0, (i - 1) * 14, (i - 1) * 14, 0],
                scale: [0.6, 1, 1, 0.04],
                opacity: [0, 1, 1, 0],
              }}
              transition={{ duration: 1, times: [0, 0.35, 0.65, 1], ease: "easeInOut" }}
            >
              <Image src={`${M}/${n}.webp`} alt="" fill sizes="150px" className="object-cover" />
            </motion.div>
          ))}
      </AnimatePresence>
      {scene === 3 && (
        <motion.span
          className="absolute h-5 w-5 rounded-full bg-[#b9a8ff] shadow-[0_0_40px_rgba(185,168,255,0.8)]"
          initial={{ scale: 0 }}
          animate={{ scale: [0, 0, 1.4, 1] }}
          transition={{ duration: 1, times: [0, 0.8, 0.9, 1] }}
        />
      )}
    </div>
  );
}

function MarkFrame({ animate }: { animate: boolean }) {
  const enter = (d: number) =>
    animate
      ? {
          initial: { y: "105%" },
          animate: { y: "0%" },
          transition: { duration: 0.8, ease: EASE, delay: d },
        }
      : {};
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="flex items-baseline text-[clamp(3.6rem,15vw,10rem)] leading-none text-[#f2efe8]">
        <span className="overflow-hidden pb-[0.06em]">
          <motion.span className="inline-block font-extrabold tracking-[-0.055em]" {...enter(0.05)}>
            Digy
          </motion.span>
        </span>
        <span className="overflow-hidden pb-[0.06em]">
          <motion.span
            className="dn-display inline-block text-[1.1em] italic tracking-[-0.02em]"
            {...enter(0.15)}
          >
            notes
          </motion.span>
        </span>
        <motion.span
          className="ml-[0.08em] inline-block h-[0.2em] w-[0.2em] rounded-full bg-[#b9a8ff]"
          {...(animate
            ? {
                initial: { scale: 3, x: "-4em", opacity: 0.9 },
                animate: { scale: 1, x: 0, opacity: 1 },
                transition: { duration: 0.8, ease: EASE },
              }
            : {})}
        />
      </div>
      <motion.p
        className="dn-mono mt-5 text-[11px] uppercase tracking-[0.2em] text-[#77726a]"
        {...(animate
          ? {
              initial: { opacity: 0 },
              animate: { opacity: 1 },
              transition: { delay: 0.45, duration: 0.6 },
            }
          : {})}
      >
        Sana Kalan Her Şeyin Arşivi
      </motion.p>
    </div>
  );
}

export function IntroFilm() {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("off");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const finish = useCallback(() => {
    done = true;
    try {
      sessionStorage.setItem("dn_intro_seen", "1");
    } catch {
      /* storage unavailable: the film simply plays again next visit */
    }
    setPhase("off");
  }, []);

  const schedule = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (startedAt === null) return;
    const elapsed = performance.now() - startedAt;
    const current = phaseFor(elapsed);
    if (current === "off") {
      finish();
      return;
    }
    setPhase(current);
    const marks = [...SCENES.map((s) => s.at), SPLIT_AT];
    marks.forEach((at) => {
      if (at > elapsed) timers.current.push(setTimeout(() => setPhase(phaseFor(at)), at - elapsed));
    });
    timers.current.push(setTimeout(finish, END_AT - elapsed));
    timers.current.push(setTimeout(finish, Math.max(0, SAFETY_AT - elapsed)));
  }, [finish]);

  useEffect(() => {
    if (reduce || done) return;
    if (startedAt === null) {
      try {
        if (sessionStorage.getItem("dn_intro_seen")) {
          done = true;
          return;
        }
      } catch {
        done = true;
        return;
      }
      startedAt = performance.now();
    }
    schedule();
    const list = timers;
    return () => list.current.forEach(clearTimeout);
  }, [reduce, schedule]);

  const skip = () => {
    if (phase === "split" || phase === "off" || startedAt === null) return;
    startedAt = performance.now() - SPLIT_AT;
    schedule();
  };

  if (phase === "off") return null;

  if (phase === "split") {
    const half = (top: boolean) => (
      <motion.div
        className={`absolute inset-x-0 overflow-hidden bg-[#0b0b0a] ${top ? "top-0 h-1/2" : "bottom-0 h-1/2"}`}
        initial={{ y: "0%" }}
        animate={{ y: top ? "-101%" : "101%" }}
        transition={{ duration: 0.9, ease: SPLIT_EASE }}
      >
        <div
          className={`absolute inset-x-0 flex h-[100svh] items-center justify-center ${top ? "top-0" : "bottom-0"}`}
        >
          <MarkFrame animate={false} />
        </div>
      </motion.div>
    );
    return (
      <div key="split" aria-hidden className="fixed inset-0 z-[110]">
        {half(true)}
        {half(false)}
        <motion.div
          className="absolute inset-x-0 top-1/2 h-px bg-[#b9a8ff]"
          initial={{ scaleX: 0, opacity: 1 }}
          animate={{ scaleX: 1, opacity: 0 }}
          transition={{ duration: 0.8, ease: EASE }}
        />
      </div>
    );
  }

  const scene = phase;
  return (
    <div
      key="stage"
      className="fixed inset-0 z-[110] cursor-pointer overflow-hidden bg-[#0b0b0a]"
      onClick={skip}
      role="presentation"
    >
      {/* scene tint */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[38%] h-[90vmin] w-[90vmin] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        animate={{
          background: `radial-gradient(closest-side, rgba(${SCENES[scene].glow},0.22), transparent)`,
        }}
        transition={{ duration: 0.8 }}
      />

      {/* story bars */}
      <div className="absolute inset-x-5 top-5 flex gap-1.5 sm:inset-x-10 sm:top-8">
        {SCENES.map((s, i) => {
          const dur = ((SCENES[i + 1]?.at ?? SPLIT_AT) - s.at) / 1000;
          return (
            <span key={i} className="h-[2px] flex-1 overflow-hidden rounded-full bg-white/15">
              <motion.span
                key={`${i}-${i < scene ? "past" : i === scene ? "now" : "next"}`}
                className="block h-full bg-[#f2efe8]"
                initial={{ width: i < scene ? "100%" : "0%" }}
                animate={{ width: i <= scene ? "100%" : "0%" }}
                transition={i === scene ? { duration: dur, ease: "linear" } : { duration: 0 }}
              />
            </span>
          );
        })}
      </div>
      <p className="dn-mono absolute left-5 top-10 text-[10.5px] uppercase tracking-[0.18em] text-[#77726a] sm:left-10 sm:top-14">
        <span className="text-[#b9a8ff]">(DN)</span>{" "}
        {String(Math.min(scene + 1, 5)).padStart(2, "0")} / 05
      </p>

      {/* stage */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-8 px-6">
        {scene < 4 ? (
          <>
            <Cards scene={scene} />
            <div className="min-h-[2.2em] text-[clamp(2.3rem,8vw,5.2rem)]">
              <AnimatePresence mode="wait">
                <Headline key={scene} scene={scene} />
              </AnimatePresence>
            </div>
          </>
        ) : (
          <MarkFrame animate />
        )}
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          skip();
        }}
        className="dn-mono absolute bottom-6 right-5 cursor-pointer rounded-full border border-white/15 px-4 py-2 text-[10.5px] uppercase tracking-[0.18em] text-[#a8a399] transition-colors duration-200 hover:border-white/40 hover:text-[#f2efe8] sm:bottom-10 sm:right-10"
      >
        Geç →
      </button>
    </div>
  );
}
