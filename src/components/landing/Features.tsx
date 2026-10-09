"use client";

/*
  LAYOUT: Section heading, then a 6-col bento (stacks to 1 col on mobile).
  ROW 1: Rating playground (4) · Auto-fill search (2)
  ROW 2: Follow & feed (2) · Collections fan (2) · Travel map (2)
  ROW 3: Year-in-review strip (6) — animated bars + big counters
  Each tile: mono index, title with a serif-italic accent word, live mini-visual.
*/
import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { MEDIA } from "./data";
import { EASE_OUT_EXPO, FadeUp, MaskLine } from "./Motion";

function Tile({
  index,
  title,
  children,
  className = "",
  cursor,
}: {
  index: string;
  title: ReactNode;
  children: ReactNode;
  className?: string;
  cursor?: string;
}) {
  return (
    <FadeUp className={className}>
      <div
        data-cursor={cursor}
        className="group relative flex h-full flex-col overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--bg-card)] p-6 transition-colors duration-500 hover:border-[var(--text-faint)] sm:p-8"
      >
        <div className="dn-mono text-[10.5px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
          <span className="text-[var(--gold)]">{index}</span>
        </div>
        <h3 className="mt-3 text-2xl font-bold leading-[1.05] tracking-[-0.035em] text-[var(--text-primary)] sm:text-[28px]">
          {title}
        </h3>
        <div className="relative mt-5 flex-1">{children}</div>
      </div>
    </FadeUp>
  );
}

const em = (s: string) => (
  <span className="dn-display font-normal italic tracking-[-0.01em]">{s}</span>
);

/* A — rating playground */
function RatingPlayground() {
  const [value, setValue] = useState(4.5);
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover ?? value;
  const ref = useRef<HTMLDivElement>(null);
  const pick = (clientX: number) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return 0;
    const raw = ((clientX - r.left) / r.width) * 5;
    return Math.min(5, Math.max(0.5, Math.ceil(raw * 2) / 2));
  };
  return (
    <div className="flex h-full flex-col justify-between gap-8 md:flex-row md:items-end">
      <div>
        <div
          ref={ref}
          role="slider"
          tabIndex={0}
          aria-label="Örnek puan"
          aria-valuemin={0.5}
          aria-valuemax={5}
          aria-valuenow={value}
          className="flex cursor-pointer gap-1.5 outline-none"
          onPointerMove={(e) => setHover(pick(e.clientX))}
          onPointerLeave={() => setHover(null)}
          onClick={(e) => setValue(pick(e.clientX))}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") setValue((v) => Math.min(5, v + 0.5));
            if (e.key === "ArrowLeft") setValue((v) => Math.max(0.5, v - 0.5));
          }}
        >
          {[1, 2, 3, 4, 5].map((n) => {
            const fill = shown >= n ? 100 : shown >= n - 0.5 ? 50 : 0;
            return (
              <svg key={n} viewBox="0 0 24 24" className="h-12 w-12 sm:h-16 sm:w-16" aria-hidden>
                <defs>
                  <linearGradient id={`rp-${n}`}>
                    <stop offset={`${fill}%`} stopColor="var(--gold)" />
                    <stop offset={`${fill}%`} stopColor="transparent" />
                  </linearGradient>
                </defs>
                <path
                  fill={`url(#rp-${n})`}
                  stroke={fill ? "var(--gold)" : "var(--text-faint)"}
                  strokeWidth="1"
                  className="transition-[stroke] duration-200"
                  d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z"
                />
              </svg>
            );
          })}
        </div>
        <p className="mt-4 max-w-[360px] text-sm leading-relaxed text-[var(--text-secondary)]">
          Dene: yıldızların üzerine gel ve tıkla. Bazen dört az, beş fazla gelir; o yüzden yarım
          puan da verebilirsin.
        </p>
      </div>
      <div className="text-right">
        <span className="dn-display block text-[clamp(6rem,14vw,11rem)] italic tabular-nums leading-[0.8] tracking-[-0.04em] text-[var(--text-primary)]">
          {shown.toFixed(1)}
        </span>
        <span className="dn-mono text-[10.5px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
          / 5 — Senin Puanın
        </span>
      </div>
    </div>
  );
}

