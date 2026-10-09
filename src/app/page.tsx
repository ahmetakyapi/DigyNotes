import { Metadata } from "next";
import { LandingNav } from "@/components/landing/LandingNav";
import { Hero } from "@/components/landing/Hero";
import { Marquee } from "@/components/landing/Marquee";
import { Manifesto } from "@/components/landing/Manifesto";
import { Archives } from "@/components/landing/Archives";
import { Showcase } from "@/components/landing/Showcase";
import { Features } from "@/components/landing/Features";
import { FinalCta, LandingFooter, Steps } from "@/components/landing/Outro";
import { LandingCursor, SmoothScroll } from "@/components/landing/Motion";

export const metadata: Metadata = {
  title: "DigyNotes — Film, Dizi, Oyun, Kitap ve Gezi Notları",
  description:
    "Film, dizi, oyun, kitap ve gezilerden geriye kalan düşüncelerini tek bir yerde topla. Puan ver, etiketle, keşfet.",
};

/*
  LAYOUT: Single-column editorial scroll, full-bleed sections, max content width 1600px.
  Nav (fixed) → Hero → Marquee → Manifesto → Archives (pinned horizontal) → Showcase
  → Features (bento) → Steps → Final CTA → Footer (giant wordmark).
*/
export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-[var(--bg-base)] text-[var(--text-primary)]">
      <SmoothScroll />
      <LandingCursor />
      <LandingNav />
      <main>
        <Hero />
        <Marquee />
        <Manifesto />
        <Archives />
        <Showcase />
        <Features />
        <Steps />
        <FinalCta />
      </main>
      <LandingFooter />
    </div>
  );
}
