"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { LuShield, LuHeart, LuGlobe, LuClock, LuLock, LuSmartphone } from "react-icons/lu";

const REASONS = [
  {
    Icon: LuHeart,
    title: "Tamamen Ücretsiz",
    desc: "Reklam yok, gizli ücret yok. Tüm özellikler herkese açık.",
    accent: "#c4a24b",
    accentBg: "rgba(196,162,75,0.08)",
  },
  {
    Icon: LuGlobe,
    title: "Her Şey Tek Yerde",
    desc: "Film, dizi, oyun, kitap ve gezi — ayrı ayrı uygulama kullanmana gerek yok.",
    accent: "#6888c0",
    accentBg: "rgba(104,136,192,0.08)",
  },
  {
    Icon: LuClock,
    title: "Anında Başla",
    desc: "Kayıt ol, kategorini seç, notunu yaz. Beş dakikada hazırsın.",
    accent: "#60a88a",
    accentBg: "rgba(96,168,138,0.08)",
  },
  {
    Icon: LuSmartphone,
    title: "Her Cihazdan Eriş",
    desc: "Mobil ve masaüstünde aynı deneyim. Nerede olursan ol notların yanında.",
    accent: "#818cf8",
    accentBg: "rgba(129,140,248,0.08)",
  },
  {
    Icon: LuShield,
    title: "Verini Sen Kontrol Et",
    desc: "Notların sadece sana ait. İstediğin zaman düzenle, sil veya paylaş.",
    accent: "#c8b090",
    accentBg: "rgba(200,176,144,0.08)",
  },
  {
    Icon: LuLock,
    title: "Gizlilik Öncelikli",
    desc: "Verilerini üçüncü taraflarla paylaşmıyoruz. Basit ve güvenli.",
    accent: "#60a88a",
    accentBg: "rgba(96,168,138,0.08)",
  },
] as const;

export function TestimonialsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section
      ref={sectionRef}
      className="relative mx-auto w-full max-w-5xl px-3 pb-16 pt-6 sm:px-6 sm:pb-24 sm:pt-12"
    >
      {/* Section divider */}
      <motion.div
        className="absolute left-1/2 top-0 h-px w-0 -translate-x-1/2"
        animate={isInView ? { width: "66%" } : {}}
        transition={{ duration: 1, ease: [0.16, 0.8, 0.24, 1] }}
        style={{
          background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.2), transparent)",
        }}
      />

      {/* Heading */}
      <motion.div
        className="mb-10 text-center sm:mb-14"
        initial={{ opacity: 0, y: 28, filter: "blur(10px)" }}
        animate={isInView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
        transition={{ duration: 0.8, ease: [0.16, 0.8, 0.24, 1] }}
      >
        <div className="mb-4 flex items-center justify-center sm:mb-5">
          <motion.div
            className="flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] sm:text-xs"
            style={{
              borderColor: "rgba(196,162,75,0.2)",
              background: "rgba(196,162,75,0.06)",
              color: "var(--gold)",
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <LuShield size={12} />
            Avantajlar
          </motion.div>
        </div>
        <motion.h2
          className="mb-3 text-[1.35rem] font-black text-[var(--text-primary)] sm:mb-4 sm:text-4xl xl:text-5xl"
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          Neden{" "}
          <span
            className="dn-shimmer-text"
            style={{
              background: "linear-gradient(90deg, #fff8c8, #e8b820, #f8d840, #c6972e, #fff8c8)",
              backgroundSize: "200% 100%",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            DigyNotes?
          </span>
        </motion.h2>
        <motion.p
          className="mx-auto max-w-lg text-[13px] font-medium text-[var(--text-secondary)] sm:text-base"
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Notlarını tutmak için ihtiyacın olan her şey, fazlası değil.
        </motion.p>
      </motion.div>

      {/* Cards grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5">
        {REASONS.map((r, i) => (
          <motion.div
            key={r.title}
            className="group relative rounded-xl border border-[var(--border)] p-4 sm:rounded-2xl sm:p-6"
            style={{
              background: "color-mix(in srgb, var(--bg-card) 85%, transparent)",
            }}
            initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{
              duration: 0.6,
              delay: 0.1 + i * 0.08,
              ease: [0.16, 0.8, 0.24, 1],
            }}
            whileHover={{
              y: -4,
              borderColor: `${r.accent}40`,
              transition: { duration: 0.2 },
            }}
          >
            {/* Icon */}
            <div
              className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg sm:mb-4 sm:h-11 sm:w-11 sm:rounded-xl"
              style={{
                background: r.accentBg,
                border: `1px solid ${r.accent}25`,
              }}
            >
              <r.Icon size={18} style={{ color: r.accent }} />
            </div>

            {/* Text */}
            <h3 className="mb-1 text-[13px] font-bold text-[var(--text-primary)] sm:mb-2 sm:text-base">
              {r.title}
            </h3>
            <p className="text-[11px] leading-[1.7] text-[var(--text-secondary)] sm:text-[13px] sm:leading-[1.75]">
              {r.desc}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
