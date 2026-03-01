import { getSiteSetting } from "@/lib/site-settings";
import Link from "next/link";
import { RetryButton } from "@/components/RetryButton";

export default async function MaintenancePage() {
  const message = await getSiteSetting("maintenanceMessage");

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--bg-base)] px-4 py-16 text-[var(--text-primary)]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -left-20 top-0 h-72 w-72 rounded-full opacity-[0.08] blur-[120px]"
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

      <div className="relative w-full max-w-2xl rounded-[32px] border border-[var(--border)] bg-[var(--bg-card)]/94 p-8 shadow-[0_28px_80px_rgba(3,8,20,0.34)] backdrop-blur-xl sm:p-10">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#c4a24b]/20 bg-[#c4a24b]/10">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#c4a24b"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
        </div>

        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--gold)]">
          Bakım Modu
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-[var(--text-primary)] sm:text-4xl">
          Sistem kısa süreliğine düzenleniyor
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-7 text-[var(--text-secondary)] sm:text-[15px]">
          {message}
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-raised)] px-4 py-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-faint)]">
              Neler oluyor?
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              Erişim geçici olarak sınırlandı; amaç veri bütünlüğünü koruyarak güncelleme yapmak.
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-raised)] px-4 py-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-faint)]">
              Bu sırada ne yapabilirsin?
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              Biraz sonra tekrar kontrol edebilir veya ana sayfaya dönüp genel durumu takip
              edebilirsin.
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-raised)] px-4 py-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-faint)]">
              Veri güvende mi?
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              Amaç tam olarak bu: notların ve arşivin korunurken sistem güvenli biçimde açılacak.
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <RetryButton
            label="Durumu tekrar kontrol et"
            className="inline-flex min-w-[220px] justify-center rounded-2xl bg-[var(--gold)] px-5 py-3 text-sm font-semibold text-[var(--text-on-accent)] transition-colors hover:bg-[var(--gold-light)]"
          />
          <Link
            href="/"
            className="inline-flex min-w-[180px] justify-center rounded-2xl border border-[var(--border)] bg-[var(--bg-raised)] px-5 py-3 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
          >
            Ana sayfaya dön
          </Link>
        </div>
      </div>
    </main>
  );
}
