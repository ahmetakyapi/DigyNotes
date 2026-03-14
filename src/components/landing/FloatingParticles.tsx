"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/components/ThemeProvider";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
}

export function FloatingParticles({ count = 24 }: { readonly count?: number }) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    // Mobilde particle sayısını azalt (performans)
    const isMobile = globalThis.window !== undefined && globalThis.window.innerWidth < 640;
    const actualCount = isMobile ? Math.min(count, 10) : count;
    setParticles(
      Array.from({ length: actualCount }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 1,
        duration: Math.random() * 12 + 10,
        delay: Math.random() * 6,
        opacity: Math.random() * 0.25 + 0.05,
      }))
    );
  }, [count]);

  if (particles.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: isLight
              ? `radial-gradient(circle, rgba(16,185,129,${p.opacity * 1.8}) 0%, rgba(52,211,153,${p.opacity}) 42%, rgba(16,185,129,0) 72%)`
              : `radial-gradient(circle, rgba(16,185,129,${p.opacity * 2}) 0%, rgba(16,185,129,0) 70%)`,
            boxShadow: isLight
              ? `0 0 ${p.size * 5}px rgba(16,185,129,${p.opacity * 0.6})`
              : `0 0 ${p.size * 4}px rgba(16,185,129,${p.opacity})`,
          }}
          animate={{
            y: [0, -30 - Math.random() * 40, 0],
            x: [0, (Math.random() - 0.5) * 30, 0],
            opacity: [p.opacity, p.opacity * 1.8, p.opacity],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
