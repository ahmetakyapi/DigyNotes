"use client";

/*
  LAYOUT: Section title row, then a large app mock in perspective.
  The mock starts tilted (rotateX) and scaled down, flattens to 1:1 as it scrolls into place.
  MOCK: browser chrome → app header (wordmark, numbered tabs) → hero note card + 2×3 grid of note rows.
  Annotation pills with hairline leaders float around the mock on lg+.
*/
import Image from "next/image";
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { Wordmark } from "@/components/Wordmark";
import { MEDIA } from "./data";
import { FadeUp, MaskLine } from "./Motion";

const ROWS = [
  {
    src: `${MEDIA}/past-lives.webp`,
    title: "Past Lives",
    meta: "Celine Song · 2023",
    cat: "Film",
    status: "İzlendi",
    r: 4.5,
  },
  {
    src: `${MEDIA}/severance.webp`,
    title: "Severance",
    meta: "Dan Erickson · 2022–",
    cat: "Dizi",
    status: "İzleniyor",
    r: 5,
  },
  {
    src: `${MEDIA}/disco-elysium.webp`,
    title: "Disco Elysium",
    meta: "ZA/UM · 2019",
    cat: "Oyun",
    status: "Oynanıyor",
    r: 5,
  },
  {
    src: `${MEDIA}/stoner.webp`,
    title: "Stoner",
    meta: "John Williams · 1965",
    cat: "Kitap",
    status: "Okunuyor",
    r: 5,
  },
  {
    src: `${MEDIA}/dune-part-two.webp`,
    title: "Dune: Part Two",
    meta: "D. Villeneuve · 2024",
    cat: "Film",
    status: "İzlendi",
    r: 4.5,
  },
  {
    src: `${MEDIA}/kapadokya.webp`,
    title: "Kapadokya",
    meta: "Nevşehir · 2025",
    cat: "Gezi",
    status: "Gidildi",
    r: 5,
  },
];

export function Stars({ value, size = 10 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex gap-[2px]" aria-label={`${value} / 5`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const fill = value >= n ? 1 : value >= n - 0.5 ? 0.5 : 0;
        return (
          <svg key={n} viewBox="0 0 24 24" width={size} height={size} aria-hidden>
            <defs>
              <linearGradient id={`s-${n}-${fill}`}>
                <stop offset={`${fill * 100}%`} stopColor="var(--gold)" />
                <stop offset={`${fill * 100}%`} stopColor="var(--border)" />
              </linearGradient>
            </defs>
            <path
              fill={`url(#s-${n}-${fill})`}
              d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z"
            />
          </svg>
        );
      })}
    </span>
  );
}

