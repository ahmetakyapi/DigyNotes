"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

interface TextRevealProps {
  readonly text: string;
  readonly className?: string;
  readonly delay?: number;
  readonly stagger?: number;
}

export function TextRevealByChar({
  text,
  className = "",
  delay = 0,
  stagger = 0.025,
}: TextRevealProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <span ref={ref} className={className}>
      {text.split("").map((char, i) => (
        <motion.span
          key={`${char}-${i}`}
          className="inline-block"
          style={char === " " ? { width: "0.3em" } : undefined}
          initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
          animate={isInView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
          transition={{
            duration: 0.45,
            delay: delay + i * stagger,
            ease: [0.22, 0.68, 0.32, 1.0],
          }}
        >
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </span>
  );
}

interface GradientTextProps {
  readonly children: React.ReactNode;
  readonly gradient: string;
  readonly className?: string;
  readonly glow?: string;
}

export function GradientText({ children, gradient, className = "", glow }: GradientTextProps) {
  return (
    <span
      className={`inline-block ${className}`}
      style={{
        background: gradient,
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        ...(glow ? { filter: `drop-shadow(0 0 36px ${glow})` } : {}),
      }}
    >
      {children}
    </span>
  );
}
