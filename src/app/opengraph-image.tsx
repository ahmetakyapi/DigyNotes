import { ImageResponse } from "next/og";
import { loadBrandFonts, OG } from "@/lib/og-fonts";
import { OG_SIZE, toJpegResponse } from "@/lib/og-image";
import { OgWordmark } from "@/lib/og-parts";

export const runtime = "nodejs";
export const alt = "DigyNotes — Sana Kalan Her Şey, Burada";
export const size = OG_SIZE;
export const contentType = "image/jpeg";

/* LAYOUT: 1200×630 ink card, read at phone size (≈0.28× in WhatsApp).
   TOP: wordmark.  CENTER: two-line headline (grotesk + serif italic).
   BOTTOM: one plain sentence naming what you can keep, hairline above. */
export default async function OgImage() {
  const fonts = await loadBrandFonts();

  return toJpegResponse(
    new ImageResponse(
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background: OG.ink,
          padding: "60px 72px",
          position: "relative",
          fontFamily: "Sans",
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
            background:
              "radial-gradient(closest-side, rgba(185,168,255,0.22), rgba(185,168,255,0))",
          }}
        />

        <OgWordmark size={46} />

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
              color: OG.bone,
              fontSize: 100,
              fontWeight: 800,
              letterSpacing: -4,
              lineHeight: 0.98,
            }}
          >
            Sana Kalan Her Şey,
          </span>
          <span style={{ display: "flex", alignItems: "baseline" }}>
            <span
              style={{
                color: OG.bone,
                fontSize: 136,
                fontFamily: "Serif",
                fontStyle: "italic",
                lineHeight: 1.05,
                letterSpacing: -3,
              }}
            >
              Burada
            </span>
          </span>
        </div>

        <div
          style={{
            display: "flex",
            borderTop: `2px solid ${OG.border}`,
            paddingTop: 24,
            color: OG.secondary,
            fontSize: 32,
            fontWeight: 500,
          }}
        >
          Film, dizi, kitap, oyun ve gezi notların tek yerde.
        </div>
      </div>,
      { ...OG_SIZE, fonts }
    )
  );
}
