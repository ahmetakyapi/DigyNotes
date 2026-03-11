"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const WORDS = ["İzlediklerin", "Oynadıkların", "Okudukların", "Gezdiklerin"];

const WORD_STYLES = [
  {
    gradient: "linear-gradient(135deg, #90aadc 0%, #5070c8 45%, #2848a0 100%)",
    glow: "rgba(60, 100, 200, 0.45)",
  },
  {
    gradient: "linear-gradient(135deg, #d4b4f4 0%, #a878e0 45%, #7848c0 100%)",
    glow: "rgba(160, 90, 224, 0.4)",
  },
  {
    gradient: "linear-gradient(135deg, #f0cc98 0%, #d4a060 45%, #b87838 100%)",
    glow: "rgba(212, 152, 72, 0.38)",
  },
  {
    gradient: "linear-gradient(135deg, #9cdcbc 0%, #6cb898 45%, #409870 100%)",
    glow: "rgba(80, 180, 130, 0.38)",
  },
];

const EASE_IN: [number, number, number, number] = [0.22, 0.68, 0.32, 1];
const EASE_OUT: [number, number, number, number] = [0.55, 0, 1, 0.45];

const charVariants = {
  initial: { opacity: 0, y: 24, rotateX: 90, filter: "blur(8px)" },
  animate: (i: number) => ({
    opacity: 1,
    y: 0,
    rotateX: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.4,
      delay: i * 0.03,
      ease: EASE_IN,
    },
  }),
  exit: (i: number) => ({
    opacity: 0,
    y: -18,
    rotateX: -60,
    filter: "blur(6px)",
    transition: {
      duration: 0.28,
      delay: i * 0.02,
      ease: EASE_OUT,
    },
  }),
};

export function RotatingWord() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % WORDS.length);
    }, 2600);
    return () => clearInterval(interval);
  }, []);

  const style = WORD_STYLES[index];
  const word = WORDS[index];

  return (
    <span
      className="relative inline-flex justify-center"
      style={{ minWidth: "min(320px, 80vw)", perspective: "600px" }}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={index}
          className="inline-flex"
          style={{
            background: style.gradient,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            filter: `drop-shadow(0 0 36px ${style.glow})`,
          }}
        >
          {word.split("").map((char, i) => (
            <motion.span
              key={`${index}-${i}`}
              className="inline-block"
              variants={charVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              custom={i}
              style={{ transformOrigin: "center bottom" }}
            >
              {char}
            </motion.span>
          ))}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
