import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { Metadata } from "next";
import { LandingThemeToggle } from "@/components/LandingThemeToggle";
import { HeroSection } from "@/components/landing/HeroSection";
import { AppPreviewSection } from "@/components/landing/AppPreviewSection";
import { StatsRow } from "@/components/landing/StatsRow";
import {
  FeaturesSection,
  HowItWorksSection,
  BottomCtaSection,
} from "@/components/landing/LandingSections";

// Cursor efekti — sadece client'ta render edilsin, SSR bypass
const SplashCursor = dynamic(
  () => import("@/components/landing/SplashCursor").then((m) => ({ default: m.SplashCursor })),
  { ssr: false }
);

export const metadata: Metadata = {
  title: "DigyNotes — Film, Dizi, Oyun, Kitap ve Gezi Notları",
  description:
    "Film, dizi, oyun, kitap ve gezilerden geriye kalan düşüncelerini tek bir yerde topla. Puan ver, etiketle, keşfet.",
};

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-[var(--bg-base)] text-[var(--text-primary)]">
      {/* Splash cursor — sadece masaüstünde */}
      <SplashCursor />

      {/* ══════════════════════════════════════
          NAV
      ══════════════════════════════════════ */}
      <nav
        className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between px-4 py-3 sm:px-12 sm:py-4"
        style={{ background: "linear-gradient(to bottom, var(--bg-base) 55%, transparent)" }}
      >
        <Image
          src="/app-logo.png"
          alt="DigyNotes"
          width={200}
          height={58}
          className="w-[140px] object-contain sm:w-[200px]"
          priority
          unoptimized
        />
        <div className="flex items-center gap-1.5 sm:gap-2">
          <LandingThemeToggle />
          <Link
            href="/login"
            className="hidden px-5 py-2 text-sm font-medium text-[var(--text-muted)] transition-colors duration-200 hover:text-[var(--text-primary)] sm:block"
          >
            Giriş Yap
          </Link>
          <Link
            href="/login"
            className="px-3 py-2 text-sm font-medium text-[var(--text-muted)] transition-colors duration-200 hover:text-[var(--text-primary)] sm:hidden"
          >
            Giriş
          </Link>
          <Link
            href="/register"
            className="rounded-xl px-4 py-2 text-sm font-semibold tracking-[0.01em] text-[#1b1307] shadow-lg transition-all duration-200 hover:-translate-y-px hover:opacity-90 sm:px-5 sm:py-2.5"
            style={{ background: "linear-gradient(135deg, #ebc15c, #c6972e, #b77f18)" }}
          >
            Kayıt Ol
          </Link>
        </div>
      </nav>

      {/* ══════════════════════════════════════
          HERO
      ══════════════════════════════════════ */}
      <HeroSection />

      {/* ══════════════════════════════════════
          APP ÖNİZLEME
      ══════════════════════════════════════ */}
      <AppPreviewSection />

      {/* ══════════════════════════════════════
          İSTATİSTİKLER
      ══════════════════════════════════════ */}
      <StatsRow />

      {/* ══════════════════════════════════════
          FEATURES
      ══════════════════════════════════════ */}
      <FeaturesSection />

      {/* ══════════════════════════════════════
          NASIL ÇALIŞIR
      ══════════════════════════════════════ */}
      <HowItWorksSection />

      {/* ══════════════════════════════════════
          BOTTOM CTA
      ══════════════════════════════════════ */}
      <BottomCtaSection />

      {/* ══════════════════════════════════════
          FOOTER
      ══════════════════════════════════════ */}
      <footer className="relative flex items-center justify-center border-t border-[var(--border)] px-6 py-6">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.15), transparent)",
          }}
        />
        <p className="text-xs text-[var(--text-muted)]">
          © {new Date().getFullYear()} DigyNotes · Kişisel kullanım için.
        </p>
      </footer>
    </div>
  );
}
