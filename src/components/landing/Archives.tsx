"use client";

/*
  LAYOUT: Pinned horizontal gallery (lg+), vertical stack below lg.
  STICKY FRAME (h-screen): heading row (label · title · counter) → horizontal track of 5 cards → progress rail.
  CARD: 2 columns — LEFT: index, serif category name, verb, copy, status chips, data source.
                     RIGHT: fan of three covers that spreads on hover.
*/
import Image from "next/image";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, useMotionValueEvent, useScroll, useSpring, useTransform } from "framer-motion";
import { ARCHIVES, type ArchiveItem } from "./data";
import { MaskLine } from "./Motion";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

function useIsDesktop() {
  const [v, setV] = useState(false);
  useEffect(() => {
    const mq = globalThis.matchMedia("(min-width: 1024px)");
    const on = () => setV(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return v;
}

function ArchiveCard({ a }: { a: ArchiveItem }) {
  return (
    <article
      data-cursor="Arşiv"
      className="group relative grid h-full w-full shrink-0 grid-rows-[auto_1fr] overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--bg-card)] p-6 transition-colors duration-500 hover:border-[var(--text-faint)] sm:p-8 lg:w-[min(74vw,980px)] lg:grid-cols-[1fr_1.05fr] lg:grid-rows-1 lg:gap-10 lg:p-10"
    >
      <div className="relative z-10 flex flex-col">
        <div className="dn-mono flex items-center justify-between text-[10.5px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
          <span>
            <span className="text-[var(--gold)]">{a.index}</span> / 05
          </span>
          <span>Kaynak · {a.source}</span>
        </div>
        <h3 className="dn-display mt-6 text-[clamp(4.5rem,9vw,8.5rem)] italic leading-[0.85] tracking-[-0.03em] text-[var(--text-primary)]">
          {a.label}
        </h3>
        <p className="mt-2 text-lg font-semibold tracking-[-0.02em] text-[var(--text-secondary)]">
          — {a.verb}
        </p>
        <p className="mt-6 max-w-[380px] text-[15px] leading-relaxed text-[var(--text-secondary)]">
          {a.description}
        </p>
        <div className="mt-auto flex flex-wrap gap-2 pt-8">
          {a.statuses.map((s, i) => (
            <span
              key={s}
              className={`dn-mono rounded-full border px-3 py-1.5 text-[10.5px] uppercase tracking-[0.1em] ${
                i === 0
                  ? "border-[var(--gold)] bg-[var(--gold)] text-[var(--text-on-accent)]"
                  : "border-[var(--border)] text-[var(--text-muted)]"
              }`}
            >
              {s}
            </span>
          ))}
        </div>
      </div>

      <div className="relative mt-8 h-[300px] lg:mt-0 lg:h-auto">
        {a.images.map((img, i) => {
          const pos = [
            "left-[4%] top-[12%] -rotate-[7deg] group-hover:-translate-x-6 group-hover:-rotate-[12deg]",
            "left-[30%] top-[2%] rotate-[2deg] z-10 group-hover:-translate-y-3",
            "left-[56%] top-[16%] rotate-[9deg] group-hover:translate-x-6 group-hover:rotate-[14deg]",
          ][i];
          return (
            <figure
              key={img.src}
              className={`absolute w-[42%] transition-transform duration-700 ease-out-expo ${pos}`}
            >
              <div className="relative aspect-[2/3] overflow-hidden rounded-[14px] border border-[var(--border)] bg-[var(--bg-raised)] shadow-[0_30px_60px_-25px_rgb(var(--ink-rgb)/0.75)]">
                <Image
                  src={img.src}
                  alt={img.title}
                  fill
                  sizes="(min-width:1024px) 220px, 40vw"
                  className="object-cover"
                />
              </div>
              <figcaption className="mt-2 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                <span className="block truncate text-[12px] font-semibold text-[var(--text-primary)]">
                  {img.title}
                </span>
                <span className="dn-mono block truncate text-[10px] text-[var(--text-muted)]">
                  {img.meta}
                </span>
              </figcaption>
            </figure>
          );
        })}
      </div>
    </article>
  );
}

export function Archives() {
  const isDesktop = useIsDesktop();
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [distance, setDistance] = useState(0);
  const [active, setActive] = useState(1);

  useIsoLayoutEffect(() => {
    if (!isDesktop) return;
    const measure = () => {
      const track = trackRef.current;
      if (!track) return;
      setDistance(Math.max(0, track.scrollWidth - globalThis.innerWidth));
    };
    measure();
    globalThis.addEventListener("resize", measure);
    return () => globalThis.removeEventListener("resize", measure);
  }, [isDesktop]);

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
  const rawX = useTransform(scrollYProgress, [0, 1], [0, -distance]);
  const x = useSpring(rawX, { stiffness: 140, damping: 30, mass: 0.4 });
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setActive(Math.min(ARCHIVES.length, Math.max(1, Math.round(v * (ARCHIVES.length - 1)) + 1)));
  });

  const heading = (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-5 sm:px-10 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <span className="dn-mono text-[10.5px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
          <span className="text-[var(--gold)]">(03)</span> Beş Arşiv, Tek Defter
        </span>
        <h2 className="mt-4 text-[clamp(2.6rem,6vw,6rem)] font-extrabold leading-[0.92] tracking-[-0.05em] text-[var(--text-primary)]">
          <MaskLine>Her Türün</MaskLine>
          <MaskLine delay={0.08}>
            Kendi <span className="dn-display font-normal italic tracking-[-0.02em]">Rafı</span>{" "}
            Var.
          </MaskLine>
        </h2>
      </div>
      {isDesktop && (
        <div className="dn-mono flex items-baseline gap-2 text-[var(--text-muted)]">
          <span className="text-5xl font-medium tabular-nums tracking-tight text-[var(--text-primary)]">
            {String(active).padStart(2, "0")}
          </span>
          <span className="text-sm">/ 05</span>
        </div>
      )}
    </div>
  );

  if (!isDesktop) {
    return (
      <section id="arsivler" ref={sectionRef} className="relative scroll-mt-20 py-14">
        {heading}
        <div className="mt-8 flex flex-col gap-4 px-5 sm:px-10">
          {ARCHIVES.map((a) => (
            <ArchiveCard key={a.key} a={a} />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section
      id="arsivler"
      ref={sectionRef}
      className="relative"
      style={{ height: `calc(100vh + ${distance}px)` }}
    >
      <div className="sticky top-0 flex h-screen flex-col justify-center gap-8 overflow-hidden py-10">
        {heading}
        <motion.div
          ref={trackRef}
          className="flex h-[min(62vh,600px)] w-max gap-6 px-10"
          style={{ x }}
        >
          {ARCHIVES.map((a) => (
            <ArchiveCard key={a.key} a={a} />
          ))}
          <div className="flex w-[30vw] shrink-0 items-center justify-center">
            <p className="dn-display max-w-[320px] text-4xl italic leading-tight text-[var(--text-muted)]">
              …ve <span className="text-[var(--text-primary)]">Diğer</span>: Kategorisi Olmayan Her
              Şey İçin.
            </p>
          </div>
        </motion.div>
        <div className="mx-auto h-px w-full max-w-[1600px] px-10">
          <div className="relative h-px w-full bg-[var(--border)]">
            <motion.div
              className="absolute inset-y-0 left-0 w-full origin-left bg-[var(--gold)]"
              style={{ scaleX: scrollYProgress }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
