import { getSiteSetting } from "@/lib/site-settings";
import Link from "next/link";
import { RetryButton } from "@/components/RetryButton";

/* LAYOUT: Full-screen centred editorial maintenance screen — mirrors the 404 page.
   - mono eyebrow "(503) — Bakım"
   - giant "5 [capsule] 3": the zero is a dashed film frame labelled "Bakımda" + apricot dot
   - Title Case headline with serif-italic accent, then the admin-set maintenance message
   - hairline-divided 3-cell strip with mono labels
   - pill actions (retry primary, home ghost) and a mono footer line
*/
export default async function MaintenancePage() {
  const message = await getSiteSetting("maintenanceMessage");

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[var(--bg-base)] px-5 py-16 text-center text-[var(--text-primary)]">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 h-[50vmin] w-[80vmin] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(var(--gold-rgb)/0.12),transparent)] blur-2xl"
      />

      <p className="dn-mono relative text-[10.5px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
        <span className="text-[var(--gold)]">(503)</span> — Bakım
      </p>

      <div
        aria-hidden
        className="relative mt-6 flex items-center gap-[0.06em] text-[clamp(7rem,26vw,16rem)] font-extrabold leading-[0.8] tracking-[-0.06em] text-[var(--text-primary)]"
      >
        <span>5</span>
        <span className="relative inline-flex h-[0.74em] w-[1.25em] items-center justify-center rounded-full border-2 border-dashed border-[var(--text-faint)]">
          <span className="dn-mono text-[0.08em] uppercase tracking-[0.2em] text-[var(--text-muted)]">
            Bakımda
          </span>
          <span className="absolute -right-[0.02em] -top-[0.02em] h-[0.12em] w-[0.12em] animate-pulse rounded-full bg-[var(--accent-2)]" />
        </span>
        <span>3</span>
      </div>

      <h1 className="relative mt-8 max-w-[680px] text-[clamp(2rem,5vw,3.4rem)] font-extrabold leading-[0.95] tracking-[-0.045em] text-[var(--text-primary)]">
        Kısa Bir{" "}
        <span className="dn-display font-normal italic tracking-[-0.02em]">Bakımdayız</span>
        <span className="text-[var(--gold)]">.</span>
      </h1>
      <p className="relative mt-4 max-w-[480px] text-[15px] leading-relaxed text-[var(--text-secondary)]">
        {message}
      </p>

      <div className="relative mt-10 grid w-full max-w-[720px] gap-px overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--border)] text-left sm:grid-cols-3">
        {[
          {
            n: "01",
            label: "Neler Oluyor?",
            text: "Siteyi daha iyi hale getirmek için kısa bir güncelleme yapıyoruz.",
          },
          {
            n: "02",
            label: "Bu Sırada?",
            text: "Birkaç dakika sonra tekrar dene. Uzun sürmeyecek.",
          },
          {
            n: "03",
            label: "Notlarım Güvende mi?",
            text: "Evet. Bakım bitince her şey kaldığı gibi açılacak.",
          },
        ].map((c) => (
          <div key={c.n} className="bg-[var(--bg-card)] px-5 py-5">
            <p className="dn-mono text-[10.5px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
              <span className="text-[var(--gold)]">({c.n})</span> {c.label}
            </p>
            <p className="mt-2.5 text-sm leading-6 text-[var(--text-secondary)]">{c.text}</p>
          </div>
        ))}
      </div>

      <div className="relative mt-8 flex flex-wrap items-center justify-center gap-3">
        <RetryButton
          label="Tekrar Dene"
          className="inline-flex h-12 cursor-pointer items-center rounded-full bg-[var(--gold)] px-6 text-sm font-semibold text-[var(--text-on-accent)] transition-all duration-300 ease-out-expo hover:-translate-y-0.5 hover:bg-[var(--gold-light)] active:scale-95"
        />
        <Link
          href="/"
          className="inline-flex h-12 cursor-pointer items-center rounded-full border border-[var(--border)] px-6 text-sm font-medium text-[var(--text-secondary)] transition-colors duration-200 hover:border-[var(--text-muted)] hover:text-[var(--text-primary)] active:scale-95"
        >
          Ana Sayfaya Dön
        </Link>
      </div>

      <p className="dn-mono relative mt-12 text-[10px] uppercase tracking-[0.16em] text-[var(--text-faint)]">
        HTTP 503 · Bakım · DigyNotes
      </p>
    </main>
  );
}
