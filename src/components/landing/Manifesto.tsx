"use client";

/*
  LAYOUT: Single column.
  One oversized paragraph (no section label); each word brightens as the section scrolls through the viewport.
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
    <section className="mx-auto max-w-[1600px] px-5 py-16 sm:px-10 md:py-24">
      <p
        ref={ref}
        className="max-w-[1180px] text-[clamp(1.65rem,4vw,3.9rem)] font-semibold leading-[1.16] tracking-[-0.03em] text-[var(--text-primary)]"
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
