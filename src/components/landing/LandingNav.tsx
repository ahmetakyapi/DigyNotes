"use client";

/*
  LAYOUT: Fixed top bar, 3 zones.
  LEFT: Wordmark · CENTER (lg+): numbered anchor links in mono · RIGHT: theme, login, register pill.
  Hides on scroll-down, returns on scroll-up; gains glass background after the hero fold.
*/
import Link from "next/link";
import { useState } from "react";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { Wordmark } from "@/components/Wordmark";
import { LandingThemeToggle } from "@/components/LandingThemeToggle";

const LINKS = [
  { href: "#arsivler", label: "Neler Var" },
  { href: "#vitrin", label: "Uygulama" },
  { href: "#ozellikler", label: "Özellikler" },
  { href: "#nasil", label: "Nasıl Çalışır" },
];

export function LandingNav() {
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [solid, setSolid] = useState(false);

  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setHidden(y > prev && y > 240);
    setSolid(y > 40);
  });

  return (
    <motion.header
      className="fixed inset-x-0 top-0 z-50"
      animate={{ y: hidden ? "-110%" : "0%" }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div
        className={`mx-auto flex max-w-[1600px] items-center justify-between px-5 py-4 transition-all duration-500 sm:px-10 ${
          solid ? "bg-[var(--header-glass)] backdrop-blur-xl" : "bg-transparent"
        }`}
      >
        <Link
          href="/"
          aria-label="DigyNotes"
          className="transition-opacity duration-200 hover:opacity-75"
        >
          <Wordmark size="md" />
        </Link>

        <nav aria-label="Sayfa bölümleri" className="hidden items-center gap-8 lg:flex">
          {LINKS.map((l, i) => (
            <a
              key={l.href}
              href={l.href}
              className="group flex items-baseline gap-1.5 text-[13px] font-medium text-[var(--text-secondary)] transition-colors duration-200 hover:text-[var(--text-primary)]"
            >
              <span className="dn-mono text-[9.5px] text-[var(--text-faint)] transition-colors duration-200 group-hover:text-[var(--gold)]">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="relative">
                {l.label}
                <span className="absolute -bottom-0.5 left-0 h-px w-full origin-right scale-x-0 bg-current transition-transform duration-500 ease-out-expo group-hover:origin-left group-hover:scale-x-100" />
              </span>
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <LandingThemeToggle />
          <Link
            href="/login"
            className="hidden px-2 text-[13px] font-medium text-[var(--text-secondary)] transition-colors duration-200 hover:text-[var(--text-primary)] sm:block"
          >
            Giriş Yap
          </Link>
          <Link
            href="/register"
            data-cursor=""
            className="group relative inline-flex h-10 items-center overflow-hidden rounded-full bg-[var(--text-primary)] px-5 text-[13px] font-semibold text-[var(--bg-base)] transition-transform duration-300 active:scale-95"
          >
            <span className="absolute inset-0 translate-y-full rounded-full bg-[var(--gold)] transition-transform duration-500 ease-out-expo group-hover:translate-y-0" />
            <span className="relative transition-colors duration-300 group-hover:text-[var(--text-on-accent)]">
              Kayıt Ol
            </span>
          </Link>
        </div>
      </div>
    </motion.header>
  );
}
