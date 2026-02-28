import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Offline",
  description: "Bağlantı geçici olarak kullanılamıyor.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function OfflinePage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--bg-base)] px-4 py-16 text-[var(--text-primary)]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -left-16 top-0 h-72 w-72 rounded-full opacity-[0.08] blur-[120px]"
          style={{
            background: "radial-gradient(circle, #c4a24b 0%, #8a6820 55%, transparent 70%)",
          }}
        />
        <div
          className="absolute bottom-0 right-0 h-80 w-80 rounded-full opacity-[0.08] blur-[120px]"
          style={{
            background: "radial-gradient(circle, #4f6cc6 0%, #263764 55%, transparent 70%)",
          }}
        />
      </div>

      <div className="bg-[var(--bg-card)]/92 relative w-full max-w-xl rounded-[28px] border border-[var(--border)] p-8 text-center shadow-[0_28px_80px_rgba(3,8,20,0.34)] backdrop-blur-xl sm:p-10">
        <div className="border-[#c4a24b]/24 mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border bg-[#c4a24b]/10 text-[var(--gold)]">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              d="M2 8.82A15.91 15.91 0 0 1 12 5c3.4 0 6.55 1.07 9.12 2.9M5 12.86A11.94 11.94 0 0 1 12 10c2.37 0 4.58.69 6.44 1.88M8.5 16.43A7.96 7.96 0 0 1 12 15.5c1.2 0 2.34.26 3.36.73M12 20h.01"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="m3 3 18 18" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--gold)]">
          Offline Mod
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-[var(--text-primary)] sm:text-4xl">
          Bağlantı şu anda kullanılamıyor
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-[var(--text-secondary)] sm:text-[15px]">
          Daha önce açılmış sayfaları tekrar deneyebilirsin. Bağlantı geri geldiğinde uygulama
          normal akışa dönecek.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/notes"
            className="inline-flex min-w-[170px] justify-center rounded-2xl bg-[var(--gold)] px-5 py-3 text-sm font-semibold text-[var(--text-on-accent)] transition-colors hover:bg-[var(--gold-light)]"
          >
            Notlara Dön
          </Link>
          <Link
            href="/"
            className="inline-flex min-w-[170px] justify-center rounded-2xl border border-[var(--border)] bg-[var(--bg-raised)] px-5 py-3 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
          >
            Ana Sayfa
          </Link>
        </div>
      </div>
    </main>
  );
}
