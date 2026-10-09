"use client";

/*
  LAYOUT: Two-column on desktop.
  LEFT (narrow): mono section label + small caption.
  RIGHT: oversized paragraph; each word brightens as the section scrolls through the viewport.
  Words wrapped in *…* render in serif italic, _…_ in the accent colour.
*/
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion";

const TEXT =
  "İzlediğin bir *film,* bitirdiğin bir *kitap,* gezdiğin bir *şehir…* Hepsi sende bir iz bırakır. Ama zamanla yenileri gelir, eskiler unutulur. _DigyNotes,_ bu izleri kendi cümlelerinle saklayabilmen için var.";

function Word({
  word,
  progress,
  range,
}: {
  word: string;
  progress: MotionValue<number>;
  range: [number, number];
}) {
  const opacity = useTransform(progress, range, [0.32, 1]);
  const italic = word.startsWith("*");
  const accent = word.startsWith("_");
  const clean = word.replace(/[*_]/g, "");
  return (
    <motion.span
      style={{ opacity }}
      className={`mr-[0.24em] inline-block ${
        italic ? "dn-display italic tracking-[-0.01em]" : ""
      } ${accent ? "text-[var(--gold)]" : ""}`}
    >
      {clean}
    </motion.span>
  );
}

export function Manifesto() {
  const ref = useRef<HTMLParagraphElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.9", "end 0.7"] });
  const words = TEXT.split(" ");

  return (
    <section className="mx-auto grid max-w-[1600px] gap-6 px-5 py-16 sm:px-10 md:grid-cols-[minmax(180px,1fr)_3fr] md:py-24">
      <div className="flex flex-col gap-3">
        <span className="dn-eyebrow">
          <span className="text-[var(--gold)]">(02)</span> Neden DigyNotes?
        </span>
        <span className="hidden max-w-[220px] text-[14px] leading-relaxed text-[var(--text-muted)] md:block">
          Bir puan, birkaç etiket, iki cümle. Unutmamak için bu kadarı yeter.
        </span>
      </div>
      <p
        ref={ref}
        className="text-[clamp(1.65rem,4vw,3.9rem)] font-semibold leading-[1.16] tracking-[-0.03em] text-[var(--text-primary)]"
      >
        {reduce
          ? TEXT.replace(/[*_]/g, "")
          : words.map((w, i) => {
              const start = i / words.length;
              return (
                <Word
                  key={`${w}-${i}`}
                  word={w}
                  progress={scrollYProgress}
                  range={[start, start + 1 / words.length]}
                />
              );
            })}
      </p>
    </section>
  );
}
