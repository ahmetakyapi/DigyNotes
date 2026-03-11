"use client";

import { useCallback, useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

interface FeatureCardProps {
  readonly Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  readonly title: string;
  readonly desc: string;
  readonly border: string;
  readonly gradientFrom: string;
  readonly iconColor: string;
  readonly iconBg: string;
  readonly iconBorder: string;
  readonly index: number;
}

export function FeatureCard({
  Icon,
  title,
  desc,
  border,
  gradientFrom,
  iconColor,
  iconBg,
  iconBorder,
  index,
}: FeatureCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  // Mouse spotlight tracking
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // 3D tilt
  const rotateX = useSpring(0, { damping: 20, stiffness: 200 });
  const rotateY = useSpring(0, { damping: 20, stiffness: 200 });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      mouseX.set(x);
      mouseY.set(y);

      // Subtle 3D tilt
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      rotateX.set((y - centerY) / 14);
      rotateY.set((centerX - x) / 14);
    },
    [mouseX, mouseY, rotateX, rotateY]
  );

  const handleMouseLeave = useCallback(() => {
    setHovered(false);
    rotateX.set(0);
    rotateY.set(0);
  }, [rotateX, rotateY]);

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 36, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{
        duration: 0.65,
        delay: index * 0.09,
        ease: [0.16, 0.8, 0.24, 1],
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformPerspective: 800,
        transformStyle: "preserve-3d",
      }}
      className="dn-landing-card group relative overflow-hidden rounded-2xl p-5 last:col-span-2 sm:p-7 sm:last:col-span-1"
    >
      {/* Glassmorphism background */}
      <div
        className="absolute inset-0 rounded-2xl"
        style={{
          background: `linear-gradient(145deg, ${gradientFrom}, color-mix(in srgb, var(--surface-strong) 85%, transparent))`,
          border: `1px solid ${border}`,
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      />

      {/* Mouse-follow spotlight */}
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-2xl transition-opacity duration-500"
        style={{
          opacity: hovered ? 1 : 0,
          background: `radial-gradient(450px circle at ${mouseX.get()}px ${mouseY.get()}px, ${gradientFrom.replace("0.07", "0.18").replace("0.08", "0.2")}, transparent 40%)`,
        }}
      />

      {/* Animated border glow on hover */}
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-2xl"
        style={{
          opacity: hovered ? 1 : 0,
          background: `radial-gradient(350px circle at ${mouseX.get()}px ${mouseY.get()}px, ${iconColor}33, transparent 40%)`,
          mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          maskComposite: "exclude",
          WebkitMaskComposite: "xor",
          padding: "1px",
          transition: "opacity 0.4s ease",
        }}
      />

      {/* Corner accent glow */}
      <div
        className="absolute -right-8 -top-8 h-24 w-24 rounded-full transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle, ${iconColor}15, transparent 70%)`,
          opacity: hovered ? 1 : 0,
        }}
      />

      {/* İkon */}
      <div
        className="relative z-10 mb-3 flex h-10 w-10 items-center justify-center rounded-xl sm:mb-5 sm:h-12 sm:w-12 sm:rounded-[14px]"
        style={{
          background: iconBg,
          border: `1px solid ${iconBorder}`,
          boxShadow: hovered ? `0 0 20px ${iconColor}25, 0 4px 12px ${iconColor}15` : "none",
          transition: "box-shadow 0.4s ease",
        }}
      >
        <motion.div
          animate={hovered ? { rotate: [0, -10, 10, -5, 5, 0], scale: [1, 1.1, 1] } : { rotate: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        >
          <Icon className="h-[18px] w-[18px] sm:h-5 sm:w-5" style={{ color: iconColor }} />
        </motion.div>
      </div>

      {/* Text */}
      <h3 className="relative z-10 mb-1 text-base font-bold text-[var(--text-primary)] sm:mb-2 sm:text-lg">
        {title}
      </h3>
      <p className="relative z-10 text-[13px] leading-[1.8] text-[var(--text-secondary)] sm:text-sm">
        {desc}
      </p>

      {/* Bottom shine line on hover */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px transition-opacity duration-500"
        style={{
          background: `linear-gradient(90deg, transparent 10%, ${iconColor}40 50%, transparent 90%)`,
          opacity: hovered ? 1 : 0,
        }}
      />
    </motion.div>
  );
}