/* B — auto-fill search typing */
const SEARCHES = [
  { q: "Perfect Days", src: `${MEDIA}/perfect-days.webp`, meta: "Film · Wim Wenders · 2023" },
  { q: "Elden Ring", src: `${MEDIA}/elden-ring.webp`, meta: "Oyun · FromSoftware · 2022" },
  {
    q: "Kürk Mantolu",
    src: `${MEDIA}/kurk-mantolu-madonna.webp`,
    meta: "Kitap · Sabahattin Ali · 1943",
  },
];
function SearchTyping() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-20% 0px" });
  const reduce = useReducedMotion();
  const [idx, setIdx] = useState(0);
  const [len, setLen] = useState(reduce ? SEARCHES[0].q.length : 0);
  useEffect(() => {
    if (!inView || reduce) return;
    const target = SEARCHES[idx].q;
    if (len < target.length) {
      const t = setTimeout(() => setLen((l) => l + 1), 85);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setLen(0);
      setIdx((i) => (i + 1) % SEARCHES.length);
    }, 2200);
    return () => clearTimeout(t);
  }, [inView, len, idx, reduce]);
  const s = SEARCHES[idx];
  const done = len >= s.q.length;
  return (
    <div ref={ref} className="flex h-full flex-col gap-3">
      <div className="flex items-center gap-3 rounded-full border border-[var(--border)] bg-[var(--bg-base)] px-4 py-3">
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4 fill-none stroke-[var(--text-muted)]"
          strokeWidth="2"
          aria-hidden
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <span className="text-[15px] text-[var(--text-primary)]">
          {s.q.slice(0, len)}
          <span className="ml-px inline-block h-[1.05em] w-[2px] translate-y-[3px] animate-pulse bg-[var(--gold)]" />
        </span>
      </div>
      <div className="relative h-[92px]">
        <AnimatePresence mode="wait">
          {done && (
            <motion.div
              key={s.q}
              initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
              className="absolute inset-0 flex items-center gap-3 rounded-[18px] border border-[var(--border)] bg-[var(--bg-raised)] p-2.5"
            >
              <div className="relative h-full w-[50px] shrink-0 overflow-hidden rounded-lg">
                <Image src={s.src} alt="" fill sizes="60px" className="object-cover" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{s.q}</p>
                <p className="dn-mono truncate text-[10px] text-[var(--text-muted)]">{s.meta}</p>
              </div>
              <span className="dn-mono ml-auto shrink-0 rounded-full bg-[var(--gold)] px-2.5 py-1 text-[9.5px] uppercase text-[var(--text-on-accent)]">
                Seç
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <p className="mt-auto text-sm leading-relaxed text-[var(--text-secondary)]">
        Adını yazman yeter; kapağı, yılı ve diğer bilgileri biz buluruz.
      </p>
    </div>
  );
}

/* C — follow & feed */
function FeedVisual() {
  const people = [
    { n: "Elif", c: "bg-[#ffb088]", t: "Aftersun'a 5 yıldız verdi" },
    { n: "Can", c: "bg-[#b9a8ff]", t: "Outer Wilds notunu yazdı" },
    { n: "Deniz", c: "bg-[#ff8a65]", t: "Kyoto'yu haritaya ekledi" },
  ];
  return (
    <div className="flex h-full flex-col gap-2.5">
      {people.map((p, i) => (
        <motion.div
          key={p.n}
          initial={{ opacity: 0, x: -16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15 * i, duration: 0.7, ease: EASE_OUT_EXPO }}
          className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-base)] px-3 py-2.5"
        >
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-[#0b0b0a] ${p.c}`}
          >
            {p.n[0]}
          </span>
          <span className="truncate text-[13px] text-[var(--text-secondary)]">
            <span className="font-semibold text-[var(--text-primary)]">{p.n}</span> {p.t}
          </span>
        </motion.div>
      ))}
      <p className="mt-auto pt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
        Zevkine güvendiğin kişileri takip et, ne izleyip ne okuduklarını gör.
      </p>
    </div>
  );
}

/* D — collections fan */
function CollectionFan() {
  const imgs = [`${MEDIA}/shogun.webp`, `${MEDIA}/perfect-days.webp`, `${MEDIA}/kyoto.webp`];
  return (
    <div className="flex h-full flex-col">
      <div className="relative mx-auto h-[170px] w-full max-w-[240px]">
        {imgs.map((src, i) => (
          <div
            key={src}
            className={`absolute top-3 w-[92px] transition-transform duration-700 ease-out-expo ${
              [
                "left-[6%] -rotate-[10deg] group-hover:-translate-x-3 group-hover:-rotate-[16deg]",
                "left-1/2 z-10 -translate-x-1/2 group-hover:-translate-y-3",
                "right-[6%] rotate-[10deg] group-hover:translate-x-3 group-hover:rotate-[16deg]",
              ][i]
            }`}
          >
            <div className="relative aspect-[2/3] overflow-hidden rounded-xl border border-[var(--border)] shadow-[0_20px_40px_-20px_rgb(var(--ink-rgb)/0.8)]">
              <Image src={src} alt="" fill sizes="100px" className="object-cover" />
            </div>
          </div>
        ))}
      </div>
      <p className="dn-mono mt-2 text-center text-[10.5px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
        Japonya Dosyası · 3 Not
      </p>
      <p className="mt-auto pt-4 text-sm leading-relaxed text-[var(--text-secondary)]">
        Bir filmi, bir diziyi ve bir şehri aynı listede topla. Mesela “Japonya” diye bir koleksiyon
        aç.
      </p>
    </div>
  );
}

