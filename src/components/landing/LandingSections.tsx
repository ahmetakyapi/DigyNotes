"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import Link from "next/link";
import { useTheme } from "@/components/ThemeProvider";
import {
  LuFilm,
  LuTv,
  LuBookOpen,
  LuGamepad2,
  LuMapPin,
  LuStar,
  LuSearch,
  LuTag,
  LuUsers,
  LuArrowRight,
  LuSparkles,
  LuZap,
} from "react-icons/lu";
import { FeatureCard } from "./FeatureCard";
import { MagneticButton } from "./MagneticButton";

/* ────────────────────────────────────────────
   FEATURE DATA
   ──────────────────────────────────────────── */
const FEATURES = [
  {
    Icon: LuFilm,
    title: "Film",
    desc: "İzlediğin filmleri puanla, yönetmen ve yıl bilgisiyle birlikte kaydet.",
    border: "rgba(56,88,168,0.18)",
    gradientFrom: "rgba(40,64,140,0.07)",
    iconColor: "#6888c0",
    iconBg: "rgba(56,88,168,0.12)",
    iconBorder: "rgba(56,88,168,0.2)",
  },
  {
    Icon: LuTv,
    title: "Dizi",
    desc: "Devam eden ya da biten dizileri durumlarıyla takip et.",
    border: "rgba(200,176,144,0.16)",
    gradientFrom: "rgba(168,140,96,0.07)",
    iconColor: "#c8b090",
    iconBg: "rgba(200,176,144,0.1)",
    iconBorder: "rgba(200,176,144,0.2)",
  },
  {
    Icon: LuGamepad2,
    title: "Oyun",
    desc: "Oynadığın ya da oynamak istediğin oyunları RAWG veritabanıyla kaydet.",
    border: "rgba(14,165,233,0.16)",
    gradientFrom: "rgba(16,185,129,0.07)",
    iconColor: "#0ea5e9",
    iconBg: "rgba(14,165,233,0.1)",
    iconBorder: "rgba(14,165,233,0.2)",
  },
  {
    Icon: LuBookOpen,
    title: "Kitap",
    desc: "Okuduğun ya da okumak istediğin kitapları listele, notlar al.",
    border: "rgba(16,185,129,0.18)",
    gradientFrom: "rgba(160,128,40,0.08)",
    iconColor: "#10b981",
    iconBg: "rgba(16,185,129,0.1)",
    iconBorder: "rgba(16,185,129,0.2)",
  },
  {
    Icon: LuMapPin,
    title: "Gezi",
    desc: "Gezdiğin şehirleri, ülkeleri ve mekânları puanla, anılarını kaydet.",
    border: "rgba(80,160,120,0.18)",
    gradientFrom: "rgba(60,130,90,0.07)",
    iconColor: "#60a88a",
    iconBg: "rgba(80,160,120,0.1)",
    iconBorder: "rgba(80,160,120,0.2)",
  },
] as const;

const SUB_FEATURES = [
  {
    label: "Tam Metin Arama",
    Icon: LuSearch,
    color: "var(--gold)",
    accent: "rgba(16,185,129,0.1)",
  },
  { label: "Kaydet & Etiketle", Icon: LuTag, color: "#0ea5e9", accent: "rgba(14,165,233,0.1)" },
  {
    label: "Bildirimler & Keşfet",
    Icon: LuUsers,
    color: "#6888c0",
    accent: "rgba(14,165,233,0.1)",
  },
  {
    label: "Kişisel İstatistikler",
    Icon: LuStar,
    color: "var(--gold)",
    accent: "rgba(16,185,129,0.1)",
  },
] as const;

/* ────────────────────────────────────────────
   FEATURES SECTION — Bento-inspired grid
   ──────────────────────────────────────────── */
