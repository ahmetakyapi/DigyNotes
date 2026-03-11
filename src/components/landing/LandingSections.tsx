"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import Link from "next/link";
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
    border: "rgba(129,140,248,0.16)",
    gradientFrom: "rgba(99,102,241,0.07)",
    iconColor: "#818cf8",
    iconBg: "rgba(129,140,248,0.1)",
    iconBorder: "rgba(129,140,248,0.2)",
  },
  {
    Icon: LuBookOpen,
    title: "Kitap",
    desc: "Okuduğun ya da okumak istediğin kitapları listele, notlar al.",
    border: "rgba(201,168,76,0.18)",
    gradientFrom: "rgba(160,128,40,0.08)",
    iconColor: "#c4a24b",
    iconBg: "rgba(201,168,76,0.1)",
    iconBorder: "rgba(201,168,76,0.2)",
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
  { label: "Tam Metin Arama", Icon: LuSearch, color: "var(--gold)", accent: "rgba(196,162,75,0.1)" },
  { label: "Kaydet & Etiketle", Icon: LuTag, color: "#8d7d5e", accent: "rgba(141,125,94,0.1)" },
  { label: "Bildirimler & Keşfet", Icon: LuUsers, color: "#7a85d8", accent: "rgba(122,133,216,0.1)" },
  { label: "Kişisel İstatistikler", Icon: LuStar, color: "var(--gold)", accent: "rgba(196,162,75,0.1)" },
] as const;

/* ────────────────────────────────────────────
   FEATURES SECTION — Bento-inspired grid
   ──────────────────────────────────────────── */
