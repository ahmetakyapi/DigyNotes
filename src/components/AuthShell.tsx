"use client";

/*
  LAYOUT: Split screen on lg+, single column below.
  LEFT (lg+, 52%): three poster columns drifting vertically in opposite directions,
        ink gradient veil, editorial headline + mono caption pinned to the bottom.
  RIGHT: top bar (wordmark · back link) → centred form column (max-w-[400px])
         with mono step label, serif title, subtitle, then the page's form → mono footer.
*/
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { ArrowLeftIcon } from "@phosphor-icons/react";
import { Wordmark } from "@/components/Wordmark";

const M = "/landing/media";
const COLS = [
  ["perfect-days", "severance", "kyoto", "stoner", "elden-ring"],
  ["outer-wilds", "aftersun", "kurk-mantolu-madonna", "shogun", "lizbon"],
  ["past-lives", "disco-elysium", "kapadokya", "dark", "klara-and-the-sun"],
];

const COPY = {
  login: {
    label: "Giriş",
    title: (
      <>
        Tekrar <span className="dn-display font-normal italic">Hoş Geldin.</span>
      </>
    ),
    subtitle: "Notların kaldığın yerde seni bekliyor.",
  },
  register: {
    label: "Üye Ol",
    title: (
      <>
        Aramıza <span className="dn-display font-normal italic">Katıl.</span>
      </>
    ),
    subtitle: "Yarım dakikada üye ol, tamamen ücretsiz.",
  },
};

export function AuthShell({ mode, children }: { mode: "login" | "register"; children: ReactNode }) {
  const copy = COPY[mode];
  return (
    <div className="relative grid min-h-screen bg-[var(--bg-base)] lg:grid-cols-[52%_1fr]">
      {/* LEFT — poster wall */}
      <aside
        aria-hidden
        className="relative hidden overflow-hidden border-r border-[var(--border)] bg-[#0b0b0a] lg:block"
      >
        <div className="absolute inset-0 grid -rotate-[4deg] scale-[1.18] grid-cols-3 gap-4 px-4">
          {COLS.map((col, ci) => (
            <div key={ci} className="relative overflow-hidden">
              <div className={`flex flex-col gap-4 ${ci === 1 ? "dn-drift-down" : "dn-drift-up"}`}>
                {[...col, ...col].map((name, i) => (
                  <div
                    key={`${name}-${i}`}
                    className="relative aspect-[2/3] w-full overflow-hidden rounded-2xl"
                  >
                    <Image
                      src={`${M}/${name}.webp`}
                      alt=""
                      fill
                      sizes="20vw"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0a] via-[#0b0b0a]/70 to-[#0b0b0a]/30" />
        <div className="absolute inset-x-0 bottom-0 p-12">
          <p className="dn-mono mb-5 text-[10.5px] uppercase tracking-[0.16em] text-[#a8a399]">
            <span className="text-[#b9a8ff]">(DN)</span> Kişisel Not Defterin
          </p>
          <p className="max-w-[560px] text-[clamp(2.6rem,4.2vw,4.4rem)] font-extrabold leading-[0.92] tracking-[-0.035em] text-[#f2efe8]">
            Sana Kalan Her Şey,{" "}
            <span className="dn-display font-normal italic tracking-[-0.02em]">Burada</span>
            <span className="text-[#b9a8ff]">.</span>
          </p>
          <div className="dn-mono mt-8 flex gap-6 text-[10.5px] uppercase tracking-[0.14em] text-[#77726a]">
            <span>Film</span>
            <span>Dizi</span>
            <span>Oyun</span>
            <span>Kitap</span>
            <span>Gezi</span>
          </div>
        </div>
      </aside>

      {/* RIGHT — form */}
      <div className="relative flex min-h-screen flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            aria-label="DigyNotes ana sayfa"
            className="transition-opacity duration-200 hover:opacity-75"
          >
            <Wordmark size="md" />
          </Link>
          <Link
            href="/"
            className="group inline-flex items-center gap-1.5 text-[13px] text-[var(--text-muted)] transition-colors duration-200 hover:text-[var(--text-primary)]"
          >
            <ArrowLeftIcon
              size={13}
              className="transition-transform duration-300 group-hover:-translate-x-0.5"
            />
            Ana Sayfa
          </Link>
        </div>

        <motion.div
          className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center py-12"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="dn-mono text-[10.5px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
            <span className="text-[var(--gold)]">({mode === "login" ? "01" : "00"})</span>{" "}
            {copy.label}
          </p>
          <h1 className="mt-4 text-[44px] font-extrabold leading-[0.95] tracking-[-0.035em] text-[var(--text-primary)] sm:text-[52px]">
            {copy.title}
          </h1>
          <p className="mb-9 mt-3 text-[15px] text-[var(--text-secondary)]">{copy.subtitle}</p>
          {children}
        </motion.div>

        <p className="dn-mono text-center text-[10px] uppercase tracking-[0.14em] text-[var(--text-faint)]">
          © {new Date().getFullYear()} DigyNotes · Kişisel kullanım için
        </p>
      </div>
    </div>
  );
}
