"use client";

import Link from "next/link";

export default function PostError({ reset }: { reset: () => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#e53e3e]">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
        </svg>
      </div>
      <h2 className="mb-2 text-lg font-semibold text-[var(--text-primary)]">Not yüklenirken bir hata oluştu</h2>
      <p className="mb-6 max-w-sm text-sm text-[var(--text-muted)]">
        Sayfa beklenmedik bir hatayla karşılaştı. Tekrar deneyebilir veya notlarına geri dönebilirsin.
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-5 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--gold)]"
        >
          Tekrar dene
        </button>
        <Link
          href="/notes"
          className="rounded-lg bg-gradient-to-r from-[#10b981] via-[#059669] to-[#047857] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:brightness-110"
        >
          Notlarıma dön
        </Link>
      </div>
    </div>
  );
}
