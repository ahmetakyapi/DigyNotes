"use client";

import { EASE } from "@/lib/variants";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ShieldIcon, HeartIcon, GlobeIcon, ClockIcon, LockIcon, DeviceMobileIcon } from "@phosphor-icons/react";

const REASONS = [
  {
    Icon: HeartIcon,
    title: "Tamamen Ücretsiz",
    desc: "Reklam yok, gizli ücret yok. Tüm özellikler herkese açık.",
    accent: "#10b981",
    accentBg: "rgba(16,185,129,0.08)",
  },
  {
    Icon: GlobeIcon,
    title: "Her Şey Tek Yerde",
    desc: "Film, dizi, oyun, kitap ve gezi — ayrı ayrı uygulama kullanmana gerek yok.",
    accent: "#6888c0",
    accentBg: "rgba(14,165,233,0.08)",
  },
  {
    Icon: ClockIcon,
    title: "Anında Başla",
    desc: "Kayıt ol, kategorini seç, notunu yaz. Beş dakikada hazırsın.",
    accent: "#0ea5e9",
    accentBg: "rgba(14,165,233,0.08)",
  },
  {
    Icon: DeviceMobileIcon,
    title: "Her Cihazdan Eriş",
    desc: "Mobil ve masaüstünde aynı deneyim. Nerede olursan ol notların yanında.",
    accent: "#6888c0",
    accentBg: "rgba(14,165,233,0.08)",
  },
  {
    Icon: ShieldIcon,
    title: "Verini Sen Kontrol Et",
    desc: "Notların sadece sana ait. İstediğin zaman düzenle, sil veya paylaş.",
    accent: "#f59e0b",
    accentBg: "rgba(245,158,11,0.08)",
  },
  {
    Icon: LockIcon,
    title: "Gizlilik Öncelikli",
    desc: "Verilerini üçüncü taraflarla paylaşmıyoruz. Basit ve güvenli.",
    accent: "#10b981",
    accentBg: "rgba(16,185,129,0.08)",
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
        transition={{ duration: 1, ease: EASE }}
        style={{
          background: "linear-gradient(90deg, transparent, rgba(16,185,129,0.2), transparent)",
        }}
      />

      {/* Heading */}
      <motion.div
        className="mb-10 text-center sm:mb-14"
        initial={{ opacity: 0, y: 28, filter: "blur(10px)" }}
        animate={isInView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
        transition={{ duration: 0.8, ease: EASE }}
      >
        <div className="mb-4 flex items-center justify-center sm:mb-5">
          <motion.div
            className="chip"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <ShieldIcon size={12} />
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
              background: "linear-gradient(90deg, #a7f3d0, #10b981, #059669, #34d399, #a7f3d0)",
              backgroundSize: "200% 100%",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            DigyNotes?
          </span>
        </motion.h2>
        <motion.p
          className="mx-auto max-w-lg text-[14px] font-medium text-[var(--text-secondary)] sm:text-base"
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
            className="dn-landing-card group relative rounded-xl border border-[var(--border)] p-4 sm:rounded-2xl sm:p-6"
            style={{
              background: "color-mix(in srgb, var(--bg-card) 85%, transparent)",
            }}
            initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{
              duration: 0.6,
              delay: 0.1 + i * 0.08,
              ease: EASE,
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
            <h3 className="mb-1 text-[14px] font-bold text-[var(--text-primary)] sm:mb-2 sm:text-base">
              {r.title}
            </h3>
            <p className="text-[12px] leading-[1.72] text-[var(--text-secondary)] sm:text-[13px] sm:leading-[1.75]">
              {r.desc}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
