import { ImageResponse } from "next/og";
import { loadBrandFonts } from "@/lib/og-fonts";

export const runtime = "edge";
export const alt = "DigyNotes — Sana Kalan Her Şey, Burada";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/* Satori cannot read CSS variables or WebP, so this card uses literal brand colours
   and Google-hosted TTFs (fetched without a browser UA, Google serves TTF). */
const INK = "#0b0b0a";
const BONE = "#f2efe8";
const MUTED = "#77726a";
const LAVENDER = "#b9a8ff";

/* LAYOUT: 1200×630 ink card.
   TOP: "Dn." mark tile + mono label.  CENTER: two-line headline (grotesk + serif italic).
   BOTTOM: category line left, domain right, hairline above. */
export default async function OgImage() {
  const sansText = "DSana Kalan Her Şey,(DN)KİŞİSEL NOT DEFTERİNFİLM—DİZİOYUNKTPGEZDigyNotes.";
  const fonts = await loadBrandFonts(sansText + "Burada.n");

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        background: INK,
        padding: "64px 72px",
        position: "relative",
        fontFamily: "Hanken",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -260,
          left: -200,
          width: 900,
          height: 900,
          borderRadius: 9999,
          background: "radial-gradient(closest-side, rgba(185,168,255,0.22), rgba(185,168,255,0))",
        }}
      />

      <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "center",
            width: 84,
            height: 84,
            borderRadius: 22,
            background: "#161613",
            border: "1px solid #282722",
            paddingTop: 10,
          }}
        >
          <span style={{ color: BONE, fontSize: 50, fontWeight: 800, letterSpacing: -3 }}>D</span>
          <span
            style={{ color: BONE, fontSize: 52, fontFamily: "Instrument", fontStyle: "italic" }}
          >
            n
          </span>
          <span
            style={{ width: 10, height: 10, borderRadius: 10, background: LAVENDER, marginLeft: 2 }}
          />
        </div>
        <span style={{ color: MUTED, fontSize: 20, letterSpacing: 4 }}>
          <span style={{ color: LAVENDER, marginRight: 14 }}>(DN)</span>KİŞİSEL NOT DEFTERİN
        </span>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          marginTop: "auto",
          marginBottom: "auto",
        }}
      >
        <span
          style={{
            color: BONE,
            fontSize: 112,
            fontWeight: 800,
            letterSpacing: -6,
            lineHeight: 0.95,
          }}
        >
          Sana Kalan Her Şey,
        </span>
        <span style={{ display: "flex", alignItems: "baseline" }}>
          <span
            style={{
              color: BONE,
              fontSize: 132,
              fontFamily: "Instrument",
              fontStyle: "italic",
              lineHeight: 1,
              letterSpacing: -3,
            }}
          >
            Burada
          </span>
          <span style={{ color: LAVENDER, fontSize: 132, fontWeight: 800, lineHeight: 1 }}>.</span>
        </span>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          borderTop: "1px solid #282722",
          paddingTop: 22,
          color: MUTED,
          fontSize: 20,
          letterSpacing: 4,
        }}
      >
        <span>FİLM — DİZİ — OYUN — KİTAP — GEZİ</span>
        <span style={{ color: BONE }}>DigyNotes</span>
      </div>
    </div>,
    { ...size, fonts }
  );
}
