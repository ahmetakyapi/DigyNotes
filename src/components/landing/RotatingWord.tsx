"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EASE } from "@/lib/variants";

const WORDS = ["İzlediklerin", "Oynadıkların", "Okudukların", "Gezdiklerin"];

const WORD_STYLES = [
  {
    // İzlediklerin — koyu indigo-mavi
    gradient: "linear-gradient(135deg, #5c8ad0 0%, #3660b8 28%, #1c449c 56%, #0e3080 100%)",
  },
  {
    // Oynadıkların — koyu mor
    gradient: "linear-gradient(135deg, #a880d8 0%, #7c50c0 28%, #5c30a8 56%, #401890 100%)",
  },
  {
    // Okudukların — koyu amber
    gradient: "linear-gradient(135deg, #d4a050 0%, #b88028 28%, #9c6818 56%, #805010 100%)",
  },
  {
    // Gezdiklerin — turkuaz-mavi, "Sana Kalanlar" yeşilinden ayrışsın
    gradient: "linear-gradient(135deg, #6fd6eb 0%, #35b8d8 28%, #1f8fb5 56%, #156c8f 100%)",
  },
];

const INTERVAL = 2600;

export function RotatingWord() {
  const [index, setIndex] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % WORDS.length);
    }, INTERVAL);
    return () => clearInterval(interval);
  }, [isMounted]);

  const style = WORD_STYLES[index];
  const word = WORDS[index];

  // SSR ve hydration sırasında sabit render
  if (!isMounted) {
    return (
      <span
        className="inline-block text-center"
        style={{
          background: WORD_STYLES[0].gradient,
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          color: "transparent",
          transform: "translateZ(0)",
        }}
      >
        {WORDS[0]}
      </span>
    );
  }

  return (
    <span
      className="relative inline-flex items-center justify-center"
      style={{ minHeight: "1.15em" }}
    >
      {/* Invisible sizer — en uzun kelimeye göre genişlik reserve et */}
      <span className="pointer-events-none invisible select-none" aria-hidden="true">
        {WORDS.reduce((a, b) => (a.length >= b.length ? a : b), WORDS[0])}
      </span>

      {/* Animated word — absolute overlay */}
      <AnimatePresence mode="wait">
        <motion.span
          key={index}
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.45, ease: EASE }}
        >
          <span
            style={{
              background: style.gradient,
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              color: "transparent",
              whiteSpace: "nowrap",
            }}
          >
            {word}
          </span>
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
