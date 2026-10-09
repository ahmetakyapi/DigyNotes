import Link from "next/link";
import { Metadata } from "next";
import { WifiSlashIcon } from "@phosphor-icons/react/ssr";
import { RetryButton } from "@/components/RetryButton";

export const metadata: Metadata = {
  title: "Çevrimdışı",
  description: "Bağlantı geçici olarak kullanılamıyor.",
  robots: {
    index: false,
    follow: false,
  },
};

/* LAYOUT: Full-screen centred editorial offline screen (standalone, no AppShell) — mirrors 404.
   - mono eyebrow "(—) — Bağlantı Yok"
   - giant empty film frame: dashed capsule holding the wifi-slash glyph + mono "Çevrimdışı",
     pulsing apricot dot on its corner
   - Title Case headline with serif-italic accent, one-line copy
   - hairline-divided 3-cell strip (Ne oldu / Ne yapabilirsin / Nasıl toparlanır), mono labels
   - pill actions (retry primary, notes ghost, home text) and a mono footer line
*/
export default function OfflinePage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[var(--bg-base)] px-5 py-16 text-center text-[var(--text-primary)]">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 h-[50vmin] w-[80vmin] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(var(--accent-2-rgb)/0.1),transparent)] blur-2xl"
      />

      <p className="dn-mono relative text-[10.5px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
        <span className="text-[var(--gold)]">(—)</span> — Bağlantı Yok
      </p>

      <div
        aria-hidden
        className="relative mt-8 flex h-[clamp(7rem,22vw,11rem)] w-[clamp(13rem,44vw,22rem)] flex-col items-center justify-center gap-3 rounded-full border-2 border-dashed border-[var(--text-faint)]"
      >
        <WifiSlashIcon className="h-[clamp(2.2rem,7vw,3.4rem)] w-[clamp(2.2rem,7vw,3.4rem)] text-[var(--text-secondary)]" />
        <span className="dn-mono text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">
          Çevrimdışı
        </span>
        <span className="absolute right-[12%] top-[6%] h-3 w-3 animate-pulse rounded-full bg-[var(--accent-2)]" />
      </div>

      <h1 className="relative mt-10 max-w-[680px] text-[clamp(2rem,5vw,3.4rem)] font-extrabold leading-[0.95] tracking-[-0.03em] text-[var(--text-primary)]">
        İnternet <span className="dn-display font-normal italic tracking-[-0.02em]">Bağlantın</span>{" "}
        Yok
        <span className="text-[var(--gold)]">.</span>
      </h1>
      <p className="relative mt-4 max-w-[460px] text-[15px] leading-relaxed text-[var(--text-secondary)]">
        Bağlantın geri geldiğinde kaldığın yerden devam edebilirsin.
      </p>

      <div className="relative mt-10 grid w-full max-w-[720px] gap-px overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--border)] text-left sm:grid-cols-3">
        {[
          {
            n: "01",
            label: "Ne Oldu?",
            text: "İnternet bağlantın kesilmiş ya da sunucuya ulaşılamıyor.",
          },
          {
            n: "02",
            label: "Ne Yapabilirsin?",
            text: "Yeniden dene, daha önce açtığın sayfalara dön veya bağlantının gelmesini bekle.",
          },
          {
            n: "03",
            label: "Sonra?",
            text: "Bağlantı geri geldiğinde bu sayfayı yenilemen yeterli.",
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
          label="Yeniden Dene"
          className="inline-flex h-12 cursor-pointer items-center rounded-full bg-[var(--gold)] px-6 text-sm font-semibold text-[var(--text-on-accent)] transition-all duration-300 ease-out-expo hover:-translate-y-0.5 hover:bg-[var(--gold-light)] active:scale-95"
        />
        <Link
          href="/notes"
          className="inline-flex h-12 cursor-pointer items-center rounded-full border border-[var(--border)] px-6 text-sm font-medium text-[var(--text-secondary)] transition-colors duration-200 hover:border-[var(--text-muted)] hover:text-[var(--text-primary)] active:scale-95"
        >
          Notlara Dön
        </Link>
        <Link
          href="/"
          className="inline-flex h-12 cursor-pointer items-center rounded-full px-4 text-sm font-medium text-[var(--text-muted)] transition-colors duration-200 hover:text-[var(--text-primary)] active:scale-95"
        >
          Ana Sayfa
        </Link>
      </div>

      <p className="dn-mono relative mt-12 text-[10px] uppercase tracking-[0.16em] text-[var(--text-faint)]">
        Ağ · Offline · DigyNotes
      </p>
    </main>
  );
}
