import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";
import { LuFilm, LuTv, LuBookOpen, LuStar, LuPenLine, LuSearch } from "react-icons/lu";

export const metadata: Metadata = {
  title: "DigyNotes — Film, Dizi ve Kitap Notları",
  description: "Film, dizi ve kitaplardan geriye kalan düşüncelerini tek bir yerde topla.",
};

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-[#0c0c0c] text-[#f0ede8]">
      {/* ══════════════════════════════════════
          NAV
      ══════════════════════════════════════ */}
      <nav
        className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between px-4 py-3 sm:px-12 sm:py-4"
        style={{ background: "linear-gradient(to bottom, #0c0c0c 55%, transparent)" }}
      >
        <Image
          src="/app-logo.png"
          alt="DigyNotes"
          width={200}
          height={58}
          className="w-[140px] object-contain sm:w-[200px]"
          priority
          unoptimized
        />
        <div className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/login"
            className="hidden px-5 py-2 text-sm font-medium text-[#666] transition-colors duration-200 hover:text-[#f0ede8] sm:block"
          >
            Giriş Yap
          </Link>
          <Link
            href="/login"
            className="px-3 py-2 text-sm font-medium text-[#666] transition-colors duration-200 hover:text-[#f0ede8] sm:hidden"
          >
            Giriş
          </Link>
          <Link
            href="/register"
            className="rounded-xl px-4 py-2 text-sm font-bold text-[#0a0a0a] shadow-lg transition-all duration-200 hover:-translate-y-px hover:opacity-90 sm:px-5 sm:py-2.5"
            style={{ background: "linear-gradient(135deg, #f0c060, #c9a84c, #d4963a)" }}
          >
            Kayıt Ol
          </Link>
        </div>
      </nav>

      {/* ══════════════════════════════════════
          HERO
      ══════════════════════════════════════ */}
      <section className="relative flex min-h-screen flex-1 flex-col items-center justify-center px-4 pb-16 pt-32">
        {/* ── Arka plan aura katmanları ── */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {/* Sol üst — sıcak bronz tonu */}
          <div
            className="absolute -left-20 -top-20 h-[700px] w-[700px] rounded-full opacity-[0.07] blur-[140px]"
            style={{
              background: "radial-gradient(circle, #c4902a 0%, #7a5010 50%, transparent 70%)",
            }}
          />
          {/* Sağ üst — soğuk çelik tonu */}
          <div
            className="absolute -right-20 -top-10 h-[600px] w-[600px] rounded-full opacity-[0.05] blur-[140px]"
            style={{
              background: "radial-gradient(circle, #6878a0 0%, #3a4a6a 50%, transparent 70%)",
            }}
          />
          {/* Merkez alt — altın parıltı */}
          <div
            className="absolute bottom-0 left-1/2 h-[500px] w-[900px] -translate-x-1/2 rounded-full opacity-[0.06] blur-[160px]"
            style={{
              background: "radial-gradient(circle, #c9a84c 0%, #8a6820 60%, transparent 70%)",
            }}
          />

          {/* İnce grid dokusu */}
          <div
            className="absolute inset-0 opacity-[0.018]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
              backgroundSize: "80px 80px",
            }}
          />

          {/* Merkez parlama — başlığın arkası */}
          <div
            className="absolute left-1/2 top-1/2 h-[250px] w-[500px] -translate-x-1/2 -translate-y-1/2 opacity-[0.05] blur-[90px]"
            style={{ background: "radial-gradient(circle, #c9a84c, transparent 70%)" }}
          />
        </div>

        {/* ── Rozet ── */}
        <div
          className="relative mb-10 flex items-center gap-3 rounded-full border border-white/10 px-5 py-2.5 backdrop-blur-sm"
          style={{
            background:
              "linear-gradient(135deg, rgba(201,168,76,0.1), rgba(129,140,248,0.06), rgba(255,107,53,0.06))",
          }}
        >
          <span
            className="h-2 w-2 rounded-full shadow-[0_0_8px_#c9a84c]"
            style={{ background: "radial-gradient(circle, #fbbf24, #c9a84c)" }}
          />
          <span
            className="text-xs font-bold uppercase tracking-[0.18em]"
            style={{
              background: "linear-gradient(90deg, #c9a84c, #e0c068)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Kişisel Not Defteri
          </span>
        </div>

        {/* ── Başlık ── */}
        <h1
          className="relative mb-8 max-w-4xl text-center font-black leading-[1.2]"
          style={{ fontSize: "clamp(3rem, 8vw, 6rem)", paddingTop: "0.35em" }}
        >
          {/* Satır 1 — Koyu lacivert / sinematik */}
          <span
            className="mb-1 block"
            style={{
              background: "linear-gradient(135deg, #7890c0 0%, #3858a8 45%, #1c3878 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              filter: "drop-shadow(0 0 28px rgba(48, 80, 160, 0.25))",
            }}
          >
            İzlediklerin
          </span>

          {/* Satır 2 — Bej / edebi */}
          <span
            className="mb-1 block"
            style={{
              background: "linear-gradient(135deg, #e8dcc8 0%, #c8b090 45%, #a88c68 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              filter: "drop-shadow(0 0 28px rgba(200, 176, 144, 0.18))",
            }}
          >
            Okudukların
          </span>

          {/* Satır 3 — Altın / vurgulu */}
          <span
            className="block"
            style={{
              background:
                "linear-gradient(135deg, #fceea0 0%, #e8c84a 25%, #c9a030 55%, #e0b840 85%, #fceea0 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              filter: "drop-shadow(0 0 48px rgba(220, 180, 60, 0.45))",
            }}
          >
            Sana Kalanlar
          </span>
        </h1>

        {/* ── Alt metin ── */}
        <p
          className="relative mb-12 max-w-2xl text-center text-[0.95rem] leading-[1.85] sm:text-[1.05rem] lg:text-[1.15rem]"
          style={{ color: "rgba(240,237,232,0.5)" }}
        >
          Film, dizi ve kitaplardan geriye kalan düşüncelerini tek bir yerde topla.
          <br className="hidden sm:block" />
          <span style={{ color: "rgba(240,237,232,0.65)" }}>
            Puanla, kategorize et ve yıllar sonra bile aynı duyguyla geri dön.
          </span>
        </p>

        {/* ── CTA Butonlar ── */}
        <div className="relative mb-20 flex w-full max-w-xs flex-col gap-3 sm:mb-24 sm:w-auto sm:max-w-none sm:flex-row sm:gap-4">
          <Link
            href="/register"
            className="group relative w-full overflow-hidden rounded-2xl px-8 py-4 text-center text-[15px] font-bold text-[#1a0e00] shadow-[0_4px_24px_rgba(201,168,76,0.3)] transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-[0_8px_36px_rgba(201,168,76,0.45)] sm:w-auto sm:px-10"
            style={{ background: "linear-gradient(135deg, #d4a84c, #c9a030, #b88820, #cca038)" }}
          >
            <span className="relative z-10">Hemen Başla →</span>
            <div
              className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              style={{ background: "linear-gradient(135deg, #e0b84c, #d4a030, #c89020, #dab040)" }}
            />
          </Link>
          <Link
            href="/login"
            className="w-full rounded-2xl border border-white/10 px-8 py-4 text-center text-[15px] font-medium backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.04] sm:w-auto sm:px-10"
            style={{ color: "rgba(240,237,232,0.6)" }}
          >
            Giriş Yap
          </Link>
        </div>

        {/* ── App Önizleme ── */}
        <div className="relative w-full max-w-4xl">
          {/* Üstten gelen glow halkası */}
          <div
            className="absolute -top-px left-1/2 h-px w-3/4 -translate-x-1/2"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.6), transparent)",
            }}
          />

          <div
            className="relative overflow-hidden rounded-2xl shadow-[0_40px_120px_rgba(0,0,0,0.8)]"
            style={{
              border: "1px solid rgba(255,255,255,0.07)",
              background: "linear-gradient(180deg, #161616, #111)",
            }}
          >
            {/* Tarayıcı çubuğu */}
            <div className="flex items-center gap-2 border-b border-white/[0.06] bg-[#0e0e0e] px-5 py-3.5">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                <div className="h-3 w-3 rounded-full bg-[#febc2e]" />
                <div className="h-3 w-3 rounded-full bg-[#28c840]" />
              </div>
              <div className="ml-3 flex h-7 max-w-xs flex-1 items-center justify-center gap-2 rounded-lg border border-white/[0.06] bg-[#1a1a1a]">
                <div className="h-2 w-2 rounded-full bg-[#28c840] opacity-60" />
                <span className="text-[11px] font-medium text-[#3a3a3a]">digynotes.app/notes</span>
              </div>
            </div>

            {/* Uygulama önizleme içeriği */}
            <div className="p-6">
              {/* Sahte header */}
              <div className="mb-5 flex items-center justify-between">
                <div className="h-7 w-36 rounded-lg bg-[#1a1a1a]" />
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-[#1e1e1e]" />
                  <div
                    className="h-8 w-24 rounded-lg border"
                    style={{
                      background: "rgba(201,168,76,0.12)",
                      borderColor: "rgba(201,168,76,0.2)",
                    }}
                  />
                </div>
              </div>

              {/* Sahte sekmeler */}
              <div className="mb-5 flex gap-1.5 border-b border-white/[0.05] pb-3">
                {["Son Yazılar", "Film", "Dizi", "Kitap"].map((cat, i) => (
                  <div
                    key={cat}
                    className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                      i === 0 ? "text-[#c9a84c]" : "text-[#2a2a2a]"
                    }`}
                    style={
                      i === 0
                        ? {
                            background: "rgba(201,168,76,0.1)",
                            border: "1px solid rgba(201,168,76,0.25)",
                          }
                        : { border: "1px solid transparent" }
                    }
                  >
                    {cat}
                  </div>
                ))}
              </div>

              {/* Sahte öne çıkan kart */}
              <div
                className="relative mb-4 flex h-44 items-end overflow-hidden rounded-2xl p-5"
                style={{ background: "linear-gradient(135deg, #1a1020, #0f1a2e, #151515)" }}
              >
                <div
                  className="absolute inset-0 opacity-30"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(255,107,53,0.15), rgba(201,168,76,0.08), rgba(129,140,248,0.1))",
                  }}
                />
                <div className="absolute inset-0 rounded-2xl border border-white/[0.06]" />
                <div className="relative z-10 w-full">
                  <div className="mb-2.5 flex gap-2">
                    <div
                      className="h-5 w-14 rounded-sm"
                      style={{
                        background:
                          "linear-gradient(90deg, rgba(201,168,76,0.5), rgba(201,168,76,0.3))",
                      }}
                    />
                    <div className="h-5 w-20 rounded-sm bg-white/10" />
                  </div>
                  <div className="mb-1.5 h-6 w-56 rounded-md bg-white/25" />
                  <div className="bg-white/12 mb-3 h-4 w-36 rounded-md" />
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <svg
                        key={s}
                        viewBox="0 0 24 24"
                        className="h-3 w-3"
                        fill={s <= 4 ? "#c9a84c" : "#1e1e1e"}
                      >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sahte kart grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { color: "rgba(255,107,53,0.12)", border: "rgba(255,107,53,0.15)" },
                  { color: "rgba(129,140,248,0.12)", border: "rgba(129,140,248,0.15)" },
                  { color: "rgba(201,168,76,0.10)", border: "rgba(201,168,76,0.15)" },
                  { color: "rgba(96,165,250,0.10)", border: "rgba(96,165,250,0.12)" },
                ].map((c, i) => (
                  <div
                    key={i}
                    className="flex h-24 overflow-hidden rounded-xl"
                    style={{ background: "#111", border: `1px solid ${c.border}` }}
                  >
                    <div
                      className="w-16 flex-shrink-0 rounded-l-lg"
                      style={{
                        background: `linear-gradient(135deg, ${c.color.replace("0.12", "0.25")}, rgba(30,30,30,0.8))`,
                      }}
                    />
                    <div className="flex flex-1 flex-col justify-between p-3">
                      <div>
                        <div className="mb-1.5 h-2.5 w-16 rounded-full bg-white/15" />
                        <div className="bg-white/8 h-2 w-full rounded-full" />
                      </div>
                      <div className="mt-auto flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <svg
                            key={s}
                            viewBox="0 0 24 24"
                            className="h-2.5 w-2.5"
                            fill={s <= 4 ? "#c9a84c" : "#222"}
                          >
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Altta solma efekti */}
          <div
            className="pointer-events-none absolute bottom-0 left-0 right-0 h-40"
            style={{ background: "linear-gradient(to top, #0c0c0c, transparent)" }}
          />
        </div>
      </section>

      {/* ══════════════════════════════════════
          FEATURES
      ══════════════════════════════════════ */}
      <section className="relative mx-auto w-full max-w-5xl px-4 pb-24 sm:px-6">
        <div className="mb-14 text-center">
          <h2 className="mb-4 text-3xl font-black text-[#f0ede8] sm:text-4xl">
            Her şey{" "}
            <span
              style={{
                background: "linear-gradient(90deg, #c9a84c, #e0c068)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              tek yerde
            </span>
          </h2>
          <p
            className="mx-auto max-w-md text-base leading-relaxed"
            style={{ color: "rgba(240,237,232,0.38)" }}
          >
            Film izle, not al. Kitap oku, düşüncelerini kaydet.
            <br />
            Yıldızla, durumunu işaretle.
          </p>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {(
            [
              {
                Icon: LuFilm,
                title: "Film",
                desc: "İzlediğin filmleri puanla, yönetmen ve yıl bilgisiyle birlikte kaydet.",
                border: "rgba(56,88,168,0.18)",
                gradientFrom: "rgba(40,64,140,0.07)",
                iconColor: "#6888c0",
                iconBg: "rgba(56,88,168,0.12)",
                iconBorder: "rgba(56,88,168,0.2)",
              },
              {
                Icon: LuTv,
                title: "Dizi",
                desc: "Devam eden ya da biten dizileri durumlarıyla takip et.",
                border: "rgba(200,176,144,0.16)",
                gradientFrom: "rgba(168,140,96,0.07)",
                iconColor: "#c8b090",
                iconBg: "rgba(200,176,144,0.1)",
                iconBorder: "rgba(200,176,144,0.2)",
              },
              {
                Icon: LuBookOpen,
                title: "Kitap",
                desc: "Okuduğun ya da okumak istediğin kitapları listele, notlar al.",
                border: "rgba(201,168,76,0.18)",
                gradientFrom: "rgba(160,128,40,0.08)",
                iconColor: "#c9a84c",
                iconBg: "rgba(201,168,76,0.1)",
                iconBorder: "rgba(201,168,76,0.2)",
              },
            ] as const
          ).map((f) => (
            <div
              key={f.title}
              className="group relative overflow-hidden rounded-2xl p-7 transition-all duration-300 hover:-translate-y-1"
              style={{
                background: `linear-gradient(145deg, ${f.gradientFrom}, rgba(14,14,14,1))`,
                border: `1px solid ${f.border}`,
              }}
            >
              <div
                className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl"
                style={{ background: f.iconBg, border: `1px solid ${f.iconBorder}` }}
              >
                <f.Icon size={20} style={{ color: f.iconColor }} />
              </div>
              <h3 className="mb-2 text-lg font-bold" style={{ color: "rgba(240,237,232,0.9)" }}>
                {f.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(240,237,232,0.42)" }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Özellik satırı */}
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          {(
            [
              { label: "Yıldızlı Puanlama", Icon: LuStar, color: "#c9a84c" },
              { label: "Zengin Metin Editörü", Icon: LuPenLine, color: "#8898b8" },
              { label: "Akıllı Arama & Filtre", Icon: LuSearch, color: "#a09080" },
            ] as const
          ).map((s) => (
            <div
              key={s.label}
              className="flex flex-row items-center gap-3 rounded-xl border border-white/[0.05] bg-[#0d0d0d] px-4 py-3"
            >
              <s.Icon size={15} style={{ color: s.color, flexShrink: 0 }} />
              <span className="text-xs font-medium" style={{ color: "rgba(240,237,232,0.38)" }}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════
          BOTTOM CTA
      ══════════════════════════════════════ */}
      <section className="relative flex flex-col items-center overflow-hidden px-4 pb-24 text-center">
        {/* Üst çizgi */}
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(201,168,76,0.3), rgba(129,140,248,0.2), transparent)",
          }}
        />

        {/* Arka glow */}
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-[300px] w-[600px] -translate-x-1/2 opacity-10 blur-[80px]"
          style={{ background: "radial-gradient(circle, #c9a84c, transparent 70%)" }}
        />

        <h2 className="relative mb-5 mt-14 text-3xl font-black sm:text-4xl">
          <span
            style={{
              background: "linear-gradient(135deg, #f0ede8 0%, rgba(240,237,232,0.7) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Notlarını almaya{" "}
          </span>
          <span
            style={{
              background: "linear-gradient(135deg, #e8c84a, #c9a030)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            başla.
          </span>
        </h2>
        <p
          className="mb-10 max-w-sm text-sm leading-relaxed"
          style={{ color: "rgba(240,237,232,0.42)" }}
        >
          Kayıt ol, kategorilerini oluştur ve ilk notunu ekle.
          <br />
          Beş dakika yeterli.
        </p>
        <Link
          href="/register"
          className="group relative w-full max-w-xs overflow-hidden rounded-2xl px-8 py-4 text-[15px] font-bold text-[#1a0e00] shadow-[0_4px_24px_rgba(201,168,76,0.3)] transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-[0_8px_40px_rgba(201,168,76,0.45)] sm:w-auto sm:px-12"
          style={{ background: "linear-gradient(135deg, #d4a84c, #c9a030, #b88820, #cca038)" }}
        >
          <span className="relative z-10">Hesap Oluştur →</span>
          <div
            className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{ background: "linear-gradient(135deg, #e0b84c, #d4a030, #c89020, #dab040)" }}
          />
        </Link>
      </section>

      {/* ══════════════════════════════════════
          FOOTER
      ══════════════════════════════════════ */}
      <footer className="flex items-center justify-center border-t border-[#1a1a1a] px-6 py-6">
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.15)" }}>
          © {new Date().getFullYear()} DigyNotes · Kişisel kullanım için.
        </p>
      </footer>
    </div>
  );
}
