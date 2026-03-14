"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";
import { useTheme } from "@/components/ThemeProvider";
import { MagneticButton } from "./MagneticButton";
import { RotatingWord } from "./RotatingWord";
import { FloatingParticles } from "./FloatingParticles";

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
  badgeBg: "linear-gradient(135deg, rgba(16,185,129,0.06), rgba(6,182,212,0.04))",
  badgeBorder: "rgba(16,185,129,0.22)",
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
} as const;

export function HeroSection() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const t = isLight ? LIGHT_THEME : DARK_THEME;
  const sectionRef = useRef<HTMLElement>(null);
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
      {/* ── Subtle background layers ── */}
      <motion.div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        style={{ y: bgY }}
      >
        {/* Central background glow */}
        <div
          className="dn-aurora-float-3 absolute bottom-[18%] left-1/2 h-[200px] w-[340px] -translate-x-1/2 rounded-full opacity-[0.10] blur-[120px] sm:h-[300px] sm:w-[600px] sm:opacity-[0.12]"
          style={{ background: t.glowBg }}
        />
        {/* Dot grid overlay — constellation-style for light, line grid for dark */}
        <div
          className="absolute inset-0 sm:hidden"
          style={{
            backgroundImage: t.dotBgImage,
            backgroundSize: t.dotBgSize,
            opacity: t.dotOpacity,
          }}
        />
        <div
          className="absolute inset-0 hidden sm:block"
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

      {/* ── İçerik ── */}
      <motion.div
        className="relative z-10 flex w-full max-w-[430px] flex-col items-center gap-5 sm:max-w-5xl sm:gap-6 xl:max-w-6xl"
        style={{ y: contentY, opacity: contentOpacity }}
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -14, scale: 0.88 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.05, ease: [0.16, 0.8, 0.24, 1] }}
        >
          <div
            className="dn-badge-sheen dn-section-pill relative mb-1 mt-2 flex items-center gap-2 rounded-full border px-4 py-1.5 backdrop-blur-md sm:mb-1 sm:mt-0 sm:gap-3 sm:px-5 sm:py-2 2xl:px-6 2xl:py-2.5"
            style={{ background: t.badgeBg, borderColor: t.badgeBorder }}
          >
            <span
              className="dn-dot-pulse h-1.5 w-1.5 rounded-full sm:h-2 sm:w-2"
              style={{ background: t.badgeDot, boxShadow: t.badgeDotGlow }}
            />
            <span
              key={theme}
              className="text-[10px] font-bold uppercase tracking-[0.2em] sm:text-xs"
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

        {/* Başlık + açıklama */}
        <div className="flex flex-col items-center">
          <h1 className="mb-4 w-full overflow-visible px-1 pb-[0.1em] text-center text-[clamp(2.3rem,11vw,3.3rem)] font-black leading-[1.14] tracking-[-0.038em] sm:mb-5 sm:px-0 sm:text-[clamp(3.35rem,6vw,5.25rem)] sm:leading-[1.12] xl:text-[clamp(4rem,5.4vw,5.8rem)] xl:leading-[1.1] 2xl:text-[clamp(4.5rem,4.8vw,6.4rem)]">
            <motion.span
              className="mb-0.5 block px-[0.04em] pb-[0.04em] pt-[0.12em] sm:mb-1"
              style={{ lineHeight: 1.25 }}
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.85, delay: 0.12, ease: [0.16, 0.8, 0.24, 1] }}
            >
              <RotatingWord />
            </motion.span>

            <motion.span
              className="mb-0.5 block px-[0.04em] py-[0.08em] sm:mb-1"
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.85, delay: 0.24, ease: [0.16, 0.8, 0.24, 1] }}
            >
              {/* key forces DOM remount on theme switch — prevents WebKit background-clip:text bug
                  that triggers when background style updates on elements inside transform stacking contexts */}
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

            <motion.span
              className="mt-1 block px-[0.04em] pb-[0.06em] pt-[0.04em] sm:mt-1.5"
              initial={{ opacity: 0, y: 28, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.85, delay: 0.38, ease: [0.16, 0.8, 0.24, 1] }}
              style={{ fontSize: "1.08em" }}
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

          <motion.p
            className="mx-auto max-w-[342px] px-2 py-1 text-center text-[1.02rem] font-medium leading-[1.74] text-[var(--text-secondary)] [text-wrap:balance] sm:mb-2 sm:max-w-3xl sm:px-0 sm:py-0 sm:text-[1.08rem] sm:leading-[1.86] xl:max-w-4xl xl:text-[1.18rem] 2xl:max-w-[54rem] 2xl:text-[1.24rem]"
            initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.85, delay: 0.52, ease: [0.16, 0.8, 0.24, 1] }}
          >
            <span className="block [text-wrap:balance]">
              Film, dizi, oyun, kitap ve gezilerden geriye kalan düşüncelerini tek bir yerde topla.
            </span>
            <span className="mt-2 block [text-wrap:balance] sm:mt-2">
              Puanla, etiketle ve yıllar sonra bile aynı duyguyla geri dön.
            </span>
          </motion.p>
        </div>

        {/* CTA butonları */}
        <motion.div
          className="mb-4 mt-2 flex w-full flex-col gap-4 px-1.5 pb-1 sm:mb-0 sm:mt-1 sm:w-auto sm:flex-row sm:gap-5 sm:px-0 sm:pb-0"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.64, ease: [0.16, 0.8, 0.24, 1] }}
        >
          <MagneticButton className="w-[86%] self-center sm:w-auto sm:self-auto">
            <Link
              href="/register"
              className="dn-cta-primary group relative block w-full overflow-hidden rounded-[1.6rem] py-[10px] text-center text-[clamp(0.98rem,4vw,1.12rem)] font-semibold tracking-[0.01em] transition-all duration-300 sm:rounded-2xl sm:px-9 sm:py-[12px] sm:text-[14px] 2xl:px-12 2xl:py-[18px] 2xl:text-[16px]"
              style={{
                background: t.ctaBtnBg,
                color: t.ctaBtnTextColor,
                boxShadow: t.ctaBtnShadow,
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
              <span className="relative z-10">Hemen Başla →</span>
              <div
                className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{ background: t.ctaBtnBgHover }}
              />
            </Link>
          </MagneticButton>

          <MagneticButton className="w-[86%] self-center sm:w-auto sm:self-auto">
            <Link
              href="/login"
              className="dn-cta-ghost block w-full rounded-[1.6rem] border border-[var(--border)] py-[9px] text-center text-[clamp(0.94rem,3.8vw,1.06rem)] font-medium tracking-[0.01em] text-[var(--text-primary)] backdrop-blur-sm transition-all duration-300 hover:bg-[var(--surface-strong)] sm:rounded-2xl sm:px-9 sm:py-[11px] sm:text-[14px] 2xl:px-12 2xl:py-[17px] 2xl:text-[16px]"
              style={{ background: "color-mix(in srgb, var(--bg-card) 92%, white 8%)" }}
            >
              Giriş Yap
            </Link>
          </MagneticButton>
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
