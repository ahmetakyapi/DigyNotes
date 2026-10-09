"use client";

/*
  LAYOUT: Two halves of one seamless sign-in → app transition.
  WelcomeCover  (login/register): ink curtain wipes up from the bottom; three poster
                columns drift behind a veil; mono "Notların Hazırlanıyor" + sweeping hairline.
  WelcomeReveal (AppShell, first paint after sign-in): starts fully covered, shows
                "Hoş Geldin, {Ad}." in giant type, then the curtain splits (top half up,
                bottom half down) to reveal the app. Driven by a sessionStorage handoff.
*/
import Image from "next/image";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const KEY = "dn_welcome_name";
const EASE = [0.83, 0, 0.17, 1] as const;
const M = "/landing/media";
const COLS = [
  ["perfect-days", "severance", "kyoto", "stoner"],
  ["outer-wilds", "aftersun", "kurk-mantolu-madonna", "shogun"],
  ["past-lives", "disco-elysium", "kapadokya", "dark"],
];

/** Call right before navigating into the app after a successful sign-in. */
export function queueWelcome(name: string | null | undefined) {
  try {
    sessionStorage.setItem(KEY, (name ?? "").trim() || "1");
  } catch {
    /* storage blocked: the app simply opens without the reveal */
  }
}

function PosterWall() {
  return (
    <div
      aria-hidden
      className="absolute inset-0 grid -rotate-[6deg] scale-125 grid-cols-3 gap-4 px-6 opacity-40"
    >
      {COLS.map((col, ci) => (
        <div key={ci} className="overflow-hidden">
          <div className={`flex flex-col gap-4 ${ci === 1 ? "dn-drift-down" : "dn-drift-up"}`}>
            {[...col, ...col].map((n, i) => (
              <div key={`${n}-${i}`} className="relative aspect-[2/3] overflow-hidden rounded-2xl">
                <Image src={`${M}/${n}.webp`} alt="" fill sizes="30vw" className="object-cover" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function WelcomeCover({ show }: { show: boolean }) {
  const reduce = useReducedMotion();
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          role="status"
          aria-live="polite"
          className="fixed inset-0 z-[9999] overflow-hidden bg-[#0b0b0a]"
          initial={reduce ? { opacity: 0 } : { clipPath: "inset(100% 0% 0% 0%)" }}
          animate={reduce ? { opacity: 1 } : { clipPath: "inset(0% 0% 0% 0%)" }}
          transition={{ duration: 0.8, ease: EASE }}
        >
          <PosterWall />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(11,11,10,0.55),#0b0b0a_75%)]" />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.p
              className="text-[13px] text-[#a8a399] font-medium"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.6 }}
            >
              <span className="text-[#b9a8ff]">(DN)</span> Notların Hazırlanıyor
            </motion.p>
            <div className="relative mt-5 h-px w-48 overflow-hidden bg-white/15">
              <span className="dn-loader-sweep absolute inset-y-0 left-0 w-1/3 bg-[#b9a8ff]" />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* Module-level handoff state: survives StrictMode double effects and remounts. */
let reveal: { name: string; startedAt: number } | null = null;
let revealDone = false;
const OPEN_AT = 1250;
const DONE_AT = 2400;

export function WelcomeReveal() {
  const reduce = useReducedMotion();
  const [name, setName] = useState<string | null>(null);
  const [phase, setPhase] = useState<"cover" | "open" | "done">("done");

  useEffect(() => {
    if (!reveal) {
      let value: string | null = null;
      try {
        value = sessionStorage.getItem(KEY);
        if (value) sessionStorage.removeItem(KEY);
      } catch {
        value = null;
      }
      if (!value) return;
      revealDone = false;
      reveal = { name: value === "1" ? "" : value.split(" ")[0], startedAt: performance.now() };
    }
    if (revealDone || reduce) return;
    const current = reveal;
    setName(current.name);
    const elapsed = performance.now() - current.startedAt;
    const finish = () => {
      revealDone = true;
      reveal = null;
      setPhase("done");
    };
    if (elapsed >= DONE_AT) {
      finish();
      return;
    }
    setPhase(elapsed >= OPEN_AT ? "open" : "cover");
    const t1 = setTimeout(() => setPhase("open"), Math.max(0, OPEN_AT - elapsed));
    const t2 = setTimeout(finish, Math.max(0, DONE_AT - elapsed));
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [reduce]);

  if (phase === "done") return null;

  const half = (top: boolean) => (
    <motion.div
      className={`absolute inset-x-0 overflow-hidden bg-[#0b0b0a] ${top ? "top-0 h-1/2" : "bottom-0 h-1/2"}`}
      initial={{ y: "0%" }}
      animate={phase === "open" ? { y: top ? "-100%" : "100%" } : { y: "0%" }}
      transition={{ duration: 1, ease: EASE }}
    >
      <div className={`absolute inset-x-0 h-[100vh] ${top ? "top-0" : "bottom-0"}`}>
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <p className="text-[13px] text-[#77726a] font-medium">
            <span className="text-[#b9a8ff]">(DN)</span> Tekrar Merhaba
          </p>
          <p className="mt-5 text-[clamp(3rem,11vw,9rem)] font-extrabold leading-[0.9] tracking-[-0.04em] text-[#f2efe8]">
            Hoş Geldin{name ? "," : ""}
            {name && (
              <>
                <br />
                <span className="dn-display font-normal italic tracking-[-0.02em]">{name}</span>
              </>
            )}
            <span className="text-[#b9a8ff]">.</span>
          </p>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[10000]">
      {half(true)}
      {half(false)}
    </div>
  );
}
