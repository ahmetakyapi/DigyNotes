"use client";
import { useEffect, useState } from "react";

interface Props {
  show: boolean;
  message?: string;
}

export function FullScreenLoader({ show, message = "Notlarınız yükleniyor" }: Props) {
  const [mounted, setMounted] = useState(show);

  useEffect(() => {
    if (show) {
      setMounted(true);
    } else {
      const t = setTimeout(() => setMounted(false), 700);
      return () => clearTimeout(t);
    }
  }, [show]);

  if (!mounted) return null;

  const r = 36;
  const circumference = 2 * Math.PI * r;
  const arcLength = circumference * 0.28;
  const gapLength = circumference - arcLength;

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0c0c0c]"
      style={{
        opacity: show ? 1 : 0,
        transition: "opacity 0.7s cubic-bezier(0.4, 0, 0.2, 1)",
        pointerEvents: show ? "all" : "none",
      }}
    >
      {/* ── Spinning ring + D monogram ── */}
      <div className="relative mb-7 h-24 w-24">
        <svg
          viewBox="0 0 80 80"
          className="absolute inset-0 h-full w-full"
          style={{ animation: "dg-spin 1.2s linear infinite" }}
        >
          {/* Track ring */}
          <circle cx="40" cy="40" r={r} fill="none" stroke="#1c1c1c" strokeWidth="2.5" />
          {/* Glowing arc */}
          <circle
            cx="40"
            cy="40"
            r={r}
            fill="none"
            stroke="#c9a84c"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${gapLength}`}
            strokeDashoffset={arcLength * 0.3}
            style={{ filter: "drop-shadow(0 0 5px rgba(201,168,76,0.55))" }}
          />
          {/* Bright leading dot */}
          <circle
            cx="40"
            cy="4"
            r="3"
            fill="#e0c068"
            style={{ filter: "drop-shadow(0 0 4px rgba(224,192,104,0.9))" }}
          />
        </svg>

        {/* D monogram */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            style={{
              fontSize: "26px",
              fontWeight: 700,
              fontFamily: "Georgia, 'Times New Roman', serif",
              color: "#c9a84c",
              textShadow: "0 0 24px rgba(201,168,76,0.35)",
              letterSpacing: "-0.02em",
            }}
          >
            D
          </span>
        </div>
      </div>

      {/* ── Brand name with letter stagger ── */}
      <div className="flex items-center">
        {"DigyNotes".split("").map((char, i) => (
          <span
            key={i}
            style={{
              display: "inline-block",
              fontSize: "12px",
              letterSpacing: "0.22em",
              fontWeight: 600,
              color: i < 4 ? "#c9a84c" : "#666",
              opacity: 0,
              animation: "dg-fade-up 0.45s ease forwards",
              animationDelay: `${0.08 + i * 0.055}s`,
              textTransform: "uppercase",
            }}
          >
            {char}
          </span>
        ))}
      </div>

      {/* ── Subtle tagline ── */}
      <p
        style={{
          marginTop: "10px",
          fontSize: "10px",
          color: "#333",
          letterSpacing: "0.15em",
          opacity: 0,
          animation: "dg-fade-up 0.5s ease forwards",
          animationDelay: "0.7s",
        }}
      >
        {message}
      </p>

      {/* ── Bottom shimmer bar ── */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{ height: "2px", background: "#0f0f0f", overflow: "hidden" }}
      >
        <div
          style={{
            height: "100%",
            width: "35%",
            background:
              "linear-gradient(90deg, transparent 0%, #c9a84c 40%, #e0c068 50%, #c9a84c 60%, transparent 100%)",
            animation: "dg-shimmer 1.6s ease-in-out infinite",
          }}
        />
      </div>

      <style>{`
        @keyframes dg-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes dg-fade-up {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes dg-shimmer {
          0%   { transform: translateX(-120%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </div>
  );
}