function AppMock() {
  return (
    <div className="overflow-hidden rounded-[22px] border border-[var(--border)] bg-[var(--bg-base)] shadow-[var(--shadow-deep)]">
      {/* chrome */}
      <div className="flex items-center gap-2 border-b border-[var(--border)] bg-[var(--bg-card)] px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-[var(--border)]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[var(--border)]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[var(--border)]" />
        <span className="dn-mono mx-auto rounded-full border border-[var(--border)] px-4 py-1 text-[10px] text-[var(--text-muted)]">
          digynotes.app/notes
        </span>
      </div>
      {/* app header */}
      <div className="border-b border-[var(--border)] px-5 pt-4 sm:px-8">
        <div className="flex items-center justify-between">
          <Wordmark size="sm" />
          <div className="flex items-center gap-2">
            <span className="hidden h-7 w-40 rounded-full border border-[var(--border)] sm:block" />
            <span className="rounded-full bg-[var(--gold)] px-3 py-1 text-[11px] font-semibold text-[var(--text-on-accent)]">
              + Yeni Not
            </span>
            <span className="h-7 w-7 rounded-full bg-[var(--bg-raised)] ring-1 ring-[var(--border)]" />
          </div>
        </div>
        <div className="mt-4 flex gap-5 overflow-hidden text-[11px] font-medium text-[var(--text-muted)]">
          {["Son Notlar", "Film", "Dizi", "Oyun", "Kitap", "Gezi"].map((t, i) => (
            <span
              key={t}
              className={`relative flex shrink-0 items-baseline gap-1 pb-2.5 ${i === 0 ? "text-[var(--text-primary)]" : ""}`}
            >
              <span
                className={`dn-mono text-[8px] ${i === 0 ? "text-[var(--gold)]" : "text-[var(--text-faint)]"}`}
              >
                0{i}
              </span>
              {t}
              {i === 0 && (
                <span className="absolute inset-x-0 bottom-0 h-[2px] rounded-full bg-[var(--gold)]" />
              )}
            </span>
          ))}
        </div>
      </div>
      {/* body */}
      <div className="grid gap-4 p-5 sm:p-8 md:grid-cols-[1.15fr_1fr]">
        <div className="relative min-h-[260px] overflow-hidden rounded-[18px] border border-[var(--border)] md:min-h-[360px]">
          <Image
            src={`${MEDIA}/perfect-days.webp`}
            alt=""
            fill
            sizes="600px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[rgb(var(--ink-rgb)/0.95)] via-[rgb(var(--ink-rgb)/0.35)] to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5">
            <div className="dn-mono flex gap-2 text-[9px] uppercase tracking-[0.12em]">
              <span className="rounded-full bg-[#b9a8ff] px-2 py-0.5 text-[#0b0b0a]">
                Öne Çıkan
              </span>
              <span className="rounded-full border border-white/25 px-2 py-0.5 text-white/80">
                Film · 2023
              </span>
            </div>
            <p className="dn-display mt-3 text-4xl italic leading-none text-[#fbf9f4]">
              Perfect Days
            </p>
            <p className="mt-1 text-[12px] text-white/60">Wim Wenders</p>
            <div className="mt-3">
              <Stars value={5} size={12} />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-2.5">
          {ROWS.slice(0, 5).map((r) => (
            <div
              key={r.title}
              className="flex items-center gap-3 rounded-[14px] border border-[var(--border)] bg-[var(--bg-card)] p-2.5"
            >
              <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded-md">
                <Image src={r.src} alt="" fill sizes="60px" className="object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="dn-mono flex items-center gap-2 text-[8.5px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                  <span className="text-[var(--gold)]">{r.cat}</span>
                  <span>{r.status}</span>
                </div>
                <p className="truncate text-[13px] font-semibold text-[var(--text-primary)]">
                  {r.title}
                </p>
                <p className="truncate text-[10.5px] text-[var(--text-muted)]">{r.meta}</p>
              </div>
              <Stars value={r.r} size={9} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const NOTES = [
  { label: "Kapak ve Bilgiler Otomatik", cls: "left-[-3%] top-[24%]" },
  { label: "Yarım Puan Verebilirsin", cls: "right-[-2%] top-[38%]" },
  { label: "Durum: İzlendi / İzlenecek", cls: "left-[2%] bottom-[10%]" },
];

export function Showcase() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const rotateX = useTransform(scrollYProgress, [0, 1], [28, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.82, 1]);
  const y = useTransform(scrollYProgress, [0, 1], [120, 0]);

  return (
    <section id="vitrin" ref={ref} className="relative scroll-mt-20 px-5 py-16 sm:px-10 md:py-24">
      <div className="mx-auto max-w-[1600px]">
        <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <span className="dn-mono text-[10.5px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
              <span className="text-[var(--gold)]">(04)</span> Uygulamadan Bir Kare
            </span>
            <h2 className="mt-4 text-[clamp(2.6rem,6vw,6rem)] font-extrabold leading-[0.92] tracking-[-0.05em] text-[var(--text-primary)]">
              <MaskLine>Tüm Notların,</MaskLine>
              <MaskLine delay={0.08}>
                <span className="dn-display font-normal italic tracking-[-0.02em]">
                  Tek Bakışta.
                </span>
              </MaskLine>
            </h2>
          </div>
          <FadeUp className="max-w-[360px] text-[15px] leading-relaxed text-[var(--text-secondary)]">
            Her not bir afiş, bir puan ve birkaç cümleden oluşur. En son eklediğin en üstte durur,
            gerisi düzenli bir liste halinde sıralanır. İstediğini sabitle, istediğini arşive
            kaldır.
          </FadeUp>
        </div>

        <div className="relative mt-10 [perspective:1800px] md:mt-14">
          <motion.div
            style={reduce ? undefined : { rotateX, scale, y, transformOrigin: "50% 0%" }}
            className="relative mx-auto max-w-[1180px]"
          >
            <AppMock />
            {NOTES.map((n, i) => (
              <FadeUp
                key={n.label}
                delay={0.3 + i * 0.12}
                className={`absolute z-10 hidden lg:block ${n.cls}`}
              >
                <span className="dn-mono inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--header-glass)] px-3.5 py-2 text-[10.5px] uppercase tracking-[0.1em] text-[var(--text-primary)] backdrop-blur-xl">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                  {n.label}
                </span>
              </FadeUp>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
