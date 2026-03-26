import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "DigyNotes — Kişisel Not Defteri";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #0c0c0c 0%, #0f1117 50%, #0c0c0c 100%)",
          fontFamily: "sans-serif",
        }}
      >
        {/* Emerald glow */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 600,
            height: 400,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(16,185,129,0.14), transparent 70%)",
          }}
        />

        {/* Title */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: "#f0ede8",
            letterSpacing: "-0.03em",
          }}
        >
          DigyNotes
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 26,
            fontWeight: 500,
            color: "#888888",
            marginTop: 16,
          }}
        >
          Film · Dizi · Oyun · Kitap · Gezi Notları
        </div>

        {/* Emerald line */}
        <div
          style={{
            width: 400,
            height: 2,
            marginTop: 36,
            background: "linear-gradient(90deg, transparent, #10b981, transparent)",
          }}
        />

        {/* Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginTop: 28,
            padding: "10px 24px",
            borderRadius: 20,
            background: "rgba(16,185,129,0.1)",
            border: "1px solid rgba(16,185,129,0.2)",
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#10b981",
            }}
          />
          <span style={{ fontSize: 16, fontWeight: 600, color: "#10b981" }}>
            Kişisel Dijital Not Defteri
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
