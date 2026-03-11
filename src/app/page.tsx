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
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";

// Client-only components
const SplashCursor = dynamic(
  () => import("@/components/landing/SplashCursor").then((m) => ({ default: m.SplashCursor })),
  { ssr: false }
);
const ScrollProgress = dynamic(
  () => import("@/components/landing/ScrollProgress").then((m) => ({ default: m.ScrollProgress })),
  { ssr: false }
);
const CategoryShowcase = dynamic(
  () =>
    import("@/components/landing/CategoryShowcase").then((m) => ({
      default: m.CategoryShowcase,
    })),
  { ssr: false }
);

export const metadata: Metadata = {
  title: "DigyNotes — Film, Dizi, Oyun, Kitap ve Gezi Notları",
  description:
    "Film, dizi, oyun, kitap ve gezilerden geriye kalan düşüncelerini tek bir yerde topla. Puan ver, etiketle, keşfet.",
};

export default function LandingPage() {
  return (
    <div className="dn-landing-page flex min-h-screen flex-col overflow-x-hidden bg-[var(--bg-base)] text-[var(--text-primary)]">
      {/* Scroll progress bar */}
      <ScrollProgress />

      {/* Splash cursor — sadece masaüstünde */}
      <SplashCursor />

      {/* ══════════════════════════════════════
          NAV
      ══════════════════════════════════════ */}
      <nav
        className="dn-landing-nav fixed left-0 right-0 top-0 z-50 flex items-center justify-between px-4 py-3 sm:px-12 sm:py-4"
        style={{ background: "linear-gradient(to bottom, var(--bg-base) 55%, transparent)" }}
      >
        <Image
          src="/app-logo.png"
          alt="DigyNotes"
          width={200}
          height={58}
          className="w-[120px] object-contain sm:w-[200px]"
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
            className="rounded-xl px-3.5 py-1.5 text-[13px] font-semibold tracking-[0.01em] text-[#1b1307] shadow-lg transition-all duration-200 hover:-translate-y-px hover:opacity-90 sm:px-5 sm:py-2.5 sm:text-sm"
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
          KATEGORİ SHOWCASE
      ══════════════════════════════════════ */}
      <CategoryShowcase />

      {/* ══════════════════════════════════════
          NASIL ÇALIŞIR
      ══════════════════════════════════════ */}
      <HowItWorksSection />

      {/* ══════════════════════════════════════
          KULLANICI YORUMLARI
      ══════════════════════════════════════ */}
      <TestimonialsSection />

      {/* ══════════════════════════════════════
          BOTTOM CTA
      ══════════════════════════════════════ */}
      <BottomCtaSection />

      {/* ══════════════════════════════════════
          FOOTER
      ══════════════════════════════════════ */}
      <footer className="dn-landing-footer relative border-t border-[var(--border)] px-4 py-5 sm:px-6 sm:py-6">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.15), transparent)",
          }}
        />
        <div className="mx-auto grid w-full max-w-6xl gap-2 text-xs text-[var(--text-muted)] sm:grid-cols-[1fr_auto_1fr] sm:items-center">
          <div className="hidden sm:block" />
          <p className="text-center sm:col-start-2">
            © {new Date().getFullYear()} DigyNotes · Kişisel kullanım için.
          </p>
          <a
            href="https://github.com/ahmetakyapi"
            target="_blank"
            rel="noreferrer"
            aria-label="Ahmet Akyapi GitHub Profili"
            className="dn-footer-link inline-flex items-center gap-2 justify-self-end transition-colors duration-200 hover:text-[var(--text-primary)]"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-current">
              <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.09 3.29 9.41 7.86 10.94.58.11.79-.25.79-.56 0-.28-.01-1.2-.02-2.18-3.2.69-3.88-1.36-3.88-1.36-.52-1.33-1.27-1.68-1.27-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.75 1.18 1.75 1.18 1.02 1.75 2.68 1.25 3.33.95.1-.74.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.13 1.17A10.9 10.9 0 0 1 12 6.03c.97 0 1.95.13 2.86.39 2.17-1.48 3.12-1.17 3.12-1.17.62 1.58.23 2.75.11 3.04.74.8 1.18 1.82 1.18 3.07 0 4.41-2.69 5.38-5.26 5.66.41.36.78 1.08.78 2.18 0 1.58-.01 2.85-.01 3.24 0 .31.21.68.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
            </svg>
            <span>/ahmetakyapi</span>
          </a>
        </div>
      </footer>
    </div>
  );
}
