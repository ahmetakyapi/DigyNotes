import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";
import {
  LuFilm,
  LuTv,
  LuBookOpen,
  LuGamepad2,
  LuMapPin,
  LuStar,
  LuSearch,
  LuTag,
  LuUsers,
} from "react-icons/lu";
import { LandingThemeToggle } from "@/components/LandingThemeToggle";

export const metadata: Metadata = {
  title: "DigyNotes — Film, Dizi, Oyun, Kitap ve Gezi Notları",
  description:
    "Film, dizi, oyun, kitap ve gezilerden geriye kalan düşüncelerini tek bir yerde topla. Puan ver, etiketle, keşfet.",
};

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-[var(--bg-base)] text-[var(--text-primary)]">
      {/* ══════════════════════════════════════
          NAV
      ══════════════════════════════════════ */}
      <nav
        className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between px-4 py-3 sm:px-12 sm:py-4"
        style={{ background: "linear-gradient(to bottom, var(--bg-base) 55%, transparent)" }}
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
        <div className="flex items-center gap-1.5 sm:gap-2">
          <LandingThemeToggle />
          <Link
            href="/login"
            className="hidden px-5 py-2 text-sm font-medium text-[var(--text-muted)] transition-colors duration-200 hover:text-[var(--text-primary)] sm:block"
          >
            Giriş Yap
          </Link>
          <Link
            href="/login"
            className="px-3 py-2 text-sm font-medium text-[var(--text-muted)] transition-colors duration-200 hover:text-[var(--text-primary)] sm:hidden"
          >
            Giriş
          </Link>
          <Link
            href="/register"
            className="rounded-xl px-4 py-2 text-sm font-semibold tracking-[0.01em] text-[#1b1307] shadow-lg transition-all duration-200 hover:-translate-y-px hover:opacity-90 sm:px-5 sm:py-2.5"
            style={{ background: "linear-gradient(135deg, #ebc15c, #c6972e, #b77f18)" }}
          >
            Kayıt Ol
          </Link>
        </div>
      </nav>

      {/* ══════════════════════════════════════
          HERO
      ══════════════════════════════════════ */}
      <section className="relative flex min-h-[100svh] flex-col items-center justify-center px-5 pb-4 pt-[4.4rem] sm:px-4 sm:pt-16">
        {/* ── Arka plan aura katmanları ── */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="dn-aurora-float-1 absolute -left-20 -top-20 h-[400px] w-[400px] rounded-full opacity-[0.07] blur-[140px] sm:h-[700px] sm:w-[700px]"
            style={{
              background: "radial-gradient(circle, #c4902a 0%, #7a5010 50%, transparent 70%)",
            }}
          />
          <div
            className="dn-aurora-float-2 absolute -right-20 -top-10 h-[350px] w-[350px] rounded-full opacity-[0.05] blur-[140px] sm:h-[600px] sm:w-[600px]"
            style={{
              background: "radial-gradient(circle, #6878a0 0%, #3a4a6a 50%, transparent 70%)",
            }}
          />
          <div
            className="dn-aurora-float-3 absolute bottom-0 left-1/2 h-[300px] w-[500px] -translate-x-1/2 rounded-full opacity-[0.06] blur-[160px] sm:h-[500px] sm:w-[900px]"
            style={{
              background: "radial-gradient(circle, #c4a24b 0%, #8a6820 60%, transparent 70%)",
            }}
          />
          <div
            className="absolute inset-0 opacity-[0.016] sm:hidden"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
              backgroundSize: "78px 78px",
            }}
          />
          <div
            className="absolute inset-0 hidden opacity-[0.018] sm:block"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
              backgroundSize: "80px 80px",
            }}
          />
          <div
            className="dn-aurora-core absolute left-1/2 top-1/2 h-[150px] w-[300px] -translate-x-1/2 -translate-y-1/2 opacity-[0.05] blur-[90px] sm:h-[250px] sm:w-[500px]"
            style={{ background: "radial-gradient(circle, #c4a24b, transparent 70%)" }}
          />
        </div>

        {/* ── Tüm içerik — badge + başlık+açıklama + butonlar, 3 öğe justify-between ── */}
        <div className="relative z-10 flex w-full max-w-[430px] flex-col items-center gap-5 pb-0 pt-0 sm:max-w-5xl sm:gap-6 sm:py-0 xl:max-w-6xl">
          <div
            className="dn-badge-sheen dn-reveal dn-delay-1 relative mb-1 mt-2 flex items-center gap-2 rounded-full border px-4 py-1.5 backdrop-blur-sm sm:mb-1 sm:mt-0 sm:gap-3 sm:px-5 sm:py-2 2xl:px-6 2xl:py-2.5"
            style={{
              background:
                "linear-gradient(135deg, rgba(201,168,76,0.12), rgba(129,140,248,0.08), rgba(255,107,53,0.08))",
              borderColor: "color-mix(in srgb, var(--gold) 28%, transparent)",
            }}
          >
            <span
              className="dn-dot-pulse h-1.5 w-1.5 rounded-full shadow-[0_0_8px_#c4a24b] sm:h-2 sm:w-2"
              style={{ background: "radial-gradient(circle, #fbbf24, #c4a24b)" }}
            />
            <span
              className="text-[9px] font-bold uppercase tracking-[0.2em] sm:text-xs"
              style={{
                background: "linear-gradient(90deg, var(--gold), var(--gold-light))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Kişisel Not Defteri
            </span>
          </div>

          {/* 2. Başlık + Açıklama grubu */}
          <div className="flex flex-col items-center">
            <h1 className="mb-4 w-full overflow-visible px-1 pb-[0.1em] text-center text-[clamp(2.3rem,11vw,3.3rem)] font-black leading-[1.14] tracking-[-0.038em] sm:mb-5 sm:px-0 sm:text-[clamp(3.35rem,6vw,5.25rem)] sm:leading-[1.12] xl:text-[clamp(4rem,5.4vw,5.8rem)] xl:leading-[1.1] 2xl:text-[clamp(4.5rem,4.8vw,6.4rem)]">
              <span
                className="dn-line-reveal dn-line-1 mb-0.5 block px-[0.04em] pb-[0.04em] pt-[0.18em] sm:mb-1"
                style={{
                  background: "linear-gradient(135deg, #90aadc 0%, #5070c8 45%, #2848a0 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  filter: "drop-shadow(0 0 36px rgba(60, 100, 200, 0.42))",
                }}
              >
                İzlediklerin
              </span>
              <span
                className="dn-line-reveal dn-line-2 mb-0.5 block px-[0.04em] py-[0.04em] sm:mb-1"
                style={{
                  background: "linear-gradient(135deg, #d4b4f4 0%, #a878e0 45%, #7848c0 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  filter: "drop-shadow(0 0 36px rgba(160, 90, 224, 0.38))",
                }}
              >
                Oynadıkların
              </span>
              <span
                className="dn-line-reveal dn-line-3 mb-0.5 block px-[0.04em] py-[0.04em] sm:mb-1"
                style={{
                  background: "linear-gradient(135deg, #f0cc98 0%, #d4a060 45%, #b87838 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  filter: "drop-shadow(0 0 36px rgba(212, 152, 72, 0.36))",
                }}
              >
                Okudukların
              </span>
              <span
                className="dn-line-reveal dn-line-4 mb-0.5 block px-[0.04em] py-[0.04em] sm:mb-1"
                style={{
                  background: "linear-gradient(135deg, #9cdcbc 0%, #6cb898 45%, #409870 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  filter: "drop-shadow(0 0 36px rgba(80, 180, 130, 0.36))",
                }}
              >
                Gezdiklerin
              </span>
              <span
                className="dn-line-reveal dn-line-5 mt-1 block px-[0.04em] pb-[0.06em] pt-[0.04em] sm:mt-1.5"
                style={{
                  fontSize: "1.08em",
                  background:
                    "linear-gradient(135deg, #fff8c8 0%, #f8d840 20%, #e8b820 50%, #f8d040 80%, #fff8c8 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  filter:
                    "drop-shadow(0 0 40px rgba(248, 200, 40, 0.75)) drop-shadow(0 0 80px rgba(220, 160, 20, 0.4))",
                }}
              >
                Sana Kalanlar
              </span>
            </h1>

            <p className="dn-reveal dn-delay-3 mx-auto max-w-[322px] px-2 py-1 text-center text-[0.96rem] font-medium leading-[1.72] text-[var(--text-secondary)] [text-wrap:balance] sm:mb-2 sm:max-w-3xl sm:px-0 sm:py-0 sm:text-[1.08rem] sm:leading-[1.86] xl:max-w-4xl xl:text-[1.18rem] 2xl:max-w-[54rem] 2xl:text-[1.24rem]">
              <span className="block [text-wrap:balance]">
                Film, dizi, oyun, kitap ve gezilerden geriye kalan düşüncelerini tek bir yerde
                topla.
              </span>
              <span className="mt-2 block [text-wrap:balance] sm:mt-2">
                Puanla, etiketle ve yıllar sonra bile aynı duyguyla geri dön.
              </span>
            </p>
          </div>

          {/* 3. CTA Butonlar */}
          <div className="dn-reveal dn-delay-4 mb-4 mt-2 flex w-full flex-col gap-4 px-1.5 pb-1 sm:mb-0 sm:mt-1 sm:w-auto sm:flex-row sm:gap-5 sm:px-0 sm:pb-0">
            <Link
              href="/register"
              className="dn-cta-gold group relative w-[86%] self-center overflow-hidden rounded-[1.6rem] py-[10px] text-center text-[clamp(0.92rem,3.8vw,1.08rem)] font-semibold tracking-[0.01em] text-[#1b1307] shadow-[0_8px_24px_rgba(198,151,46,0.34)] transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-[0_12px_40px_rgba(198,151,46,0.42)] sm:w-auto sm:self-auto sm:rounded-2xl sm:px-9 sm:py-[12px] sm:text-[14px] 2xl:px-12 2xl:py-[18px] 2xl:text-[16px]"
              style={{ background: "linear-gradient(135deg, #e7bf5d, #c6972e, #b37a16, #cf9d2f)" }}
            >
              <span className="relative z-10">Hemen Başla →</span>
              <div
                className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{
                  background: "linear-gradient(135deg, #efca67, #d0a23d, #bc841c, #d6a83a)",
                }}
              />
            </Link>
            <Link
              href="/login"
              className="dn-cta-ghost hover:border-[var(--gold)]/35 w-[86%] self-center rounded-[1.6rem] border border-[var(--border)] py-[9px] text-center text-[clamp(0.88rem,3.6vw,1.02rem)] font-medium tracking-[0.01em] text-[var(--text-primary)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:bg-[var(--surface-strong)] sm:w-auto sm:self-auto sm:rounded-2xl sm:px-9 sm:py-[11px] sm:text-[14px] 2xl:px-12 2xl:py-[17px] 2xl:text-[16px]"
              style={{
                background: "color-mix(in srgb, var(--bg-card) 92%, white 8%)",
              }}
            >
              Giriş Yap
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          APP ÖNİZLEME
      ══════════════════════════════════════ */}
      <section className="relative px-4 pb-20 pt-4 sm:pt-6">
        <div className="relative mx-auto w-full max-w-4xl">
          {/* Üstten gelen glow halkası */}
          <div
            className="absolute -top-px left-1/2 h-px w-3/4 -translate-x-1/2"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.6), transparent)",
            }}
          />

          <div
            className="dn-landing-preview relative overflow-hidden rounded-2xl shadow-[0_40px_120px_rgba(0,0,0,0.8)]"
            style={{
              border: "1px solid var(--border-subtle)",
              background: "linear-gradient(180deg, var(--bg-card), var(--surface-strong))",
            }}
          >
            {/* Tarayıcı çubuğu */}
            <div
              className="flex items-center gap-2 border-b px-5 py-3.5"
              style={{
                borderColor: "var(--border-subtle)",
                background: "var(--bg-soft)",
              }}
            >
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                <div className="h-3 w-3 rounded-full bg-[#febc2e]" />
                <div className="h-3 w-3 rounded-full bg-[#28c840]" />
              </div>
              <div
                className="ml-3 flex h-7 max-w-xs flex-1 items-center justify-center gap-2 rounded-lg border"
                style={{
                  borderColor: "var(--border-subtle)",
                  background: "var(--bg-card)",
                }}
              >
                <div className="h-2 w-2 rounded-full bg-[#28c840] opacity-60" />
                <span className="text-[11px] font-medium text-[var(--text-muted)]">
                  digynotes.app/notes
                </span>
              </div>
            </div>

            {/* Uygulama önizleme içeriği */}
            <div className="p-4 sm:p-6">
              {/* Sahte header */}
              <div className="mb-4 flex items-center justify-between sm:mb-5">
                <Image
                  src="/app-logo.png"
                  alt="DigyNotes"
                  width={120}
                  height={35}
                  className="w-[96px] object-contain opacity-90 sm:w-[140px]"
                  unoptimized
                />
                <div className="flex items-center gap-2">
                  <div
                    className="h-7 w-7 rounded-full sm:h-8 sm:w-8"
                    style={{ background: "var(--bg-raised)" }}
                  />
                  <div
                    className="hidden h-8 w-24 rounded-lg border sm:block"
                    style={{
                      background: "color-mix(in srgb, var(--gold) 12%, transparent)",
                      borderColor: "color-mix(in srgb, var(--gold) 22%, transparent)",
                    }}
                  />
                </div>
              </div>

              {/* Sahte sekmeler */}
              <div className="mb-4 flex gap-1 overflow-x-auto border-b border-[var(--border-subtle)] pb-3 sm:mb-5 sm:gap-1.5">
                {["Son Notlar", "Film", "Dizi", "Oyun", "Kitap", "Gezi"].map((cat, i) => (
                  <div
                    key={cat}
                    className={`flex-shrink-0 rounded-lg px-2.5 py-1.5 text-[10px] font-semibold transition-colors sm:px-3 sm:text-[11px] ${
                      i === 0 ? "text-[var(--gold)]" : "text-[var(--text-secondary)]"
                    }`}
                    style={
                      i === 0
                        ? {
                            background: "color-mix(in srgb, var(--gold) 12%, transparent)",
                            border: "1px solid color-mix(in srgb, var(--gold) 24%, transparent)",
                          }
                        : { border: "1px solid transparent", background: "transparent" }
                    }
                  >
                    {cat}
                  </div>
                ))}
              </div>

              {/* Sahte öne çıkan kart */}
              <div
                className="relative mb-3 flex h-32 items-end overflow-hidden rounded-xl p-4 sm:mb-4 sm:h-44 sm:rounded-2xl sm:p-5"
                style={{
                  background:
                    "linear-gradient(135deg, color-mix(in srgb, var(--bg-card) 88%, #311742 12%), color-mix(in srgb, var(--bg-soft) 88%, #16274d 12%), var(--surface-strong))",
                }}
              >
                <div
                  className="absolute inset-0 opacity-30"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(255,107,53,0.15), rgba(201,168,76,0.08), rgba(129,140,248,0.1))",
                  }}
                />
                <div className="absolute inset-0 rounded-xl border border-[var(--border-subtle)] sm:rounded-2xl" />
                <div className="relative z-10 w-full">
                  <div className="mb-2 flex gap-2 sm:mb-2.5">
                    <div
                      className="h-4 w-12 rounded-sm sm:h-5 sm:w-14"
                      style={{
                        background:
                          "linear-gradient(90deg, rgba(201,168,76,0.5), rgba(201,168,76,0.3))",
                      }}
                    />
                    <div
                      className="h-4 w-16 rounded-sm sm:h-5 sm:w-20"
                      style={{
                        background: "color-mix(in srgb, var(--bg-overlay) 68%, transparent)",
                      }}
                    />
                  </div>
                  <div
                    className="mb-1 h-5 w-40 rounded-md sm:mb-1.5 sm:h-6 sm:w-56"
                    style={{ background: "var(--bg-overlay)" }}
                  />
                  <div
                    className="mb-2 h-3 w-28 rounded-md sm:mb-3 sm:h-4 sm:w-36"
                    style={{
                      background: "color-mix(in srgb, var(--bg-overlay) 78%, transparent)",
                    }}
                  />
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <svg
                        key={s}
                        viewBox="0 0 24 24"
                        className="h-2.5 w-2.5 sm:h-3 sm:w-3"
                        fill={s <= 4 ? "#c4a24b" : "#1e1e1e"}
                      >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sahte kart grid */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {[
                  { color: "rgba(255,107,53,0.12)", border: "rgba(255,107,53,0.15)" },
                  { color: "rgba(129,140,248,0.12)", border: "rgba(129,140,248,0.15)" },
                  { color: "rgba(201,168,76,0.10)", border: "rgba(201,168,76,0.15)" },
                  { color: "rgba(96,165,250,0.10)", border: "rgba(96,165,250,0.12)" },
                ].map((c, i) => (
                  <div
                    key={i}
                    className="flex h-20 overflow-hidden rounded-lg sm:h-24 sm:rounded-xl"
                    style={{ background: "var(--surface-strong)", border: `1px solid ${c.border}` }}
                  >
                    <div
                      className="w-12 flex-shrink-0 rounded-l-lg sm:w-16"
                      style={{
                        background: `linear-gradient(135deg, ${c.color.replace("0.12", "0.25")}, color-mix(in srgb, var(--surface-strong) 84%, black 16%))`,
                      }}
                    />
                    <div className="flex flex-1 flex-col justify-between p-2.5 sm:p-3">
                      <div>
                        <div
                          className="mb-1 h-2 w-12 rounded-full sm:mb-1.5 sm:h-2.5 sm:w-16"
                          style={{
                            background: "color-mix(in srgb, var(--bg-overlay) 88%, transparent)",
                          }}
                        />
                        <div
                          className="h-1.5 w-full rounded-full sm:h-2"
                          style={{
                            background: "color-mix(in srgb, var(--bg-overlay) 58%, transparent)",
                          }}
                        />
                      </div>
                      <div className="mt-auto flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <svg
                            key={s}
                            viewBox="0 0 24 24"
                            className="h-2 w-2 sm:h-2.5 sm:w-2.5"
                            fill={s <= 4 ? "#c4a24b" : "#222"}
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
            style={{ background: "linear-gradient(to top, var(--bg-base), transparent)" }}
          />
        </div>
      </section>

      {/* ══════════════════════════════════════
          FEATURES
      ══════════════════════════════════════ */}
      <section className="relative mx-auto w-full max-w-5xl px-4 pb-16 pt-2 sm:px-6 sm:pb-24 sm:pt-4">
        <div className="mb-12 text-center sm:mb-16">
          <h2 className="mb-3 text-2xl font-black text-[var(--text-primary)] sm:mb-4 sm:text-4xl">
            Her şey{" "}
            <span
              style={{
                background: "linear-gradient(90deg, #c6972e, #dfba63)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              tek yerde
            </span>
          </h2>
          <p className="mx-auto max-w-2xl text-base font-medium leading-[1.85] text-[var(--text-secondary)]">
            <span className="block text-balance">
              Film izle, dizi takip et, oyun oyna, kitap oku, gezi yap — not al.
            </span>
            <span className="mt-3 block text-balance">
              Kaydet, bildirim al, koleksiyon oluştur ve istatistiklerini gör.
            </span>
          </p>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-4 sm:mb-8 sm:grid-cols-3 sm:gap-5 lg:grid-cols-5">
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
                Icon: LuGamepad2,
                title: "Oyun",
                desc: "Oynadığın ya da oynamak istediğin oyunları RAWG veritabanıyla kaydet.",
                border: "rgba(129,140,248,0.16)",
                gradientFrom: "rgba(99,102,241,0.07)",
                iconColor: "#818cf8",
                iconBg: "rgba(129,140,248,0.1)",
                iconBorder: "rgba(129,140,248,0.2)",
              },
              {
                Icon: LuBookOpen,
                title: "Kitap",
                desc: "Okuduğun ya da okumak istediğin kitapları listele, notlar al.",
                border: "rgba(201,168,76,0.18)",
                gradientFrom: "rgba(160,128,40,0.08)",
                iconColor: "#c4a24b",
                iconBg: "rgba(201,168,76,0.1)",
                iconBorder: "rgba(201,168,76,0.2)",
              },
              {
                Icon: LuMapPin,
                title: "Gezi",
                desc: "Gezdiğin şehirleri, ülkeleri ve mekânları puanla, anılarını kaydet.",
                border: "rgba(80,160,120,0.18)",
                gradientFrom: "rgba(60,130,90,0.07)",
                iconColor: "#60a88a",
                iconBg: "rgba(80,160,120,0.1)",
                iconBorder: "rgba(80,160,120,0.2)",
              },
            ] as const
          ).map((f) => (
            <div
              key={f.title}
              className="dn-landing-card group relative overflow-hidden rounded-2xl p-5 transition-all duration-300 last:col-span-2 hover:-translate-y-1 sm:p-7 sm:last:col-span-1"
              style={{
                background: `linear-gradient(145deg, ${f.gradientFrom}, var(--surface-strong))`,
                border: `1px solid ${f.border}`,
              }}
            >
              <div
                className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg sm:mb-5 sm:h-11 sm:w-11 sm:rounded-xl"
                style={{ background: f.iconBg, border: `1px solid ${f.iconBorder}` }}
              >
                <f.Icon className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: f.iconColor }} />
              </div>
              <h3 className="mb-1 text-base font-bold text-[var(--text-primary)] sm:mb-2 sm:text-lg">
                {f.title}
              </h3>
              <p className="text-[13px] leading-[1.8] text-[var(--text-secondary)] sm:text-sm">
                {f.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Özellik satırı */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
          {(
            [
              { label: "Tam Metin Arama", Icon: LuSearch, color: "var(--gold)" },
              { label: "Kaydet & Etiketle", Icon: LuTag, color: "#8d7d5e" },
              { label: "Bildirimler & Keşfet", Icon: LuUsers, color: "#7a85d8" },
              { label: "Kişisel İstatistikler", Icon: LuStar, color: "var(--gold)" },
            ] as const
          ).map((s) => (
            <div
              key={s.label}
              className="dn-landing-card flex flex-row items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3.5"
            >
              <s.Icon size={15} style={{ color: s.color, flexShrink: 0 }} />
              <span className="text-[13px] font-medium text-[var(--text-secondary)]">
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════
          NASIL ÇALIŞIR — 3 ADIM
      ══════════════════════════════════════ */}
      <section className="relative mx-auto w-full max-w-4xl px-4 pb-20 pt-8 sm:px-6 sm:pb-28 sm:pt-12">
        <div className="mb-12 text-center sm:mb-14">
          <h2 className="mb-3 text-2xl font-black text-[var(--text-primary)] sm:text-4xl">
            Üç adımda{" "}
            <span
              style={{
                background: "linear-gradient(90deg, #c6972e, #dfba63)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              başla
            </span>
          </h2>
          <p className="text-sm font-medium text-[var(--text-secondary)] sm:text-base">
            Hızlıca kaydol, notlarını oluştur ve geçmişe dön.
          </p>
        </div>

        <div className="relative grid gap-6 sm:grid-cols-3 sm:gap-8">
          {/* Bağlantı çizgisi (masaüstü) */}
          <div
            className="absolute left-0 right-0 top-10 hidden h-px sm:block"
            style={{
              background:
                "linear-gradient(90deg, transparent 10%, rgba(201,168,76,0.3) 30%, rgba(201,168,76,0.3) 70%, transparent 90%)",
            }}
          />

          {[
            {
              step: "01",
              title: "Hesap Oluştur",
              desc: "E-posta ve kullanıcı adınla kayıt ol. Beş saniye yeterli.",
              accent: "#6888c0",
            },
            {
              step: "02",
              title: "Notlarını Ekle",
              desc: "Film, dizi, oyun, kitap veya gezi — kategorini seç, notunu yaz.",
              accent: "#c4a24b",
            },
            {
              step: "03",
              title: "Keşfet & Hatırla",
              desc: "Puanla, etiketle ve yıllar sonra aynı duyguyla geri dön.",
              accent: "#60a88a",
            },
          ].map((item) => (
            <div key={item.step} className="relative text-center">
              <div
                className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border text-xl font-black sm:mb-5 sm:h-16 sm:w-16"
                style={{
                  background: `${item.accent}12`,
                  borderColor: `${item.accent}30`,
                  color: item.accent,
                }}
              >
                {item.step}
              </div>
              <h3 className="mb-1.5 text-base font-bold text-[var(--text-primary)] sm:text-lg">
                {item.title}
              </h3>
              <p className="mx-auto max-w-[220px] text-[13px] leading-relaxed text-[var(--text-secondary)] sm:text-sm">
                {item.desc}
              </p>
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
          style={{ background: "radial-gradient(circle, #c4a24b, transparent 70%)" }}
        />

        <h2 className="relative mb-4 mt-6 text-2xl font-black sm:mb-5 sm:mt-14 sm:text-4xl">
          <span
            style={{
              color: "var(--text-primary)",
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
          className="mb-8 max-w-sm text-[13px] leading-relaxed sm:mb-10 sm:text-sm"
          style={{ color: "var(--text-secondary)" }}
        >
          Kayıt ol, kategorilerini oluştur ve ilk notunu ekle.
          <br />
          Beş dakika yeterli.
        </p>
        <Link
          href="/register"
          className="group relative w-full max-w-[260px] overflow-hidden rounded-2xl px-6 py-3.5 text-[14px] font-semibold tracking-[0.01em] text-[#1b1307] shadow-[0_6px_24px_rgba(198,151,46,0.32)] transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-[0_8px_40px_rgba(198,151,46,0.45)] sm:w-auto sm:max-w-none sm:px-12 sm:py-4 sm:text-[15px]"
          style={{ background: "linear-gradient(135deg, #e7bf5d, #c6972e, #b37a16, #cf9d2f)" }}
        >
          <span className="relative z-10">Hesap Oluştur →</span>
          <div
            className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{ background: "linear-gradient(135deg, #efca67, #d0a23d, #bc841c, #d6a83a)" }}
          />
        </Link>
      </section>

      {/* ══════════════════════════════════════
          FOOTER
      ══════════════════════════════════════ */}
      <footer className="flex items-center justify-center border-t border-[var(--border)] px-6 py-6">
        <p className="text-xs text-[var(--text-muted)]">
          © {new Date().getFullYear()} DigyNotes · Kişisel kullanım için.
        </p>
      </footer>
    </div>
  );
}
