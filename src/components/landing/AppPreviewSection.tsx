"use client";

import { EASE } from "@/lib/variants";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { motion, useSpring, useScroll, useTransform } from "framer-motion";
import { useTheme } from "@/components/ThemeProvider";

export function AppPreviewSection() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const sectionRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Scroll-based parallax
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const parallaxY = useTransform(scrollYProgress, [0, 1], [40, -40]);

  // 3D tilt on hover
  const rotateX = useSpring(0, { damping: 25, stiffness: 180 });
  const rotateY = useSpring(0, { damping: 25, stiffness: 180 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      rotateX.set((e.clientY - cy) / 20);
      rotateY.set((cx - e.clientX) / 20);
    },
    [rotateX, rotateY]
  );

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    rotateX.set(0);
    rotateY.set(0);
  }, [rotateX, rotateY]);

  const mockCards = [
    { color: "rgba(255,107,53,0.12)", border: "rgba(255,107,53,0.15)", id: "film" },
    { color: "rgba(14,165,233,0.12)", border: "rgba(14,165,233,0.15)", id: "game" },
    { color: "rgba(16,185,129,0.10)", border: "rgba(16,185,129,0.15)", id: "book" },
    { color: "rgba(96,165,250,0.10)", border: "rgba(96,165,250,0.12)", id: "travel" },
  ] as const;

  return (
    <section ref={sectionRef} className="relative px-3 pb-16 pt-4 sm:px-4 sm:pb-20 sm:pt-6">
      <div className="relative mx-auto w-full max-w-4xl">
        {/* Üstten gelen glow çizgisi */}
        <div
          className="absolute -top-px left-1/2 h-px w-3/4 -translate-x-1/2"
          style={{
            background: isLight
              ? "linear-gradient(90deg, transparent, rgba(5,150,105,0.4), rgba(14,165,233,0.2), transparent)"
              : "linear-gradient(90deg, transparent, rgba(16,185,129,0.5), transparent)",
          }}
        />

        <motion.div
          ref={cardRef}
          initial={{ opacity: 0, y: 48, scale: 0.96, filter: "blur(12px)" }}
          whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.9, ease: EASE }}
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={handleMouseLeave}
          className="dn-landing-preview dn-app-preview-shell relative overflow-hidden rounded-xl sm:rounded-2xl"
          style={{
            border: "1px solid var(--border-subtle)",
            background: isLight
              ? "linear-gradient(180deg, rgba(248,250,252,0.98), rgba(240,253,244,0.98))"
              : "linear-gradient(180deg, var(--bg-card), var(--surface-strong))",
            boxShadow: isLight
              ? "0 24px 70px rgba(15,23,42,0.08), 0 8px 22px rgba(15,23,42,0.05)"
              : undefined,
            rotateX,
            rotateY,
            y: parallaxY,
            transformPerspective: 1200,
            transformStyle: "preserve-3d",
          }}
        >
          {/* Hover glow overlay */}
          <motion.div
            className="pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-700"
            style={{
              background: isLight
                ? "radial-gradient(ellipse at 50% 0%, rgba(16,185,129,0.08), rgba(6,182,212,0.04), transparent 65%)"
                : "radial-gradient(ellipse at 50% 0%, rgba(16,185,129,0.05), transparent 60%)",
              opacity: isHovered ? 1 : 0,
            }}
          />

          {/* Tarayıcı çubuğu */}
          <div
            className="flex items-center gap-2 border-b px-3 py-2.5 sm:px-5 sm:py-3.5"
            style={{
              borderColor: "var(--border-subtle)",
              background: isLight
                ? "linear-gradient(180deg, rgba(248,250,252,0.98), rgba(240,244,248,0.96))"
                : "var(--bg-soft)",
            }}
          >
            <div className="flex gap-1.5">
              <motion.div
                className="h-2.5 w-2.5 rounded-full bg-[#ff5f57] sm:h-3 sm:w-3"
                whileHover={{ scale: 1.3 }}
              />
              <motion.div
                className="h-2.5 w-2.5 rounded-full bg-[#febc2e] sm:h-3 sm:w-3"
                whileHover={{ scale: 1.3 }}
              />
              <motion.div
                className="h-2.5 w-2.5 rounded-full bg-[#28c840] sm:h-3 sm:w-3"
                whileHover={{ scale: 1.3 }}
              />
            </div>
            <div
              className="ml-3 flex h-7 max-w-xs flex-1 items-center justify-center gap-2 rounded-lg border"
              style={{
                borderColor: "var(--border-subtle)",
                background: isLight ? "rgba(248,250,252,0.92)" : "var(--bg-card)",
              }}
            >
              <div className="h-2 w-2 rounded-full bg-[#28c840] opacity-60" />
              <span className="text-[12px] font-medium text-[var(--text-muted)]">
                digynotes.app/notes
              </span>
            </div>
          </div>

          {/* Uygulama önizleme içeriği */}
          <div className="p-3 sm:p-6">
            {/* Sahte header */}
            <motion.div
              className="mb-4 flex items-center justify-between sm:mb-5"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Image
                src="/app-logo.png"
                alt="DigyNotes"
                width={120}
                height={35}
                className="w-[96px] object-contain opacity-90 sm:w-[140px]"
                unoptimized
              />
              <div className="flex items-center gap-2">
                <div
                  className="h-7 w-7 rounded-full sm:h-8 sm:w-8"
                  style={{ background: "var(--bg-raised)" }}
                />
                <div
                  className="hidden h-8 w-24 rounded-lg border sm:block"
                  style={{
                    background: "color-mix(in srgb, var(--gold) 12%, transparent)",
                    borderColor: "color-mix(in srgb, var(--gold) 22%, transparent)",
                  }}
                />
              </div>
            </motion.div>

            {/* Sahte sekmeler */}
            <motion.div
              className="mb-4 flex gap-1 overflow-x-auto border-b border-[var(--border-subtle)] pb-3 sm:mb-5 sm:gap-1.5"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              {["Son Notlar", "Film", "Dizi", "Oyun", "Kitap", "Gezi"].map((cat, i) => (
                <div
                  key={cat}
                  className={`flex-shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-colors sm:px-3 sm:text-[11px] ${
                    i === 0 ? "text-[var(--gold)]" : "text-[var(--text-secondary)]"
                  }`}
                  style={
                    i === 0
                      ? {
                          background: "color-mix(in srgb, var(--gold) 12%, transparent)",
                          border: "1px solid color-mix(in srgb, var(--gold) 24%, transparent)",
                        }
                      : { border: "1px solid transparent", background: "transparent" }
                  }
                >
                  {cat}
                </div>
              ))}
            </motion.div>

            {/* Sahte öne çıkan kart */}
            <motion.div
              className="relative mb-2.5 flex h-28 items-end overflow-hidden rounded-xl p-3 sm:mb-4 sm:h-44 sm:rounded-2xl sm:p-5"
              style={{
                background: isLight
                  ? "linear-gradient(135deg, color-mix(in srgb, var(--surface-strong) 86%, #f2e6d3 14%), color-mix(in srgb, var(--bg-card) 82%, #dae5f8 18%), color-mix(in srgb, var(--bg-soft) 88%, #efe0ca 12%))"
                  : "linear-gradient(135deg, color-mix(in srgb, var(--bg-card) 88%, #311742 12%), color-mix(in srgb, var(--bg-soft) 88%, #16274d 12%), var(--surface-strong))",
              }}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(16,185,129,0.12), rgba(14,165,233,0.08), rgba(6,182,212,0.08))",
                }}
              />
              <div className="absolute inset-0 rounded-xl border border-[var(--border-subtle)] sm:rounded-2xl" />
              <div className="relative z-10 w-full">
                <div className="mb-2 flex gap-2 sm:mb-2.5">
                  <div
                    className="h-4 w-12 rounded-sm sm:h-5 sm:w-14"
                    style={{
                      background:
                        "linear-gradient(90deg, rgba(16,185,129,0.5), rgba(16,185,129,0.3))",
                    }}
                  />
                  <div
                    className="h-4 w-16 rounded-sm sm:h-5 sm:w-20"
                    style={{ background: "color-mix(in srgb, var(--bg-overlay) 68%, transparent)" }}
                  />
                </div>
                <div
                  className="mb-1 h-5 w-40 rounded-md sm:mb-1.5 sm:h-6 sm:w-56"
                  style={{ background: "var(--bg-overlay)" }}
                />
                <div
                  className="mb-2 h-3 w-28 rounded-md sm:mb-3 sm:h-4 sm:w-36"
                  style={{ background: "color-mix(in srgb, var(--bg-overlay) 78%, transparent)" }}
                />
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <svg
                      key={s}
                      viewBox="0 0 24 24"
                      className="h-2.5 w-2.5 sm:h-3 sm:w-3"
                      fill={s <= 4 ? "#10b981" : "var(--border)"}
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Sahte kart grid — stagger reveal */}
            <div className="grid grid-cols-2 gap-1.5 sm:gap-3">
              {mockCards.map((c, i) => (
                <motion.div
                  key={c.id}
                  className="flex h-[4.5rem] overflow-hidden rounded-lg sm:h-24 sm:rounded-xl"
                  style={{ background: "var(--surface-strong)", border: `1px solid ${c.border}` }}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.5,
                    delay: 0.6 + i * 0.08,
                    ease: EASE,
                  }}
                >
                  <div
                    className="w-10 flex-shrink-0 rounded-l-lg sm:w-16"
                    style={{
                      background: `linear-gradient(135deg, ${c.color.replace("0.12", "0.25")}, color-mix(in srgb, var(--surface-strong) 84%, black 16%))`,
                    }}
                  />
                  <div className="flex flex-1 flex-col justify-between p-2.5 sm:p-3">
                    <div>
                      <div
                        className="mb-1 h-2 w-12 rounded-full sm:mb-1.5 sm:h-2.5 sm:w-16"
                        style={{
                          background: "color-mix(in srgb, var(--bg-overlay) 88%, transparent)",
                        }}
                      />
                      <div
                        className="h-1.5 w-full rounded-full sm:h-2"
                        style={{
                          background: "color-mix(in srgb, var(--bg-overlay) 58%, transparent)",
                        }}
                      />
                    </div>
                    <div className="mt-auto flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <svg
                          key={s}
                          viewBox="0 0 24 24"
                          className="h-2 w-2 sm:h-2.5 sm:w-2.5"
                          fill={s <= 4 ? "#10b981" : "var(--border)"}
                        >
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Top light reflection */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent 10%, rgba(255,255,255,0.06) 50%, transparent 90%)",
            }}
          />
        </motion.div>

        {/* Altta solma */}
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-40"
          style={{ background: "linear-gradient(to top, var(--bg-base), transparent)" }}
        />
      </div>
    </section>
  );
}
