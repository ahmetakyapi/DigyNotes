import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sayfa Bulunamadı",
};

/* LAYOUT: Full-height centred editorial 404 (works standalone and inside AppShell).
   - mono eyebrow "(404) — Sayfa Bulunamadı"
   - giant "4 [capsule] 4": the zero is an empty film frame (dashed capsule + accent dot)
   - Title Case headline with serif-italic accent, one-line copy, two pill actions
   - mono footer line
*/
export default function NotFound() {
  return (
    <div className="relative flex min-h-[calc(100vh-7rem)] flex-col items-center justify-center overflow-hidden px-5 py-16 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 h-[50vmin] w-[80vmin] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(var(--gold-rgb)/0.12),transparent)] blur-2xl"
      />

      <p className="dn-eyebrow relative">
        <span className="text-[var(--gold)]">(404)</span> — Sayfa Bulunamadı
      </p>

      <div
        aria-hidden
        className="relative mt-6 flex items-center gap-[0.06em] text-[clamp(7rem,26vw,16rem)] font-extrabold leading-[0.8] tracking-[-0.04em] text-[var(--text-primary)]"
      >
        <span>4</span>
        <span className="relative inline-flex h-[0.74em] w-[1.25em] items-center justify-center rounded-full border-2 border-dashed border-[var(--text-faint)]">
          <span className="dn-mono text-[0.08em] uppercase tracking-[0.2em] text-[var(--text-muted)]">
            Yok
          </span>
          <span className="absolute -right-[0.02em] -top-[0.02em] h-[0.12em] w-[0.12em] animate-pulse rounded-full bg-[var(--gold)]" />
        </span>
        <span>4</span>
      </div>

      <h1 className="relative mt-8 max-w-[640px] text-[clamp(2rem,5vw,3.4rem)] font-extrabold leading-[0.95] tracking-[-0.03em] text-[var(--text-primary)]">
        Aradığın Sayfa{" "}
        <span className="dn-display font-normal italic tracking-[-0.02em]">Burada</span> Değil
        <span className="text-[var(--gold)]">.</span>
      </h1>
      <p className="relative mt-4 max-w-[440px] text-[15px] leading-relaxed text-[var(--text-secondary)]">
        Bağlantı yanlış olabilir ya da sayfa kaldırılmış. Notların yerinde, merak etme.
      </p>

      <div className="relative mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex h-12 cursor-pointer items-center rounded-full bg-[var(--gold)] px-6 text-sm font-semibold text-[var(--text-on-accent)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[var(--gold-light)] active:scale-95"
        >
          Ana Sayfaya Dön
        </Link>
        <Link
          href="/notes"
          className="inline-flex h-12 cursor-pointer items-center rounded-full border border-[var(--border)] px-6 text-sm font-medium text-[var(--text-secondary)] transition-colors duration-200 hover:border-[var(--text-muted)] hover:text-[var(--text-primary)] active:scale-95"
        >
          Notlarıma Git
        </Link>
      </div>

      <p className="relative mt-12 text-[12px] text-[var(--text-muted)] font-medium">
        HTTP 404 · Not Found · DigyNotes
      </p>
    </div>
  );
}