/* E — travel pins */
function TravelMap() {
  const dots: [number, number][] = [];
  for (let y = 0; y < 9; y++) for (let x = 0; x < 18; x++) dots.push([x, y]);
  const pins = [
    { x: 9.5, y: 3.6, l: "Kapadokya" },
    { x: 16.2, y: 3.9, l: "Kyoto" },
    { x: 4.6, y: 3.4, l: "Lizbon" },
  ];
  return (
    <div className="flex h-full flex-col">
      <svg viewBox="0 0 180 90" className="w-full" aria-hidden>
        {dots.map(([x, y]) => (
          <circle
            key={`${x}-${y}`}
            cx={x * 10 + 5}
            cy={y * 10 + 5}
            r="1.1"
            fill="var(--text-faint)"
          />
        ))}
        {pins.map((p, i) => (
          <g key={p.l}>
            <circle cx={p.x * 10} cy={p.y * 10} r="7" fill="var(--gold)" opacity="0.18">
              <animate
                attributeName="r"
                values="4;10;4"
                dur="2.4s"
                begin={`${i * 0.6}s`}
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0.35;0;0.35"
                dur="2.4s"
                begin={`${i * 0.6}s`}
                repeatCount="indefinite"
              />
            </circle>
            <circle cx={p.x * 10} cy={p.y * 10} r="3" fill="var(--gold)" />
            <text
              x={p.x > 14 ? p.x * 10 - 6 : p.x * 10 + 6}
              y={p.y * 10 - 5}
              textAnchor={p.x > 14 ? "end" : "start"}
              fontSize="6"
              fill="var(--text-secondary)"
              fontFamily="var(--font-mono)"
            >
              {p.l}
            </text>
          </g>
        ))}
      </svg>
      <p className="mt-auto pt-4 text-sm leading-relaxed text-[var(--text-secondary)]">
        Gezi notların haritada görünür. Nereye gittiğini, orada ne hissettiğini unutmazsın.
      </p>
    </div>
  );
}

/* F — year in review */
function YearStrip() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15% 0px" });
  const months = ["O", "Ş", "M", "N", "M", "H", "T", "A", "E", "E", "K", "A"];
  const vals = [3, 5, 4, 7, 6, 9, 12, 8, 6, 10, 7, 11];
  return (
    <div ref={ref} className="grid h-full gap-8 md:grid-cols-[1fr_auto] md:items-end">
      <div className="flex h-[150px] items-end gap-1.5 sm:gap-2.5">
        {vals.map((v, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-2">
            <motion.div
              className={`w-full rounded-t-md ${i === 6 ? "bg-[var(--gold)]" : "bg-[var(--bg-raised)]"}`}
              initial={{ height: 0 }}
              animate={inView ? { height: `${(v / 12) * 120}px` } : undefined}
              transition={{ duration: 1.1, ease: EASE_OUT_EXPO, delay: i * 0.05 }}
            />
            <span className="dn-mono text-[9.5px] text-[var(--text-muted)]">{months[i]}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-6 md:gap-10">
        {[
          ["88", "Not"],
          ["4.3", "Ort. Puan"],
          ["Tem", "En Dolu Ay"],
        ].map(([n, l]) => (
          <div key={l}>
            <span className="dn-display block text-5xl italic leading-none text-[var(--text-primary)] sm:text-6xl">
              {n}
            </span>
            <span className="dn-mono text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
              {l}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Features() {
  return (
    <section
      id="ozellikler"
      className="mx-auto max-w-[1600px] scroll-mt-20 px-5 py-16 sm:px-10 md:py-24"
    >
      <span className="dn-mono text-[10.5px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
        <span className="text-[var(--gold)]">(05)</span> Özellikler
      </span>
      <h2 className="mt-4 text-[clamp(2.6rem,6vw,6rem)] font-extrabold leading-[0.92] tracking-[-0.035em] text-[var(--text-primary)]">
        <MaskLine>
          Küçük Ayrıntılar,{" "}
          <span className="dn-display font-normal italic tracking-[-0.02em]">Büyük Fark.</span>
        </MaskLine>
      </h2>

      <div className="mt-10 grid gap-3 md:grid-cols-6 md:gap-4">
        <Tile
          index="A — Puan"
          title={<>Yarım Yıldız {em("Bile")} Önemli.</>}
          className="md:col-span-4"
          cursor="Dene"
        >
          <RatingPlayground />
        </Tile>
        <Tile
          index="B — Otomatik"
          title={<>Adını Yaz, {em("Gerisi")} Gelsin.</>}
          className="md:col-span-2"
        >
          <SearchTyping />
        </Tile>
        <Tile
          index="C — Sosyal"
          title={<>Arkadaşlarını {em("Takip")} Et.</>}
          className="md:col-span-2"
        >
          <FeedVisual />
        </Tile>
        <Tile
          index="D — Koleksiyon"
          title={<>Kendi {em("Listelerini")} Oluştur.</>}
          className="md:col-span-2"
        >
          <CollectionFan />
        </Tile>
        <Tile index="E — Harita" title={<>Gezilerin {em("Haritada.")}</>} className="md:col-span-2">
          <TravelMap />
        </Tile>
        <Tile
          index="F — Yıl Özeti"
          title={<>Yılın {em("Özeti,")} Tek Ekranda.</>}
          className="md:col-span-6"
        >
          <YearStrip />
        </Tile>
      </div>
    </section>
  );
}
