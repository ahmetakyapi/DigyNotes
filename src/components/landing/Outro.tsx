"use client";

/*
  LAYOUT:
  STEPS — label + heading, then 3 full-width rows (huge outline numeral · title · copy · arrow);
          hovering a row fills the numeral and slides the content.
  CTA   — oversized two-line statement with a magnetic circular button pinned beside it.
  FOOTER — 3 link columns + back-to-top, then a full-bleed giant wordmark cropped at the bottom edge.
*/
import Link from "next/link";
import { ArrowUpIcon, ArrowUpRightIcon } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { EASE_OUT_EXPO, FadeUp, Magnetic, MaskLine } from "./Motion";

const STEPS = [
  {
    n: "01",
    t: "Hesap Oluştur",
    d: "E-posta ve şifrenle yarım dakikada üye ol. Kart bilgisi istemiyoruz.",
  },
  {
    n: "02",
    t: "Ne İzlediğini Ekle",
    d: "Adını yazıp listeden seç; kapak ve bilgiler kendiliğinden dolar. Sonra puanını ver.",
  },
  {
    n: "03",
    t: "Düşüncelerini Yaz",
    d: "İstediğin kadar uzun yaz, etiket ekle, gerekirse spoiler uyarısı koy. İstersen paylaş, istersen sadece sende kalsın.",
  },
];

export function Steps() {
  return (
    <section
      id="nasil"
      className="mx-auto max-w-[1600px] scroll-mt-20 px-5 py-16 sm:px-10 md:py-24"
    >
      <div className="grid gap-6 md:grid-cols-[1fr_2fr]">
        <span className="dn-mono text-[10.5px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
          <span className="text-[var(--gold)]">(06)</span> Nasıl Çalışır
        </span>
        <h2 className="text-[clamp(2.6rem,6vw,6rem)] font-extrabold leading-[0.92] tracking-[-0.035em] text-[var(--text-primary)]">
          <MaskLine>
            Üç Adımda{" "}
            <span className="dn-display font-normal italic tracking-[-0.02em]">Hazırsın.</span>
          </MaskLine>
        </h2>
      </div>

      <ol className="mt-10 border-t border-[var(--border)]">
        {STEPS.map((s, i) => (
          <FadeUp key={s.n} delay={i * 0.08}>
            <li className="group relative grid cursor-default items-center gap-4 overflow-hidden border-b border-[var(--border)] py-6 md:grid-cols-[minmax(160px,1fr)_1.4fr_1.6fr_auto] md:gap-10 md:py-9">
              <span className="absolute inset-0 origin-bottom scale-y-0 bg-[var(--bg-card)] transition-transform duration-700 ease-out-expo group-hover:scale-y-100" />
              <span className="dn-display relative text-[clamp(4rem,8vw,7.5rem)] italic leading-[0.8] text-transparent transition-colors duration-500 [-webkit-text-stroke:1px_var(--text-muted)] group-hover:text-[var(--gold)] group-hover:[-webkit-text-stroke:1px_var(--gold)]">
                {s.n}
              </span>
              <h3 className="relative text-2xl font-bold tracking-[-0.035em] text-[var(--text-primary)] transition-transform duration-700 ease-out-expo group-hover:translate-x-2 sm:text-3xl">
                {s.t}
              </h3>
              <p className="relative max-w-[460px] text-[15px] leading-relaxed text-[var(--text-secondary)]">
                {s.d}
              </p>
              <span className="relative hidden h-12 w-12 items-center justify-center rounded-full border border-[var(--border)] text-[var(--text-muted)] transition-all duration-500 ease-out-expo group-hover:rotate-45 group-hover:border-[var(--gold)] group-hover:bg-[var(--gold)] group-hover:text-[var(--text-on-accent)] md:flex">
                <ArrowUpRightIcon size={18} />
              </span>
            </li>
          </FadeUp>
        ))}
      </ol>
    </section>
  );
}