export function FeaturesSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  /* Scroll-linked parallax for the heading */
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const headingY = useTransform(scrollYProgress, [0, 0.3], [40, 0]);
  const headingOpacity = useTransform(scrollYProgress, [0, 0.15], [0, 1]);

  return (
    <section
      ref={sectionRef}
      className="relative mx-auto w-full max-w-5xl px-3 pb-14 pt-2 sm:px-6 sm:pb-24 sm:pt-4"
    >
      {/* Section decorative line — animated width */}
      <motion.div
        className="absolute left-1/2 top-0 h-px w-0 -translate-x-1/2"
        animate={isInView ? { width: "66%" } : {}}
        transition={{ duration: 1, ease: [0.16, 0.8, 0.24, 1] }}
        style={{
          background: "linear-gradient(90deg, transparent, rgba(16,185,129,0.22), transparent)",
        }}
      />

      {/* Heading — scroll-linked parallax */}
      <motion.div
        className="mb-10 text-center sm:mb-16"
        style={{ y: headingY, opacity: headingOpacity }}
      >
        <div className="mb-4 flex items-center justify-center gap-2 sm:mb-5">
          <motion.div
            className="dn-section-pill flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] sm:text-xs"
            style={{
              borderColor: "rgba(16,185,129,0.2)",
              background: "rgba(16,185,129,0.06)",
              color: "var(--gold)",
            }}
            initial={{ opacity: 0, scale: 0.8, filter: "blur(6px)" }}
            animate={isInView ? { opacity: 1, scale: 1, filter: "blur(0px)" } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <motion.span
              animate={isInView ? { rotate: [0, 15, -15, 0] } : {}}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <LuSparkles size={12} />
            </motion.span>
            Özellikler
          </motion.div>
        </div>
        <motion.h2
          className="mb-3 text-[1.35rem] font-black text-[var(--text-primary)] sm:mb-4 sm:text-4xl xl:text-5xl"
          initial={{ opacity: 0, y: 30, filter: "blur(12px)" }}
          animate={isInView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 0.8, 0.24, 1] }}
        >
          Her şey{" "}
          <span
            className="dn-shimmer-text"
            style={{
              background: "linear-gradient(90deg, #a7f3d0, #10b981, #059669, #34d399, #a7f3d0)",
              backgroundSize: "200% 100%",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            tek yerde
          </span>
        </motion.h2>
        <motion.p
          className="mx-auto max-w-2xl text-[14px] font-medium leading-[1.82] text-[var(--text-secondary)] sm:text-base"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.25 }}
        >
          <span className="block text-balance">
            Film izle, dizi takip et, oyun oyna, kitap oku, gezi yap — not al.
          </span>
          <span className="mt-3 block text-balance">
            Kaydet, bildirim al, koleksiyon oluştur ve istatistiklerini gör.
          </span>
        </motion.p>
      </motion.div>

      {/* Büyük özellik kartları — grid */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:mb-10 sm:grid-cols-3 sm:gap-5 lg:grid-cols-5">
        {FEATURES.map((f, i) => (
          <div
            key={f.title}
            className={
              i === FEATURES.length - 1
                ? "col-span-2 mx-auto h-full w-full max-w-[calc(50%-6px)] sm:col-span-1 sm:mx-0 sm:max-w-none lg:col-span-1"
                : "h-full"
            }
          >
            <FeatureCard {...f} index={i} />
          </div>
        ))}
      </div>

      {/* Alt özellik satırı — bento pills */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        {SUB_FEATURES.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 24, scale: 0.92, filter: "blur(6px)" }}
            whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.55, delay: 0.3 + i * 0.1, ease: [0.16, 0.8, 0.24, 1] }}
            whileHover={{
              y: -4,
              scale: 1.04,
              borderColor: "rgba(16,185,129,0.22)",
              transition: { duration: 0.2 },
            }}
            className="dn-landing-card group flex flex-row items-center gap-2.5 rounded-xl border border-[var(--border)] px-3 py-3 backdrop-blur-sm sm:gap-3 sm:px-4 sm:py-3.5"
            style={{
              cursor: "default",
              background: "color-mix(in srgb, var(--bg-card) 80%, transparent)",
            }}
          >
            <motion.div
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg transition-shadow duration-300 group-hover:shadow-[0_0_16px_rgba(16,185,129,0.2)]"
              style={{ background: s.accent }}
              whileHover={{ scale: 1.15, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
            >
              <s.Icon size={13} style={{ color: s.color, flexShrink: 0 }} />
            </motion.div>
            <span className="text-[13px] font-semibold text-[var(--text-secondary)] sm:text-[13px]">
              {s.label}
            </span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────
    HOW IT WORKS — Animated Timeline
   ──────────────────────────────────────────── */
const STEPS = [
  {
    step: "1",
    title: "Hesap Oluştur",
    desc: "E-posta ve kullanıcı adınla kayıt ol. Beş saniye yeterli.",
    accent: "#6888c0",
    accentBg: "rgba(14,165,233,0.08)",
    icon: LuZap,
  },
  {
    step: "2",
    title: "Notlarını Ekle",
    desc: "Film, dizi, oyun, kitap veya gezi — kategorini seç, notunu yaz.",
    accent: "#10b981",
    accentBg: "rgba(16,185,129,0.08)",
    icon: LuTag,
  },
  {
    step: "3",
    title: "Keşfet & Hatırla",
    desc: "Puanla, etiketle ve yıllar sonra aynı duyguyla geri dön.",
    accent: "#0ea5e9",
    accentBg: "rgba(14,165,233,0.08)",
    icon: LuStar,
  },
];

function TimelineStep({
  step,
  index,
  total,
}: {
  readonly step: (typeof STEPS)[number];
  readonly index: number;
  readonly total: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      className="relative flex flex-col items-center text-center"
      initial={{ opacity: 0, y: 50, filter: "blur(10px)" }}
      animate={isInView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
      transition={{
        duration: 0.8,
        delay: index * 0.2,
        ease: [0.16, 0.8, 0.24, 1],
      }}
    >
      {/* Step number circle with pulse */}
      <motion.div
        className="relative z-10 mb-4 flex h-14 w-14 items-center justify-center rounded-2xl sm:mb-6 sm:h-[72px] sm:w-[72px]"
        style={{
          background: step.accentBg,
          border: `1px solid ${step.accent}30`,
        }}
        whileInView={{
          boxShadow: [
            `0 0 0 0 ${step.accent}30`,
            `0 0 0 16px ${step.accent}00`,
            `0 0 0 0 ${step.accent}00`,
          ],
        }}
        viewport={{ once: true }}
        transition={{
          boxShadow: { duration: 2, delay: 0.6 + index * 0.2, repeat: 2 },
        }}
        whileHover={{
          scale: 1.12,
          borderColor: `${step.accent}60`,
          boxShadow: `0 0 24px ${step.accent}30`,
          transition: { duration: 0.25, type: "spring", stiffness: 300 },
        }}
      >
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={isInView ? { scale: 1, rotate: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.25 + index * 0.2, type: "spring", stiffness: 200 }}
        >
          <step.icon size={24} style={{ color: step.accent }} />
        </motion.div>

        {/* Step number badge */}
        <motion.div
          className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-black sm:h-6 sm:w-6 sm:text-[10px]"
          style={{
            background: step.accent,
            color: "#0a0a0a",
            boxShadow: `0 2px 12px ${step.accent}50`,
          }}
          initial={{ scale: 0 }}
          animate={isInView ? { scale: 1 } : {}}
          transition={{ delay: 0.4 + index * 0.2, type: "spring", stiffness: 400, damping: 15 }}
        >
          {step.step}
        </motion.div>
      </motion.div>

      {/* Connector line (between steps, desktop only) */}
      {index < total - 1 && (
        <motion.div
          className="absolute left-[calc(50%+44px)] top-8 hidden h-px sm:block"
          style={{
            width: "calc(100% - 88px)",
            background: `linear-gradient(90deg, ${step.accent}40, ${STEPS[index + 1].accent}40)`,
          }}
          initial={{ scaleX: 0 }}
          animate={isInView ? { scaleX: 1 } : {}}
          transition={{ duration: 1, delay: 0.5 + index * 0.2, ease: [0.16, 0.8, 0.24, 1] }}
        />
      )}

      {/* Text with staggered reveal */}
      <motion.h3
        className="mb-1.5 text-[16px] font-bold text-[var(--text-primary)] sm:text-lg"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ delay: 0.3 + index * 0.2, duration: 0.5 }}
      >
        {step.title}
      </motion.h3>
      <motion.p
        className="mx-auto max-w-[220px] text-[13px] leading-relaxed text-[var(--text-secondary)] sm:max-w-[220px] sm:text-[13px]"
        initial={{ opacity: 0, y: 10 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.4 + index * 0.2, duration: 0.5 }}
      >
        {step.desc}
      </motion.p>
    </motion.div>
  );
}

export function HowItWorksSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const headingY = useTransform(scrollYProgress, [0, 0.3], [50, 0]);

  return (
    <section
      ref={sectionRef}
      className="relative mx-auto w-full max-w-4xl px-3 pb-16 pt-6 sm:px-6 sm:pb-28 sm:pt-12"
    >
      {/* Section divider glow — animated */}
      <motion.div
        className="absolute left-1/2 top-0 h-px w-0 -translate-x-1/2"
        animate={isInView ? { width: "66%" } : {}}
        transition={{ duration: 1.2, ease: [0.16, 0.8, 0.24, 1] }}
        style={{
          background: "linear-gradient(90deg, transparent, rgba(16,185,129,0.22), transparent)",
        }}
      />

      {/* Heading — parallax */}
      <motion.div className="mb-10 text-center sm:mb-16" style={{ y: headingY }}>
        <div className="mb-4 flex items-center justify-center gap-2 sm:mb-5">
          <motion.div
            className="dn-section-pill flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] sm:text-xs"
            style={{
              borderColor: "rgba(16,185,129,0.2)",
              background: "rgba(16,185,129,0.06)",
              color: "var(--gold)",
            }}
            initial={{ opacity: 0, scale: 0.8, filter: "blur(6px)" }}
            animate={isInView ? { opacity: 1, scale: 1, filter: "blur(0px)" } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <motion.span
              animate={isInView ? { rotate: [0, 360] } : {}}
              transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            >
              <LuZap size={12} />
            </motion.span>
            Nasıl Çalışır
          </motion.div>
        </div>
        <motion.h2
          className="mb-3 text-[1.35rem] font-black text-[var(--text-primary)] sm:text-4xl xl:text-5xl"
          initial={{ opacity: 0, y: 30, filter: "blur(12px)" }}
          animate={isInView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 0.8, 0.24, 1] }}
        >
          Üç adımda{" "}
          <span
            className="dn-shimmer-text"
            style={{
              background: "linear-gradient(90deg, #a7f3d0, #10b981, #059669, #34d399, #a7f3d0)",
              backgroundSize: "200% 100%",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            başla
          </span>
        </motion.h2>
        <motion.p
          className="text-[15px] font-medium text-[var(--text-secondary)] sm:text-base"
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.25 }}
        >
          Hızlıca kaydol, notlarını oluştur ve geçmişe dön.
        </motion.p>
      </motion.div>

      {/* Timeline grid */}
      <div className="relative grid gap-8 sm:grid-cols-3 sm:gap-10">
        {STEPS.map((step, i) => (
          <TimelineStep key={step.step} step={step} index={i} total={STEPS.length} />
        ))}
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────
   BOTTOM CTA — Parallax glow section
   ──────────────────────────────────────────── */
export function BottomCtaSection() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const ctaBg = isLight
    ? "linear-gradient(160deg, #10b981 0%, #059669 40%, #047857 75%, #065f46 100%)"
    : "linear-gradient(160deg, #34d399 0%, #10b981 30%, #059669 65%, #047857 100%)";
  const ctaBgHover = isLight
    ? "linear-gradient(160deg, #34d399 0%, #10b981 35%, #059669 70%, #047857 100%)"
    : "linear-gradient(160deg, #6ee7b7 0%, #34d399 28%, #10b981 60%, #059669 100%)";
  const ctaTextColor = "#ffffff";
  const ctaShadow = isLight
    ? "0 8px 28px rgba(5,150,105,0.28), 0 0 0 1px rgba(16,185,129,0.08) inset, 0 1px 0 rgba(255,255,255,0.2) inset"
    : "0 8px 28px rgba(16,185,129,0.32), 0 0 0 1px rgba(52,211,153,0.1) inset, 0 1px 0 rgba(255,255,255,0.14) inset";

  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const glowScale = useTransform(scrollYProgress, [0, 0.5], [0.6, 1.2]);
  const glowOpacity = useTransform(scrollYProgress, [0, 0.4, 0.8], [0, 0.14, 0.06]);
  const contentY = useTransform(scrollYProgress, [0.1, 0.5], [60, 0]);

  return (
    <section
      ref={sectionRef}
      className="relative flex flex-col items-center overflow-hidden px-3 pb-20 pt-4 text-center sm:px-4 sm:pb-24 sm:pt-8"
    >
      {/* Top separator line — animated */}
      <motion.div
        className="absolute inset-x-0 top-0 h-px"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 1 }}
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(16,185,129,0.3), rgba(6,182,212,0.2), transparent)",
        }}
      />

      {/* Animated parallax glow */}
      <motion.div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[350px] w-[350px] -translate-x-1/2 -translate-y-1/2 rounded-full sm:h-[700px] sm:w-[700px]"
        style={{
          background:
            "radial-gradient(circle, rgba(16,185,129,0.25), rgba(16,185,129,0.05) 50%, transparent 70%)",
          scale: glowScale,
          opacity: glowOpacity,
          filter: "blur(60px)",
        }}
      />

      {/* Floating orbs — desktop only, enhanced */}
      <motion.div
        className="pointer-events-none absolute left-[20%] top-[30%] hidden h-32 w-32 rounded-full opacity-[0.08] blur-[50px] sm:block"
        style={{ background: "radial-gradient(circle, #34d399, transparent 70%)" }}
        animate={{ y: [0, -25, 0], x: [0, 12, 0], scale: [1, 1.15, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute right-[15%] top-[40%] hidden h-24 w-24 rounded-full opacity-[0.08] blur-[40px] sm:block"
        style={{ background: "radial-gradient(circle, #0ea5e9, transparent 70%)" }}
        animate={{ y: [0, 18, 0], x: [0, -10, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />
      <motion.div
        className="pointer-events-none absolute left-[40%] top-[20%] hidden h-20 w-20 rounded-full opacity-[0.05] blur-[35px] sm:block"
        style={{ background: "radial-gradient(circle, var(--gold), transparent 70%)" }}
        animate={{ y: [0, -15, 0], x: [0, -8, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />

      {/* Content — scroll-linked entrance */}
      <motion.div
        className="relative z-10"
        style={{ y: contentY }}
        initial={{ opacity: 0, filter: "blur(14px)" }}
        animate={isInView ? { opacity: 1, filter: "blur(0px)" } : {}}
        transition={{ duration: 1, ease: [0.16, 0.8, 0.24, 1] }}
      >
        {/* Decorative sparkle with enhanced pulse */}
        <motion.div
          className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl sm:mb-6 sm:h-14 sm:w-14 sm:rounded-2xl"
          style={{
            background: "rgba(16,185,129,0.08)",
            border: "1px solid rgba(16,185,129,0.15)",
          }}
          animate={{
            boxShadow: [
              "0 0 0 0 rgba(16,185,129,0.2)",
              "0 0 0 18px rgba(16,185,129,0)",
              "0 0 0 0 rgba(16,185,129,0)",
            ],
          }}
          transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
          whileHover={{ scale: 1.15, rotate: 15, transition: { duration: 0.3 } }}
        >
          <motion.div
            animate={isInView ? { rotate: [0, 360] } : {}}
            transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 0.8, 0.24, 1] }}
          >
            <LuSparkles size={22} style={{ color: "var(--gold)" }} />
          </motion.div>
        </motion.div>

        <motion.h2
          className="relative mb-4 text-[1.4rem] font-black sm:mb-5 sm:text-3xl xl:text-4xl"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          <span style={{ color: "var(--text-primary)" }}>Notlarını almaya </span>
          <span
            className="dn-shimmer-text"
            style={{
              background:
                "linear-gradient(135deg, #a7f3d0 0%, #34d399 20%, #10b981 50%, #059669 80%, #a7f3d0 100%)",
              backgroundSize: "200% 100%",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              filter: "drop-shadow(0 0 24px rgba(16,185,129,0.35))",
            }}
          >
            başla.
          </span>
        </motion.h2>

        <motion.p
          className="mb-6 max-w-[320px] px-2 text-[14px] leading-relaxed text-[var(--text-secondary)] sm:mb-9 sm:max-w-md sm:px-0 sm:text-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 0.8, 0.24, 1] }}
        >
          Kayıt ol, kategorilerini oluştur ve ilk notunu ekle.
          <br />
          Beş dakika yeterli.
        </motion.p>

        {/* CTA Button — enhanced */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 0.8, 0.24, 1] }}
        >
          <MagneticButton className="mx-auto w-auto">
            <Link
              href="/register"
              className="dn-cta-primary group relative mx-auto flex items-center justify-center gap-2 overflow-hidden rounded-xl px-7 py-3 text-[14px] font-semibold tracking-[0.01em] transition-all duration-300 hover:-translate-y-0.5 sm:rounded-2xl sm:px-9 sm:py-3.5 sm:text-[14px]"
              style={{
                background: ctaBg,
                color: ctaTextColor,
                boxShadow: ctaShadow,
                textShadow: "0 1px 2px rgba(4,120,87,0.3)",
              }}
            >
              {/* Top shine line */}
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-px"
                style={{
                  background:
                    "linear-gradient(90deg, transparent 10%, rgba(255,255,255,0.2) 50%, transparent 90%)",
                }}
              />
              <span className="relative z-10">Hesap Oluştur</span>
              <LuArrowRight
                className="relative z-10 transition-transform duration-300 group-hover:translate-x-1.5"
                size={16}
              />
              <div
                className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{ background: ctaBgHover }}
              />
            </Link>
          </MagneticButton>
        </motion.div>
      </motion.div>
    </section>
  );
}