export function FeaturesSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section ref={sectionRef} className="relative mx-auto w-full max-w-5xl px-4 pb-16 pt-2 sm:px-6 sm:pb-24 sm:pt-4">
      {/* Section decorative line */}
      <div
        className="absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.2), transparent)",
        }}
      />

      {/* Heading */}
      <motion.div
        className="mb-12 text-center sm:mb-16"
        initial={{ opacity: 0, y: 28, filter: "blur(10px)" }}
        animate={isInView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
        transition={{ duration: 0.8, ease: [0.16, 0.8, 0.24, 1] }}
      >
        <div className="mb-4 flex items-center justify-center gap-2 sm:mb-5">
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
            <LuSparkles size={12} />
            Özellikler
          </motion.div>
        </div>
        <h2 className="mb-3 text-2xl font-black text-[var(--text-primary)] sm:mb-4 sm:text-4xl xl:text-5xl">
          Her şey{" "}
          <span
            className="dn-shimmer-text"
            style={{
              background: "linear-gradient(90deg, #fff8c8, #e8b820, #f8d840, #c6972e, #fff8c8)",
              backgroundSize: "200% 100%",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            tek yerde
          </span>
        </h2>
        <p className="mx-auto max-w-2xl text-[15px] font-medium leading-[1.85] text-[var(--text-secondary)] sm:text-base">
          <span className="block text-balance">
            Film izle, dizi takip et, oyun oyna, kitap oku, gezi yap — not al.
          </span>
          <span className="mt-3 block text-balance">
            Kaydet, bildirim al, koleksiyon oluştur ve istatistiklerini gör.
          </span>
        </p>
      </motion.div>

      {/* Büyük özellik kartları — grid */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:mb-10 sm:grid-cols-3 sm:gap-5 lg:grid-cols-5">
        {FEATURES.map((f, i) => (
          <FeatureCard key={f.title} {...f} index={i} />
        ))}
      </div>

      {/* Alt özellik satırı — bento pills */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {SUB_FEATURES.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay: 0.3 + i * 0.08, ease: [0.16, 0.8, 0.24, 1] }}
            whileHover={{ y: -3, scale: 1.03, transition: { duration: 0.2 } }}
            className="dn-landing-card group flex flex-row items-center gap-3 rounded-xl border border-[var(--border)] px-4 py-3.5 backdrop-blur-sm"
            style={{ cursor: "default", background: "color-mix(in srgb, var(--bg-card) 80%, transparent)" }}
          >
            <div
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg transition-shadow duration-300 group-hover:shadow-[0_0_12px_rgba(196,162,75,0.2)]"
              style={{ background: s.accent }}
            >
              <s.Icon size={13} style={{ color: s.color, flexShrink: 0 }} />
            </div>
            <span className="text-[12px] font-semibold text-[var(--text-secondary)] sm:text-[13px]">
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
    step: "01",
    title: "Hesap Oluştur",
    desc: "E-posta ve kullanıcı adınla kayıt ol. Beş saniye yeterli.",
    accent: "#6888c0",
    accentBg: "rgba(104,136,192,0.08)",
    icon: LuZap,
  },
  {
    step: "02",
    title: "Notlarını Ekle",
    desc: "Film, dizi, oyun, kitap veya gezi — kategorini seç, notunu yaz.",
    accent: "#c4a24b",
    accentBg: "rgba(196,162,75,0.08)",
    icon: LuTag,
  },
  {
    step: "03",
    title: "Keşfet & Hatırla",
    desc: "Puanla, etiketle ve yıllar sonra aynı duyguyla geri dön.",
    accent: "#60a88a",
    accentBg: "rgba(96,168,138,0.08)",
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
      initial={{ opacity: 0, y: 40, filter: "blur(8px)" }}
      animate={isInView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
      transition={{
        duration: 0.7,
        delay: index * 0.18,
        ease: [0.16, 0.8, 0.24, 1],
      }}
    >
      {/* Step number circle with pulse */}
      <motion.div
        className="relative z-10 mb-5 flex h-16 w-16 items-center justify-center rounded-2xl sm:mb-6 sm:h-[72px] sm:w-[72px]"
        style={{
          background: step.accentBg,
          border: `1px solid ${step.accent}30`,
        }}
        whileInView={{
          boxShadow: [
            `0 0 0 0 ${step.accent}30`,
            `0 0 0 12px ${step.accent}00`,
            `0 0 0 0 ${step.accent}00`,
          ],
        }}
        viewport={{ once: true }}
        transition={{
          boxShadow: { duration: 2, delay: 0.5 + index * 0.18, repeat: 2 },
        }}
        whileHover={{
          scale: 1.08,
          borderColor: `${step.accent}60`,
          transition: { duration: 0.2 },
        }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={isInView ? { scale: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.2 + index * 0.18, type: "spring", stiffness: 200 }}
        >
          <step.icon size={24} style={{ color: step.accent }} />
        </motion.div>

        {/* Step number badge */}
        <div
          className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-black sm:h-6 sm:w-6 sm:text-[10px]"
          style={{
            background: step.accent,
            color: "#0a0a0a",
            boxShadow: `0 2px 8px ${step.accent}40`,
          }}
        >
          {step.step}
        </div>
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
          transition={{ duration: 0.8, delay: 0.4 + index * 0.18, ease: [0.16, 0.8, 0.24, 1] }}
        />
      )}

      {/* Text */}
      <h3 className="mb-1.5 text-base font-bold text-[var(--text-primary)] sm:text-lg">
        {step.title}
      </h3>
      <p className="mx-auto max-w-[220px] text-[13px] leading-relaxed text-[var(--text-secondary)] sm:text-sm">
        {step.desc}
      </p>
    </motion.div>
  );
}

export function HowItWorksSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section ref={sectionRef} className="relative mx-auto w-full max-w-4xl px-4 pb-20 pt-8 sm:px-6 sm:pb-28 sm:pt-12">
      {/* Section divider glow */}
      <div
        className="absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.2), transparent)",
        }}
      />

      {/* Heading */}
      <motion.div
        className="mb-14 text-center sm:mb-16"
        initial={{ opacity: 0, y: 28, filter: "blur(10px)" }}
        animate={isInView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
        transition={{ duration: 0.8, ease: [0.16, 0.8, 0.24, 1] }}
      >
        <div className="mb-4 flex items-center justify-center gap-2 sm:mb-5">
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
            <LuZap size={12} />
            Nasıl Çalışır
          </motion.div>
        </div>
        <h2 className="mb-3 text-2xl font-black text-[var(--text-primary)] sm:text-4xl xl:text-5xl">
          Üç adımda{" "}
          <span
            className="dn-shimmer-text"
            style={{
              background: "linear-gradient(90deg, #fff8c8, #e8b820, #f8d840, #c6972e, #fff8c8)",
              backgroundSize: "200% 100%",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            başla
          </span>
        </h2>
        <p className="text-sm font-medium text-[var(--text-secondary)] sm:text-base">
          Hızlıca kaydol, notlarını oluştur ve geçmişe dön.
        </p>
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
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const glowScale = useTransform(scrollYProgress, [0, 0.5], [0.6, 1.2]);
  const glowOpacity = useTransform(scrollYProgress, [0, 0.4, 0.8], [0, 0.14, 0.06]);

  return (
    <section
      ref={sectionRef}
      className="relative flex flex-col items-center overflow-hidden px-4 pb-24 pt-4 text-center sm:pt-8"
    >
      {/* Top separator line */}
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(201,168,76,0.3), rgba(129,140,248,0.2), transparent)",
        }}
      />

      {/* Animated parallax glow */}
      <motion.div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full sm:h-[700px] sm:w-[700px]"
        style={{
          background: "radial-gradient(circle, rgba(196,162,75,0.3), rgba(196,162,75,0.05) 50%, transparent 70%)",
          scale: glowScale,
          opacity: glowOpacity,
          filter: "blur(60px)",
        }}
      />

      {/* Floating orbs */}
      <motion.div
        className="pointer-events-none absolute left-[20%] top-[30%] h-32 w-32 rounded-full opacity-[0.06] blur-[50px]"
        style={{ background: "radial-gradient(circle, #818cf8, transparent 70%)" }}
        animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute right-[15%] top-[40%] h-24 w-24 rounded-full opacity-[0.06] blur-[40px]"
        style={{ background: "radial-gradient(circle, #60a88a, transparent 70%)" }}
        animate={{ y: [0, 15, 0], x: [0, -8, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      {/* Content */}
      <motion.div
        className="relative z-10"
        initial={{ opacity: 0, y: 40, filter: "blur(12px)" }}
        animate={isInView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
        transition={{ duration: 0.9, ease: [0.16, 0.8, 0.24, 1] }}
      >
        {/* Decorative sparkle */}
        <motion.div
          className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl sm:mb-6 sm:h-14 sm:w-14"
          style={{
            background: "rgba(196,162,75,0.08)",
            border: "1px solid rgba(196,162,75,0.15)",
          }}
          animate={{
            boxShadow: [
              "0 0 0 0 rgba(196,162,75,0.2)",
              "0 0 0 14px rgba(196,162,75,0)",
              "0 0 0 0 rgba(196,162,75,0)",
            ],
          }}
          transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
        >
          <LuSparkles size={22} style={{ color: "var(--gold)" }} />
        </motion.div>

        <h2 className="relative mb-4 text-2xl font-black sm:mb-5 sm:text-4xl xl:text-5xl">
          <span style={{ color: "var(--text-primary)" }}>Notlarını almaya </span>
          <span
            className="dn-shimmer-text"
            style={{
              background: "linear-gradient(135deg, #fff8c8 0%, #f8d840 20%, #e8b820 50%, #f8d040 80%, #fff8c8 100%)",
              backgroundSize: "200% 100%",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              filter: "drop-shadow(0 0 24px rgba(248,200,40,0.4))",
            }}
          >
            başla.
          </span>
        </h2>

        <motion.p
          className="mb-8 max-w-md text-[13px] leading-relaxed text-[var(--text-secondary)] sm:mb-10 sm:text-[15px]"
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 0.8, 0.24, 1] }}
        >
          Kayıt ol, kategorilerini oluştur ve ilk notunu ekle.
          <br />
          Beş dakika yeterli.
        </motion.p>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.95 }}
          animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.25, ease: [0.16, 0.8, 0.24, 1] }}
        >
          <MagneticButton className="mx-auto w-full max-w-[280px] sm:w-auto sm:max-w-none">
            <Link
              href="/register"
              className="dn-cta-gold group relative mx-auto flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl px-8 py-3.5 text-[14px] font-semibold tracking-[0.01em] text-[#1b1307] shadow-[0_8px_28px_rgba(198,151,46,0.34)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_44px_rgba(198,151,46,0.5)] sm:w-auto sm:px-12 sm:py-4 sm:text-[15px]"
              style={{ background: "linear-gradient(135deg, #e7bf5d, #c6972e, #b37a16, #cf9d2f)" }}
            >
              <span className="relative z-10">Hesap Oluştur</span>
              <LuArrowRight className="relative z-10 transition-transform duration-300 group-hover:translate-x-1" size={16} />
              <div
                className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{ background: "linear-gradient(135deg, #efca67, #d0a23d, #bc841c, #d6a83a)" }}
              />
            </Link>
          </MagneticButton>
        </motion.div>
      </motion.div>
    </section>
  );
}
