"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";
import { useTheme } from "@/components/ThemeProvider";
import { useSpotlight } from "@/hooks/useSpotlight";
import { EASE } from "@/lib/variants";
import { MagneticButton } from "./MagneticButton";
import { RotatingWord } from "./RotatingWord";
import { FloatingParticles } from "./FloatingParticles";
import { DigyNotesPlayer } from "@/components/DigyNotesPlayer";

const LIGHT_THEME = {
  glowBg:
    "radial-gradient(circle, rgba(16,185,129,0.5) 0%, rgba(5,150,105,0.2) 42%, rgba(255,255,255,0) 76%)",
  dotBgImage: "radial-gradient(circle, rgba(16,185,129,0.4) 1px, transparent 1px)",
  dotBgSize: "44px 44px",
  dotOpacity: 0.18,
  geomCircle: "rgba(16,185,129,0.15)",
  geomSquare: "rgba(6,182,212,0.18)",
  geomDot: "rgba(16,185,129,0.18)",
  geomRing: "rgba(20,184,166,0.1)",
  geomCross: "rgba(16,185,129,0.3)",
  badgeBg: "linear-gradient(135deg, rgba(16,185,129,0.08), rgba(6,182,212,0.05))",
  badgeBorder: "rgba(16,185,129,0.28)",
  badgeDot: "radial-gradient(circle, #34d399, #059669)",
  badgeDotGlow: "0 0 8px #059669",
  badgeText: "linear-gradient(90deg, #047857, #10b981)",
  headingLine2:
    "linear-gradient(135deg, #1e40af 0%, #1e3a8a 22%, #1d4ed8 44%, #2563eb 66%, #1e40af 100%)",
  headingLine3:
    "linear-gradient(90deg, #059669 0%, #047857 18%, #065f46 38%, #059669 58%, #10b981 80%, #34d399 100%)",
  ctaBtnBg: "linear-gradient(160deg, #10b981 0%, #059669 40%, #047857 75%, #065f46 100%)",
  ctaBtnBgHover: "linear-gradient(160deg, #34d399 0%, #10b981 35%, #059669 70%, #047857 100%)",
  ctaBtnTextColor: "#ffffff",
  ctaBtnShadow:
    "0 8px 28px rgba(5,150,105,0.28), 0 0 0 1px rgba(16,185,129,0.08) inset, 0 1px 0 rgba(255,255,255,0.2) inset",
  ctaBtnHoverShadow: "0 16px 48px rgba(5, 150, 105, 0.48)",
  statsBg: "rgba(255,255,255,0.7)",
  statsBorder: "rgba(16,185,129,0.2)",
} as const;

const DARK_THEME = {
  glowBg: "radial-gradient(circle, #10b981 0%, #047857 50%, transparent 75%)",
  dotBgImage:
    "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
  dotBgSize: "80px 80px",
  dotOpacity: 0.016,
  geomCircle: "rgba(16,185,129,0.1)",
  geomSquare: "rgba(6,182,212,0.12)",
  geomDot: "rgba(16,185,129,0.12)",
  geomRing: "rgba(20,184,166,0.06)",
  geomCross: "rgba(52,211,153,0.25)",
  badgeBg:
    "linear-gradient(135deg, rgba(16,185,129,0.1), rgba(6,182,212,0.07), rgba(20,184,166,0.06))",
  badgeBorder: "color-mix(in srgb, var(--gold) 28%, transparent)",
  badgeDot: "radial-gradient(circle, #34d399, #10b981)",
  badgeDotGlow: "0 0 8px #10b981",
  badgeText: "linear-gradient(90deg, var(--gold), var(--gold-light))",
  headingLine2:
    "linear-gradient(135deg, #38bdf8 0%, #0ea5e9 22%, #0284c7 44%, #0369a1 66%, #0c4a6e 100%)",
  headingLine3:
    "linear-gradient(90deg, #a7f3d0 0%, #34d399 16%, #10b981 36%, #059669 56%, #34d399 76%, #a7f3d0 100%)",
  ctaBtnBg: "linear-gradient(160deg, #34d399 0%, #10b981 30%, #059669 65%, #047857 100%)",
  ctaBtnBgHover: "linear-gradient(160deg, #6ee7b7 0%, #34d399 28%, #10b981 60%, #059669 100%)",
  ctaBtnTextColor: "#ffffff",
  ctaBtnShadow:
    "0 8px 28px rgba(16,185,129,0.32), 0 0 0 1px rgba(52,211,153,0.1) inset, 0 1px 0 rgba(255,255,255,0.14) inset",
  ctaBtnHoverShadow: "0 16px 48px rgba(16, 185, 129, 0.52)",
  statsBg: "rgba(255,255,255,0.04)",
  statsBorder: "rgba(255,255,255,0.08)",
} as const;

