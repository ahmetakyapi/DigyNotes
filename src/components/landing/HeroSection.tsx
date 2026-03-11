"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";
import { useTheme } from "@/components/ThemeProvider";
import { MagneticButton } from "./MagneticButton";
import { RotatingWord } from "./RotatingWord";
import { FloatingParticles } from "./FloatingParticles";

export function HeroSection() {
  const { theme } = useTheme();
  const isLight = theme === "light";
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
        {/* Tek merkezi altın glow — "Tek Yerde" hizasında, aşağıda */}
        <div
          className="dn-aurora-float-3 absolute bottom-[18%] left-1/2 h-[200px] w-[340px] -translate-x-1/2 rounded-full opacity-[0.10] blur-[120px] sm:h-[300px] sm:w-[600px] sm:opacity-[0.12]"
          style={{
            background: isLight
              ? "radial-gradient(circle, rgba(231,192,109,0.95) 0%, rgba(195,145,63,0.42) 42%, rgba(255,255,255,0) 76%)"
              : "radial-gradient(circle, #c4a24b 0%, #8a6820 50%, transparent 75%)",
          }}
        />
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.016] sm:hidden"
          style={{
            backgroundImage:
              isLight
                ? "linear-gradient(rgba(112,86,55,0.28) 1px, transparent 1px), linear-gradient(90deg, rgba(112,86,55,0.28) 1px, transparent 1px)"
                : "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
            backgroundSize: "78px 78px",
          }}
        />
        <div
          className="absolute inset-0 hidden opacity-[0.018] sm:block"
          style={{
            backgroundImage:
              isLight
                ? "linear-gradient(rgba(112,86,55,0.22) 1px, transparent 1px), linear-gradient(90deg, rgba(112,86,55,0.22) 1px, transparent 1px)"
                : "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />
      </motion.div>

      {/* ── Floating Particles ── */}
      <FloatingParticles count={20} />

      {/* ── Floating geometric shapes (desktop only) ── */}
      <div className="pointer-events-none absolute inset-0 hidden overflow-hidden sm:block">
        <motion.div
          className="absolute right-[12%] top-[18%] h-20 w-20 rounded-full border"
          style={{ borderColor: isLight ? "rgba(184,138,62,0.22)" : "rgba(196,162,75,0.12)" }}
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute bottom-[22%] left-[8%] h-6 w-6 rotate-45 rounded-sm border"
          style={{ borderColor: isLight ? "rgba(98,121,188,0.26)" : "rgba(129,140,248,0.15)" }}
          animate={{ y: [0, -20, 0], opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute right-[22%] top-[65%] h-3 w-3 rounded-full"
          style={{ background: isLight ? "rgba(184,138,62,0.26)" : "rgba(196,162,75,0.15)" }}
          animate={{ y: [0, -15, 0], scale: [1, 1.5, 1] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        <motion.div
          className="absolute bottom-[30%] left-[18%] h-32 w-32 rounded-full border"
          style={{ borderColor: isLight ? "rgba(81,145,118,0.16)" : "rgba(80,160,120,0.06)" }}
          animate={{ rotate: -360, scale: [1, 1.05, 1] }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute left-[45%] top-[12%]"
          animate={{ rotate: [0, 90, 180, 270, 360], opacity: [0.15, 0.4, 0.15] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        >
          <div
            className="h-px w-5"
            style={{ background: isLight ? "rgba(184,138,62,0.44)" : "rgba(196,162,75,0.3)" }}
          />
          <div
            className="absolute left-1/2 top-1/2 h-5 w-px -translate-x-1/2 -translate-y-1/2"
            style={{ background: isLight ? "rgba(184,138,62,0.44)" : "rgba(196,162,75,0.3)" }}
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
          initial={{ opacity: 0, y: -14, scale: 0.88, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.7, delay: 0.05, ease: [0.16, 0.8, 0.24, 1] }}
        >
          <div
            className="dn-badge-sheen dn-section-pill relative mb-1 mt-2 flex items-center gap-2 rounded-full border px-4 py-1.5 backdrop-blur-md sm:mb-1 sm:mt-0 sm:gap-3 sm:px-5 sm:py-2 2xl:px-6 2xl:py-2.5"
            style={{
              background:
                "linear-gradient(135deg, rgba(201,168,76,0.12), rgba(129,140,248,0.08), rgba(255,107,53,0.08))",
              borderColor: "color-mix(in srgb, var(--gold) 28%, transparent)",
            }}
          >
            <span
              className="dn-dot-pulse h-1.5 w-1.5 rounded-full shadow-[0_0_8px_#c4a24b] sm:h-2 sm:w-2"
              style={{ background: "radial-gradient(circle, #fbbf24, #c4a24b)" }}
            />
            <span
              className="text-[10px] font-bold uppercase tracking-[0.2em] sm:text-xs"
              style={{
                background: "linear-gradient(90deg, var(--gold), var(--gold-light))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
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
              initial={{ opacity: 0, y: 28, filter: "blur(14px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.85, delay: 0.12, ease: [0.16, 0.8, 0.24, 1] }}
            >
              <RotatingWord />
            </motion.span>

            <motion.span
              className="mb-0.5 block px-[0.04em] py-[0.08em] sm:mb-1"
              initial={{ opacity: 0, y: 28, filter: "blur(14px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.85, delay: 0.24, ease: [0.16, 0.8, 0.24, 1] }}
            >
              <span
                style={{
                  background: isLight
                    ? "linear-gradient(135deg, #3b9e7c 0%, #2f8f72 22%, #267c64 44%, #1c6c56 66%, #145445 100%)"
                    : "linear-gradient(135deg, #48c890 0%, #28a068 22%, #148850 44%, #0a7040 66%, #065830 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Sana Kalanlar
              </span>
            </motion.span>

            <motion.span
              className="dn-shimmer-text mt-1 block px-[0.04em] pb-[0.06em] pt-[0.04em] sm:mt-1.5"
              initial={{ opacity: 0, y: 28, filter: "blur(14px)", scale: 0.95 }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)", scale: 1 }}
              transition={{ duration: 0.85, delay: 0.38, ease: [0.16, 0.8, 0.24, 1] }}
              style={{
                fontSize: "1.08em",
                background: isLight
                  ? "linear-gradient(90deg, #d8ae39 0%, #c7931f 18%, #b77719 38%, #c28d25 58%, #ddb852 80%, #d8ae39 100%)"
                  : "linear-gradient(90deg, #fff4b8 0%, #f8d038 16%, #e8a818 36%, #f0c028 56%, #fcd848 76%, #fff4b8 100%)",
                backgroundSize: "200% 100%",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                filter: isLight
                  ? "drop-shadow(0 6px 14px rgba(191, 139, 37, 0.18))"
                  : "drop-shadow(0 0 20px rgba(248, 208, 40, 0.35))",
              }}
            >
              Tek Yerde
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
              className="dn-cta-gold group relative block w-full overflow-hidden rounded-[1.6rem] py-[10px] text-center text-[clamp(0.98rem,4vw,1.12rem)] font-semibold tracking-[0.01em] text-[#1b1307] shadow-[0_8px_24px_rgba(198,151,46,0.34)] transition-all duration-300 hover:shadow-[0_16px_48px_rgba(198,151,46,0.5)] sm:rounded-2xl sm:px-9 sm:py-[12px] sm:text-[14px] 2xl:px-12 2xl:py-[18px] 2xl:text-[16px]"
              style={{ background: "linear-gradient(135deg, #e7bf5d, #c6972e, #b37a16, #cf9d2f)" }}
            >
              <span className="relative z-10">Hemen Başla →</span>
              <div
                className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{
                  background: "linear-gradient(135deg, #efca67, #d0a23d, #bc841c, #d6a83a)",
                }}
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
          <div className="h-8 w-5 rounded-full border border-[rgba(196,162,75,0.3)] p-1">
            <motion.div
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: "rgba(196,162,75,0.6)" }}
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
