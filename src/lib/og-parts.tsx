import { ImageResponse } from "next/og";
import { loadBrandFonts, OG } from "@/lib/og-fonts";
import { OG_SIZE, toJpegResponse } from "@/lib/og-image";

/* Satori building blocks shared by the share cards. Satori reads no CSS variables or
   classes, so colours come from the literal `OG` palette (dark brand tokens). */

/** "Digy" grotesk + "Notes" serif italic + lavender dot — same as `Wordmark.tsx`. */
export function OgWordmark({ size = 34 }: { size?: number }) {
  return (
    <span style={{ display: "flex", alignItems: "baseline", color: OG.bone }}>
      <span style={{ fontSize: size, fontWeight: 800, letterSpacing: -size * 0.04 }}>Digy</span>
      <span style={{ fontSize: size * 1.08, fontFamily: "Serif", fontStyle: "italic" }}>Notes</span>
      <span
        style={{
          width: size * 0.2,
          height: size * 0.2,
          borderRadius: 999,
          background: OG.lavender,
          marginLeft: size * 0.08,
        }}
      />
    </span>
  );
}

const STAR_PATH = "M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z";

/** Five stars with half-star precision: a dim row with a clipped lavender row on top. */
export function OgStars({ value, size = 40 }: { value: number; size?: number }) {
  const gap = Math.round(size * 0.18);
  const row = (fill: string) =>
    [0, 1, 2, 3, 4].map((i) => (
      <svg key={i} width={size} height={size} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
        <path d={STAR_PATH} fill={fill} />
      </svg>
    ));
  const clamped = Math.max(0, Math.min(5, value));
  const width = clamped * size + Math.floor(clamped) * gap;
  return (
    <div style={{ display: "flex", position: "relative" }}>
      <div style={{ display: "flex", gap }}>{row(OG.border)}</div>
      <div
        style={{
          display: "flex",
          gap,
          position: "absolute",
          top: 0,
          left: 0,
          width,
          height: size,
          overflow: "hidden",
        }}
      >
        {row(OG.lavender)}
      </div>
    </div>
  );
}

/** Soft lavender light from the top-left corner, behind everything else. */
export function OgGlow() {
  return (
    <div
      style={{
        position: "absolute",
        top: -320,
        left: -260,
        width: 980,
        height: 980,
        borderRadius: 9999,
        background: "radial-gradient(closest-side, rgba(185,168,255,0.22), rgba(185,168,255,0))",
      }}
    />
  );
}

/** Card for a link whose content can't be shown (private, missing). Cached briefly. */
export async function renderOgNotice(title: string, line: string) {
  const fonts = await loadBrandFonts();
  return toJpegResponse(
    new ImageResponse(
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          background: OG.ink,
          padding: "64px 72px",
          fontFamily: "Sans",
          position: "relative",
        }}
      >
        <OgGlow />
        <OgWordmark size={40} />
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <span
            style={{
              color: OG.bone,
              fontSize: 96,
              fontFamily: "Serif",
              fontStyle: "italic",
              lineHeight: 1,
              letterSpacing: -2,
            }}
          >
            {title}
          </span>
          <span style={{ color: OG.secondary, fontSize: 34, fontWeight: 500 }}>{line}</span>
        </div>
        <span style={{ color: OG.muted, fontSize: 26, fontWeight: 500 }}>
          Film, dizi, kitap, oyun ve gezi notların tek yerde.
        </span>
      </div>,
      { ...OG_SIZE, fonts }
    ),
    { short: true }
  );
}
