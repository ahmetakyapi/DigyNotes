"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

interface RevealProps {
  readonly children: React.ReactNode;
  readonly delay?: number;
  readonly duration?: number;
  readonly y?: number;
  readonly className?: string;
  readonly once?: boolean;
}

export function Reveal({
  children,
  delay = 0,
  duration = 0.7,
  y = 24,
  className,
  once = true,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y, filter: "blur(8px)" }}
      animate={isInView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
      transition={{
        duration,
        delay,
        ease: [0.16, 0.8, 0.24, 1],
      }}
    >
      {children}
    </motion.div>
  );
}

interface StaggerRevealProps {
  readonly children: React.ReactNode[];
  readonly stagger?: number;
  readonly delay?: number;
  readonly className?: string;
  readonly itemClassName?: string;
  readonly once?: boolean;
}

export function StaggerReveal({
  children,
  stagger = 0.1,
  delay = 0,
  className,
  itemClassName,
  once = true,
}: StaggerRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, margin: "-40px" });

  return (
    <div ref={ref} className={className}>
      {children.map((child, i) => (
        <motion.div
          // eslint-disable-next-line react/no-array-index-key
          key={`stagger-${i}`}
          className={itemClassName}
          initial={{ opacity: 0, y: 28, filter: "blur(6px)" }}
          animate={isInView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
          transition={{
            duration: 0.65,
            delay: delay + i * stagger,
            ease: [0.16, 0.8, 0.24, 1],
          }}
        >
          {child}
        </motion.div>
      ))}
    </div>
  );
}

interface ScaleRevealProps {
  readonly children: React.ReactNode;
  readonly delay?: number;
  readonly className?: string;
  readonly once?: boolean;
}

export function ScaleReveal({ children, delay = 0, className, once = true }: ScaleRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, scale: 0.9, filter: "blur(12px)" }}
      animate={isInView ? { opacity: 1, scale: 1, filter: "blur(0px)" } : {}}
      transition={{
        duration: 0.8,
        delay,
        ease: [0.16, 0.8, 0.24, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