const FEATURE_PILLS = [
  { emoji: "🎬", label: "Film" },
  { emoji: "📺", label: "Dizi" },
  { emoji: "🎮", label: "Oyun" },
  { emoji: "📚", label: "Kitap" },
  { emoji: "🗺️", label: "Gezi" },
];

export function HeroSection() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const t = isLight ? LIGHT_THEME : DARK_THEME;
  const sectionRef = useRef<HTMLElement>(null);
  const spotlight = useSpotlight(680, isLight ? "rgba(16,185,129,0.05)" : "rgba(16,185,129,0.07)");
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], [0, 180]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-4 pb-4 pt-[4.4rem] sm:px-4 sm:pt-16"
    >
      {/* Mouse spotlight */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-0"
        style={{ background: spotlight }}
      />

      {/* ── Background layers ── */}
      <motion.div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        style={{ y: bgY }}
      >
        {/* Central background glow */}
        <div
          className="dn-aurora-float-3 absolute bottom-[18%] left-1/2 h-[200px] w-[340px] -translate-x-1/2 rounded-full opacity-[0.10] blur-[120px] sm:h-[300px] sm:w-[600px] sm:opacity-[0.12]"
          style={{ background: t.glowBg }}
        />
        {/* Top-right accent glow */}
        <div
          className="absolute right-[5%] top-[8%] hidden h-[180px] w-[180px] rounded-full blur-[90px] lg:block"
          style={{
            background: "radial-gradient(circle, rgba(16,185,129,0.12), transparent 70%)",
            opacity: 0.8,
          }}
        />
        {/* Grid/dot overlay */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: t.dotBgImage,
            backgroundSize: t.dotBgSize,
            opacity: t.dotOpacity,
          }}
        />
      </motion.div>

      {/* ── Floating Particles ── */}
      <FloatingParticles count={20} />

      {/* ── Floating geometric shapes (desktop only) ── */}
      <div className="pointer-events-none absolute inset-0 hidden overflow-hidden sm:block">
        <motion.div
          className="absolute right-[12%] top-[18%] h-20 w-20 rounded-full border"
          style={{ borderColor: t.geomCircle }}
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute bottom-[22%] left-[8%] h-6 w-6 rotate-45 rounded-sm border"
          style={{ borderColor: t.geomSquare }}
          animate={{ y: [0, -20, 0], opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute right-[22%] top-[65%] h-3 w-3 rounded-full"
          style={{ background: t.geomDot }}
          animate={{ y: [0, -15, 0], scale: [1, 1.5, 1] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        <motion.div
          className="absolute bottom-[30%] left-[18%] h-32 w-32 rounded-full border"
          style={{ borderColor: t.geomRing }}
          animate={{ rotate: -360, scale: [1, 1.05, 1] }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute left-[45%] top-[12%]"
          animate={{ rotate: [0, 90, 180, 270, 360], opacity: [0.15, 0.4, 0.15] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="h-px w-5" style={{ background: t.geomCross }} />
          <div
            className="absolute left-1/2 top-1/2 h-5 w-px -translate-x-1/2 -translate-y-1/2"
            style={{ background: t.geomCross }}
          />
        </motion.div>
      </div>

      {/* ══════════════════════════════════════
          İçerik — 2 kolon (lg+)
      ══════════════════════════════════════ */}
      <motion.div
        className="relative z-10 flex w-full max-w-[460px] flex-col items-center gap-6 sm:max-w-5xl sm:gap-8 lg:grid lg:grid-cols-[1fr,1.1fr] lg:items-center lg:gap-14 xl:max-w-7xl xl:gap-20"
        style={{ y: contentY, opacity: contentOpacity }}
      >
        {/* ══ Sol kolon: metin + CTA ══ */}
        <div className="flex w-full flex-col items-center gap-0 text-center lg:items-start lg:text-left">
          {/* Badge */}
          <motion.div
            className="mb-5 sm:mb-6"
            initial={{ opacity: 0, y: -14, scale: 0.88 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.05, ease: EASE }}
          >
            <div
              className="dn-badge-sheen chip relative flex items-center gap-2 rounded-full px-3.5 py-2 sm:px-4 sm:py-2.5"
              style={{
                background: t.badgeBg,
                borderColor: t.badgeBorder,
                border: `1px solid ${t.badgeBorder}`,
              }}
            >
              <span
                className="dn-dot-pulse h-1.5 w-1.5 flex-shrink-0 rounded-full sm:h-2 sm:w-2"
                style={{ background: t.badgeDot, boxShadow: t.badgeDotGlow }}
              />
              <span
                key={theme}
                className="text-[10px] font-bold uppercase tracking-[0.18em] sm:text-[11px]"
                style={{
                  background: t.badgeText,
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  color: "transparent",
                  display: "inline-block",
                }}
              >
                Kişisel Not Defteri
              </span>
            </div>
          </motion.div>

          {/* Başlık */}
          <h1 className="mb-5 w-full overflow-visible pb-[0.06em] text-center text-[clamp(2.5rem,11vw,3.5rem)] font-black leading-[1.12] tracking-[-0.038em] sm:mb-6 sm:text-[clamp(3.2rem,5.8vw,4.8rem)] sm:leading-[1.1] lg:text-left xl:text-[clamp(3.6rem,5vw,5.2rem)]">
            {/* Line 1: rotating word */}
            <motion.span
              className="mb-1 block sm:mb-1.5"
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.85, delay: 0.12, ease: EASE }}
            >
              <RotatingWord innerClassName="justify-center lg:justify-start" />
            </motion.span>

            {/* Line 2: Sana Kalanlar */}
            <motion.span
              className="mb-1 block sm:mb-1.5"
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.85, delay: 0.24, ease: EASE }}
            >
              <span
                key={theme}
                style={{
                  background: t.headingLine2,
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  color: "transparent",
                  display: "inline-block",
                }}
              >
                Sana Kalanlar
              </span>
            </motion.span>

            {/* Line 3: Tek Yerde */}
            <motion.span
              className="block"
              style={{ fontSize: "1.06em" }}
              initial={{ opacity: 0, y: 28, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.85, delay: 0.38, ease: EASE }}
            >
              <span
                key={theme}
                className="dn-shimmer-text"
                style={{
                  background: t.headingLine3,
                  backgroundSize: "200% 100%",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  color: "transparent",
                  display: "inline-block",
                }}
              >
                Tek Yerde
              </span>
            </motion.span>
          </h1>

          {/* Açıklama */}
          <motion.p
            className="mb-5 max-w-[360px] text-center text-[1rem] font-medium leading-[1.76] text-[var(--text-secondary)] sm:mb-6 sm:max-w-md sm:text-[1.06rem] sm:leading-[1.84] lg:text-left"
            initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.85, delay: 0.52, ease: EASE }}
          >
            Film, dizi, oyun, kitap ve gezi anılarını kaydet. Puanla, etiketle — yıllar sonra bile
            aynı duyguyla geri dön.
          </motion.p>

          {/* Feature pills */}
          <motion.div
            className="mb-6 flex flex-wrap justify-center gap-2 sm:mb-7 lg:justify-start"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.58, ease: EASE }}
          >
            {FEATURE_PILLS.map((pill, i) => (
              <div
                key={pill.label}
                className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold"
                style={{
                  background: t.statsBg,
                  borderColor: t.statsBorder,
                  color: "var(--text-secondary)",
                  animationDelay: `${i * 60}ms`,
                }}
              >
                <span className="text-[12px]">{pill.emoji}</span>
                {pill.label}
              </div>
            ))}
          </motion.div>

          {/* CTA butonları */}
          <motion.div
            className="flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row sm:gap-3.5 lg:items-start"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.64, ease: EASE }}
          >
            <MagneticButton className="w-full sm:w-auto">
              <Link
                href="/register"
                className="dn-cta-primary group relative block w-full overflow-hidden rounded-2xl py-3.5 text-center text-[0.95rem] font-semibold tracking-[0.01em] transition-all duration-300 sm:px-10 sm:py-4 sm:text-[15px] 2xl:px-12 2xl:py-[1.1rem]"
                style={{
                  background: t.ctaBtnBg,
                  color: t.ctaBtnTextColor,
                  boxShadow: t.ctaBtnShadow,
                  textShadow: "0 1px 2px rgba(4,120,87,0.3)",
                }}
              >
                <div
                  className="pointer-events-none absolute inset-x-0 top-0 h-px"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent 10%, rgba(255,255,255,0.2) 50%, transparent 90%)",
                  }}
                />
                <span className="relative z-10">Hemen Başla →</span>
                <div
                  className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{ background: t.ctaBtnBgHover }}
                />
              </Link>
            </MagneticButton>

            <MagneticButton className="w-full sm:w-auto">
              <Link
                href="/login"
                className="dn-cta-ghost block w-full rounded-2xl border border-[var(--border)] py-3.5 text-center text-[0.93rem] font-medium tracking-[0.01em] text-[var(--text-primary)] backdrop-blur-sm transition-all duration-300 hover:bg-[var(--surface-strong)] sm:px-10 sm:py-4 sm:text-[15px] 2xl:px-12 2xl:py-[1.1rem]"
                style={{ background: "color-mix(in srgb, var(--bg-card) 92%, white 8%)" }}
              >
                Giriş Yap
              </Link>
            </MagneticButton>
          </motion.div>

          {/* Mini stats strip */}
          <motion.div
            className="mt-6 flex items-center justify-center gap-5 sm:mt-7 lg:justify-start"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.82, ease: EASE }}
          >
            {[
              { value: "5", label: "Kategori" },
              { value: "∞", label: "Not" },
              { value: "100%", label: "Ücretsiz" },
            ].map((s, i) => (
              <div key={s.label} className="flex items-center gap-5">
                {i > 0 && <div className="h-5 w-px" style={{ background: "var(--border)" }} />}
                <div className="flex flex-col">
                  <span
                    className="text-lg font-black leading-none tracking-tight sm:text-xl"
                    style={{ color: "var(--gold)" }}
                  >
                    {s.value}
                  </span>
                  <span className="mt-1 text-xs font-medium text-[var(--text-muted)] sm:text-sm">
                    {s.label}
                  </span>
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* ══ Sağ kolon: App window + Remotion player ══ */}
        <motion.div
          className="relative flex w-full flex-col gap-3"
          initial={{ opacity: 0, x: 48, scale: 0.94 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.4, ease: EASE }}
        >
          {/* Glow halo — desktop only */}
          <div
            className="pointer-events-none absolute -inset-10 hidden rounded-full blur-3xl lg:block"
            style={{
              background:
                "radial-gradient(ellipse 70% 60% at 60% 50%, rgba(16,185,129,0.11), transparent)",
            }}
          />

          {/* ── Mobile: bare Remotion player ── */}
          <div className="w-full overflow-hidden rounded-2xl lg:hidden">
            <DigyNotesPlayer />
          </div>

          {/* ── Desktop: App window frame with chrome bar ── */}
          <div
            className="relative hidden w-full overflow-hidden rounded-[18px] border border-[var(--border)] lg:block"
            style={{
              boxShadow:
                "0 2px 0 rgba(255,255,255,0.05) inset, 0 24px 64px rgba(16,185,129,0.10), 0 8px 32px rgba(0,0,0,0.2)",
            }}
          >
            {/* Chrome bar */}
            <div
              className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-2.5"
              style={{ background: "var(--bg-header)" }}
            >
              {/* Traffic lights */}
              <div className="flex flex-shrink-0 items-center gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-400/70" />
                <div className="h-3 w-3 rounded-full bg-amber-400/70" />
                <div className="h-3 w-3 rounded-full bg-emerald-400/70" />
              </div>

              {/* URL bar */}
              <div className="flex-1">
                <div
                  className="mx-auto flex h-6 max-w-[220px] items-center justify-center gap-1.5 rounded-md border border-[var(--border)] px-3"
                  style={{ background: "var(--bg-soft)" }}
                >
                  <div className="h-[6px] w-[6px] flex-shrink-0 rounded-full bg-emerald-400" />
                  <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                    digynotes.app/notes
                  </span>
                </div>
              </div>
            </div>

            {/* Remotion player */}
            <DigyNotesPlayer />
          </div>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 sm:bottom-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.6 }}
      >
        <motion.div
          className="flex flex-col items-center gap-2"
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="h-8 w-5 rounded-full border border-[rgba(16,185,129,0.3)] p-1">
            <motion.div
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: "rgba(16,185,129,0.6)" }}
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
