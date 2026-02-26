import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sayfa Bulunamadı",
};

/* LAYOUT: Full viewport centered single column
   - Fixed aurora glow bg + subtle grid overlay
   - Floating ghost category tags (absolute, corners/edges)
   - Center: badge + huge "404" + heading + desc + CTA buttons
   - Works both standalone and within AppShell
*/

export default function NotFound() {
  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center overflow-hidden px-4 text-center">
      <style>{`
        @keyframes dn404-float-1 {
          0%, 100% { transform: translateY(0) rotate(-3deg); }
          50% { transform: translateY(-14px) rotate(3deg); }
        }
        @keyframes dn404-float-2 {
          0%, 100% { transform: translateY(0) rotate(6deg); }
          50% { transform: translateY(-18px) rotate(-4deg); }
        }
        @keyframes dn404-float-3 {
          0%, 100% { transform: translateY(0) rotate(-5deg); }
          50% { transform: translateY(-10px) rotate(5deg); }
        }
        @keyframes dn404-float-4 {
          0%, 100% { transform: translateY(0) rotate(8deg); }
          50% { transform: translateY(-12px) rotate(-6deg); }
        }
        @keyframes dn404-float-5 {
          0%, 100% { transform: translateY(0) rotate(-2deg); }
          50% { transform: translateY(-16px) rotate(4deg); }
        }
        @keyframes dn404-aurora-slow {
          0%, 100% { opacity: 0.07; transform: scale(1); }
          50% { opacity: 0.11; transform: scale(1.08); }
        }
        @keyframes dn404-aurora-drift {
          0%, 100% { opacity: 0.05; transform: translateX(0) scale(1); }
          60% { opacity: 0.09; transform: translateX(24px) scale(1.06); }
        }
        @keyframes dn404-glitch {
          0%   { clip-path: inset(0 0 100% 0); transform: translateX(-3px); opacity: 0.7; }
          20%  { clip-path: inset(15% 0 65% 0); transform: translateX(3px); }
          40%  { clip-path: inset(55% 0 25% 0); transform: translateX(-2px); }
          60%  { clip-path: inset(75% 0 5%  0); transform: translateX(2px); }
          80%  { clip-path: inset(35% 0 45% 0); transform: translateX(-3px); }
          100% { clip-path: inset(0 0 100% 0); transform: translateX(0); opacity: 0; }
        }
        @keyframes dn404-fade-up {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes dn404-scan {
          0%   { transform: translateY(-100%); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { transform: translateY(100%); opacity: 0; }
        }
        .dn404-tag-1 { animation: dn404-float-1 4.4s ease-in-out infinite; }
        .dn404-tag-2 { animation: dn404-float-2 5.8s ease-in-out infinite 0.9s; }
        .dn404-tag-3 { animation: dn404-float-3 3.9s ease-in-out infinite 1.6s; }
        .dn404-tag-4 { animation: dn404-float-4 6.4s ease-in-out infinite 0.4s; }
        .dn404-tag-5 { animation: dn404-float-5 5.1s ease-in-out infinite 2.2s; }
        .dn404-aurora-1 { animation: dn404-aurora-slow 9s ease-in-out infinite; }
        .dn404-aurora-2 { animation: dn404-aurora-drift 11s ease-in-out infinite 2s; }
        .dn404-aurora-3 { animation: dn404-aurora-slow 13s ease-in-out infinite 4s; }
        .dn404-glitch-layer { animation: dn404-glitch 5s steps(1) infinite 3s; }
        .dn404-reveal-1 { animation: dn404-fade-up 0.55s ease-out both; }
        .dn404-reveal-2 { animation: dn404-fade-up 0.55s ease-out 0.12s both; }
        .dn404-reveal-3 { animation: dn404-fade-up 0.55s ease-out 0.26s both; }
        .dn404-reveal-4 { animation: dn404-fade-up 0.55s ease-out 0.40s both; }
        .dn404-reveal-5 { animation: dn404-fade-up 0.55s ease-out 0.55s both; }
        .dn404-scan-line {
          position: absolute; inset: 0;
          background: linear-gradient(transparent 45%, rgba(201,168,76,0.04) 50%, transparent 55%);
          animation: dn404-scan 6s ease-in-out infinite 1s;
          pointer-events: none;
        }
      `}</style>

      {/* ── Aurora arka plan ── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="dn404-aurora-1 absolute -left-40 top-1/4 h-[560px] w-[560px] rounded-full blur-[180px]"
          style={{ background: "radial-gradient(circle, #c4902a 0%, #7a5010 50%, transparent 70%)" }}
        />
        <div
          className="dn404-aurora-2 absolute -right-40 top-1/3 h-[460px] w-[460px] rounded-full blur-[180px]"
          style={{ background: "radial-gradient(circle, #3a4a8a 0%, #1a2258 50%, transparent 70%)" }}
        />
        <div
          className="dn404-aurora-3 absolute bottom-0 left-1/2 h-[380px] w-[760px] -translate-x-1/2 rounded-full blur-[200px]"
          style={{ background: "radial-gradient(circle, #6a1a1a 0%, #3a0808 60%, transparent 70%)", opacity: 0.06 }}
        />
        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.016]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />
      </div>

      {/* ── Uçuşan kayıp kategori etiketleri ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Film */}
        <div
          className="dn404-tag-1 absolute left-[6%] top-[20%] flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold opacity-[0.28]"
          style={{ borderColor: "rgba(104,136,192,0.35)", background: "rgba(56,88,168,0.12)", color: "#6888c0" }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z" />
          </svg>
          Film
        </div>

        {/* Oyun */}
        <div
          className="dn404-tag-2 absolute right-[8%] top-[16%] flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold opacity-[0.22]"
          style={{ borderColor: "rgba(129,140,248,0.35)", background: "rgba(99,102,241,0.1)", color: "#818cf8" }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15 7.5V2H9v5.5l3 3 3-3zM7.5 9H2v6h5.5l3-3-3-3zm1 6.5V21h6v-5.5l-3-3-3 3zm7.5-6.5l-3 3 3 3H21V9h-5.5z" />
          </svg>
          Oyun
        </div>

        {/* Kitap */}
        <div
          className="dn404-tag-3 absolute left-[10%] bottom-[25%] flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold opacity-[0.18]"
          style={{ borderColor: "rgba(201,168,76,0.3)", background: "rgba(201,168,76,0.07)", color: "#c9a84c" }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2zM6 4h5v8l-2.5-1.5L6 12V4z" />
          </svg>
          Kitap
        </div>

        {/* Gezi */}
        <div
          className="dn404-tag-4 absolute right-[7%] bottom-[30%] flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold opacity-[0.22]"
          style={{ borderColor: "rgba(80,160,120,0.3)", background: "rgba(60,130,90,0.08)", color: "#60a88a" }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z" />
          </svg>
          Gezi
        </div>

        {/* Dizi */}
        <div
          className="dn404-tag-5 absolute left-[18%] top-[58%] flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold opacity-[0.14]"
          style={{ borderColor: "rgba(200,176,144,0.3)", background: "rgba(168,140,96,0.07)", color: "#c8b090" }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 14H3V5h18v12z" />
          </svg>
          Dizi
        </div>
      </div>

      {/* ── Ana içerik ── */}
      <div className="relative z-10 flex flex-col items-center">

        {/* Üst durum rozeti */}
        <div
          className="dn404-reveal-1 mb-5 flex items-center gap-2 rounded-full border px-4 py-1.5 backdrop-blur-sm"
          style={{ borderColor: "rgba(229,62,62,0.2)", background: "rgba(229,62,62,0.06)" }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: "#e53e3e", boxShadow: "0 0 6px #e53e3e" }}
          />
          <span className="text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: "#e57070" }}>
            Sayfa Bulunamadı
          </span>
        </div>

        {/* Büyük 404 sayısı */}
        <div className="dn404-reveal-2 relative mb-3 select-none leading-none">
          {/* Ana katman */}
          <h1
            className="text-[clamp(6.5rem,24vw,12rem)] font-black leading-none tracking-tighter"
            style={{
              background: "linear-gradient(160deg, #f0ede8 0%, rgba(240,237,232,0.12) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              filter: "drop-shadow(0 0 60px rgba(201,168,76,0.15))",
            }}
          >
            404
          </h1>

          {/* Glitch — gold overlay katmanı */}
          <h1
            className="dn404-glitch-layer pointer-events-none absolute inset-0 text-[clamp(6.5rem,24vw,12rem)] font-black leading-none tracking-tighter"
            aria-hidden
            style={{
              background: "linear-gradient(135deg, #c9a84c, #e0c068)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            404
          </h1>

          {/* Scan line efekti */}
          <div className="dn404-scan-line" />
        </div>

        {/* Başlık */}
        <h2
          className="dn404-reveal-3 mb-3 text-[1.5rem] font-bold leading-tight sm:text-[1.8rem]"
          style={{ color: "#f0ede8" }}
        >
          Sayfa Bulunamadı
        </h2>

        {/* Açıklama */}
        <p
          className="dn404-reveal-3 mb-2 max-w-[340px] text-sm leading-relaxed sm:max-w-[400px] sm:text-[15px]"
          style={{ color: "rgba(240,237,232,0.48)" }}
        >
          İzleyip not almadığın o filmler gibi —
          <br />
          burada bir iz yok.
        </p>
        <p
          className="dn404-reveal-3 mb-9 max-w-[320px] text-xs leading-relaxed sm:max-w-sm"
          style={{ color: "rgba(240,237,232,0.22)" }}
        >
          Aradığın sayfa silinmiş, taşınmış ya da hiç var olmamış olabilir.
        </p>

        {/* Ince ayraç */}
        <div
          className="dn404-reveal-4 mb-8 h-px w-24"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.35), transparent)",
          }}
        />

        {/* CTA Butonlar */}
        <div className="dn404-reveal-4 flex flex-col gap-3 sm:flex-row sm:gap-4">
          <Link
            href="/"
            className="group relative overflow-hidden rounded-2xl px-8 py-3 text-sm font-bold text-[#1a0e00] transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.02]"
            style={{
              background: "linear-gradient(135deg, #d4a84c, #c9a030, #b88820, #cca038)",
              boxShadow: "0 4px 20px rgba(201,168,76,0.25)",
            }}
          >
            <span className="relative z-10">Ana Sayfaya Dön</span>
            <div
              className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              style={{ background: "linear-gradient(135deg, #e0b84c, #d4a030, #c89020, #dab040)" }}
            />
          </Link>

          <Link
            href="/notes"
            className="rounded-2xl border px-8 py-3 text-sm font-medium transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/[0.04]"
            style={{
              borderColor: "rgba(255,255,255,0.1)",
              color: "rgba(240,237,232,0.6)",
            }}
          >
            Notlarıma Git
          </Link>
        </div>

        {/* Küçük hata kodu */}
        <p
          className="dn404-reveal-5 mt-10 font-mono text-[10px] tracking-widest"
          style={{ color: "rgba(240,237,232,0.14)" }}
        >
          HTTP 404 · NOT_FOUND · digynotes
        </p>
      </div>
    </div>
  );
}
