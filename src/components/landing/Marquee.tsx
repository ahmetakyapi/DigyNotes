"use client";

/*
  LAYOUT: Two full-bleed ticker rows between hairlines, running in opposite directions.
  The drift is a CSS keyframe on transform (compositor-only, zero JS per frame);
  scroll velocity only adds a skew, which settles to 0 when the page is still.
*/
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from "framer-motion";

/* 4 copies, loop over one copy (25%). ~11.4s per copy ≈ the old 2.2%/s drift. */
function Row({ children, reverse = false }: { children: React.ReactNode; reverse?: boolean }) {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, { damping: 50, stiffness: 400 });
  const skew = useTransform(smoothVelocity, [-2000, 2000], [8, -8]);

  return (
    <div className="flex overflow-hidden whitespace-nowrap">
      <motion.div className="flex" style={{ skewX: reduce ? 0 : skew }}>
        <div className={`dn-marquee-track flex flex-nowrap ${reverse ? "dn-marquee-reverse" : ""}`}>
          {[0, 1, 2, 3].map((k) => (
            <span key={k} className="flex shrink-0 items-center" aria-hidden={k > 0}>
              {children}
            </span>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

const WORDS = ["Film", "Dizi", "Oyun", "Kitap", "Gezi"];

function Star() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="mx-[0.35em] h-[0.42em] w-[0.42em] shrink-0 fill-[var(--gold)]"
      aria-hidden
    >
      <path d="M12 0c.6 6.4 5 11 12 12-7 1-11.4 5.6-12 12-.6-6.4-5-11-12-12 7-1 11.4-5.6 12-12Z" />
    </svg>
  );
}

export function Marquee() {
  return (
    <section
      aria-label="Arşiv türleri"
      className="relative border-y border-[var(--border)] py-4 sm:py-6"
    >
      <Row>
        {WORDS.map((w) => (
          <span
            key={w}
            className="flex items-center text-[clamp(3.5rem,11vw,10rem)] font-extrabold leading-[1] tracking-[-0.035em] text-[var(--text-primary)]"
          >
            {w}
            <Star />
          </span>
        ))}
      </Row>
      <Row reverse>
        {["İzle", "Oku", "Oyna", "Gez", "Yaz"].map((w) => (
          <span
            key={w}
            className="dn-display flex items-center px-[0.2em] text-[clamp(3.5rem,11vw,10rem)] italic leading-[1.05] tracking-[-0.03em] text-transparent [-webkit-text-stroke:1px_var(--text-muted)]"
          >
            {w}
            <span className="mx-[0.3em] not-italic text-[var(--text-faint)] [-webkit-text-stroke:0]">
              /
            </span>
          </span>
        ))}
      </Row>
    </section>
  );
}