export function FinalCta() {
  return (
    <section className="relative overflow-hidden px-5 pb-16 pt-8 sm:px-10 md:pb-24 md:pt-10">
      <div className="mx-auto flex max-w-[1600px] flex-col items-start gap-12 lg:flex-row lg:items-center lg:justify-between">
        <h2 className="text-[clamp(3.4rem,12vw,13rem)] font-extrabold leading-[0.86] tracking-[-0.04em] text-[var(--text-primary)]">
          <MaskLine>
            Unutmadan{" "}
            <span className="dn-display font-normal italic tracking-[-0.03em]">Not Al</span>
            <span className="text-[var(--gold)]">.</span>
          </MaskLine>
        </h2>
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: EASE_OUT_EXPO, delay: 0.2 }}
          className="self-end lg:self-auto"
        >
          <Magnetic strength={0.4}>
            <Link
              href="/register"
              data-cursor=""
              className="group relative flex h-44 w-44 items-center justify-center overflow-hidden rounded-full bg-[var(--gold)] text-[var(--text-on-accent)] transition-transform duration-500 ease-out-expo active:scale-95 sm:h-56 sm:w-56"
            >
              <span className="absolute inset-0 scale-0 rounded-full bg-[var(--text-primary)] transition-transform duration-700 ease-out-expo group-hover:scale-100" />
              <span className="relative flex flex-col items-center gap-1 transition-colors duration-500 group-hover:text-[var(--bg-base)]">
                <ArrowUpRightIcon
                  size={28}
                  weight="bold"
                  className="transition-transform duration-700 ease-out-expo group-hover:rotate-45"
                />
                <span className="text-lg font-bold tracking-[-0.02em]">Ücretsiz Başla</span>
              </span>
            </Link>
          </Magnetic>
        </motion.div>
      </div>
    </section>
  );
}

export function LandingFooter() {
  const cols = [
    {
      t: "Sayfa",
      l: [
        ["Neler Var", "#arsivler"],
        ["Uygulama", "#vitrin"],
        ["Özellikler", "#ozellikler"],
        ["Nasıl Çalışır", "#nasil"],
      ],
    },
    {
      t: "Uygulama",
      l: [
        ["Giriş Yap", "/login"],
        ["Kayıt Ol", "/register"],
        ["Keşfet", "/discover"],
      ],
    },
    {
      t: "Yapan",
      l: [
        ["ahmetakyapi.com", "https://www.ahmetakyapi.com"],
        ["GitHub", "https://github.com/ahmetakyapi"],
      ],
    },
  ];
  return (
    <footer className="relative overflow-hidden border-t border-[var(--border)] pt-12">
      <div className="mx-auto grid max-w-[1600px] gap-10 px-5 sm:px-10 md:grid-cols-[2fr_1fr_1fr_1fr_auto]">
        <p className="dn-display max-w-[340px] text-3xl italic leading-tight text-[var(--text-secondary)]">
          İzlediklerin, Okudukların, Gezdiklerin —{" "}
          <span className="text-[var(--text-primary)]">Hepsi Bir Yerde.</span>
        </p>
        {cols.map((c) => (
          <div key={c.t}>
            <p className="dn-mono mb-4 text-[10.5px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
              {c.t}
            </p>
            <ul className="space-y-2">
              {c.l.map(([label, href]) => {
                const external = href.startsWith("http");
                return (
                  <li key={label}>
                    <a
                      href={href}
                      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
                      className="group inline-flex items-center gap-1 text-[15px] text-[var(--text-primary)] transition-colors duration-200 hover:text-[var(--gold)]"
                    >
                      {label}
                      {external && (
                        <ArrowUpRightIcon
                          size={12}
                          className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                        />
                      )}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
        <button
          type="button"
          onClick={() => globalThis.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Yukarı Dön"
          className="flex h-12 w-12 cursor-pointer items-center justify-center self-start rounded-full border border-[var(--border)] text-[var(--text-secondary)] transition-all duration-300 hover:-translate-y-1 hover:border-[var(--text-primary)] hover:text-[var(--text-primary)] active:scale-95"
        >
          <ArrowUpIcon size={16} />
        </button>
      </div>

      <div className="dn-mono mx-auto mt-10 flex max-w-[1600px] flex-wrap justify-between gap-2 px-5 text-[10.5px] uppercase tracking-[0.14em] text-[var(--text-muted)] sm:px-10">
        <span>© {new Date().getFullYear()} DigyNotes</span>
        <span>Ücretsiz · Kişisel Kullanım İçin</span>
      </div>

      <div aria-hidden className="relative mt-6 select-none overflow-hidden leading-none">
        <p className="translate-y-[18%] whitespace-nowrap text-center text-[21.5vw] font-extrabold leading-[0.8] tracking-[-0.045em] text-[var(--text-primary)]">
          Digy<span className="dn-display font-normal italic tracking-[-0.04em]">Notes</span>
          <span className="text-[var(--gold)]">.</span>
        </p>
      </div>
    </footer>
  );
}
