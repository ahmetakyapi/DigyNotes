"use client";

import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

/* ── Color palettes matching DigyNotes theme ── */
const DARK = {
  bg: "#0a0f1e",
  surface: "rgba(255,255,255,0.04)",
  surfaceEl: "#101828",
  border: "#1e3044",
  gold: "#10b981",
  goldLight: "#34d399",
  cyan: "#06b6d4",
  blue: "#38bdf8",
  amber: "#fbbf24",
  red: "#f87171",
  textStrong: "#ecf2ff",
  textSoft: "#94a8c8",
  textMuted: "#6b7f9e",
  glowGold: "rgba(16,185,129,0.13)",
  glowCyan: "rgba(6,182,212,0.10)",
} as const;

const LIGHT = {
  bg: "#f5f7fa",
  surface: "rgba(255,255,255,0.85)",
  surfaceEl: "#ffffff",
  border: "#d4dde8",
  gold: "#059669",
  goldLight: "#10b981",
  cyan: "#0891b2",
  blue: "#1d4ed8",
  amber: "#d97706",
  red: "#ef4444",
  textStrong: "#0f172a",
  textSoft: "#475569",
  textMuted: "#94a3b8",
  glowGold: "rgba(16,185,129,0.09)",
  glowCyan: "rgba(6,182,212,0.07)",
} as const;

type Colors = {
  bg: string; surface: string; surfaceEl: string; border: string;
  gold: string; goldLight: string; cyan: string; blue: string;
  amber: string; red: string;
  textStrong: string; textSoft: string; textMuted: string;
  glowGold: string; glowCyan: string;
};

type SceneProps = { frame: number; fps: number; C: Colors };

function sp(frame: number, fps: number, delay = 0, stiffness = 100, damping = 20) {
  return spring({ frame: frame - delay, fps, config: { stiffness, damping } });
}

/* ── Category chip ── */
function Chip({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      background: `${color}18`, border: `1px solid ${color}30`,
      borderRadius: 20, padding: "2px 8px",
      color, fontSize: 8, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase",
    }}>
      {label}
    </span>
  );
}

/* ── Star rating ── */
function Stars({ count, total = 5, color }: { count: number; total?: number; color: string }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} style={{
          fontSize: 9,
          color: i < count ? color : `${color}30`,
        }}>★</span>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════
   Scene 1 — Notes Feed
══════════════════════════════════════════ */
function NotesFeedScene({ frame, fps, C }: SceneProps) {
  const notes = [
    {
      title: "Oppenheimer",
      cat: "Film", catColor: C.cyan,
      rating: 5,
      excerpt: "Nolan'ın şaheseri. Zaman ve ahlak üzerine derin...",
      avatar: "O", avatarColor: "#6366f1",
    },
    {
      title: "Breaking Bad",
      cat: "Dizi", catColor: C.gold,
      rating: 5,
      excerpt: "Walter White dönüşümü sinema tarihinin en...",
      avatar: "B", avatarColor: "#8b5cf6",
    },
    {
      title: "Dune",
      cat: "Kitap", catColor: C.amber,
      rating: 4,
      excerpt: "Herbert'in evreni sonsuz zenginlikte. Arrakis...",
      avatar: "D", avatarColor: "#f59e0b",
    },
  ];

  const headerP = sp(frame, fps, 0);
  const statsP = sp(frame, fps, 80);
  const notifP = sp(frame, fps, 95);

  return (
    <AbsoluteFill style={{ padding: 26, fontFamily: "system-ui, sans-serif" }}>
      {/* Glow */}
      <div style={{
        position: "absolute", top: -60, left: -60, width: 280, height: 280, borderRadius: "50%",
        background: `radial-gradient(circle, ${C.glowGold}, transparent 70%)`,
        pointerEvents: "none",
      }} />

      {/* Header */}
      <div style={{
        transform: `translateY(${interpolate(headerP, [0, 1], [14, 0])}px)`,
        opacity: headerP, marginBottom: 16,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
            <div style={{
              width: 18, height: 18, borderRadius: 5,
              background: `linear-gradient(135deg, ${C.gold}, ${C.goldLight})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "white", fontSize: 9, fontWeight: 900,
            }}>D</div>
            <span style={{ color: C.gold, fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>
              DigyNotes
            </span>
          </div>
          <h2 style={{ color: C.textStrong, fontSize: 16, fontWeight: 800, margin: "0 0 2px", lineHeight: 1.2 }}>
            Son Notlar
          </h2>
          <p style={{ color: C.textMuted, fontSize: 10, margin: 0 }}>
            47 not · 12 kategori
          </p>
        </div>
        <div style={{
          background: `${C.gold}18`, border: `1px solid ${C.gold}28`,
          borderRadius: 8, padding: "5px 10px",
          color: C.gold, fontSize: 10, fontWeight: 700,
        }}>+ Yeni Not</div>
      </div>

      {/* Note cards */}
      {notes.map((n, i) => {
        const p = sp(frame, fps, 18 + i * 14, 90, 20);
        return (
          <div key={n.title} style={{
            display: "flex", alignItems: "flex-start", gap: 10,
            background: C.surfaceEl,
            border: `1px solid ${C.border}`,
            borderRadius: 11, padding: "10px 12px", marginBottom: 7,
            transform: `translateX(${interpolate(p, [0, 1], [24, 0])}px)`,
            opacity: p,
          }}>
            {/* Avatar */}
            <div style={{
              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
              background: `linear-gradient(135deg, ${n.avatarColor}, ${n.avatarColor}88)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "white", fontSize: 12, fontWeight: 800,
            }}>{n.avatar}</div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                <p style={{ color: C.textStrong, fontSize: 11, fontWeight: 700, margin: 0 }}>{n.title}</p>
                <Chip label={n.cat} color={n.catColor} />
              </div>
              <Stars count={n.rating} color={n.catColor} />
              <p style={{ color: C.textMuted, fontSize: 9, margin: "4px 0 0", lineHeight: 1.5 }}>{n.excerpt}</p>
            </div>
          </div>
        );
      })}

      {/* Stats strip */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginTop: 4,
        opacity: statsP, transform: `translateY(${interpolate(statsP, [0, 1], [10, 0])}px)`,
      }}>
        {[
          { label: "Toplam Not", value: "47", color: C.gold },
          { label: "Film & Dizi", value: "29", color: C.cyan },
          { label: "Bu Ay", value: "8", color: C.blue },
        ].map((s) => (
          <div key={s.label} style={{
            background: `${s.color}10`, border: `1px solid ${s.color}22`,
            borderRadius: 9, padding: "7px 10px", textAlign: "center",
          }}>
            <strong style={{ color: s.color, fontSize: 18, fontWeight: 900, lineHeight: 1, display: "block" }}>
              {s.value}
            </strong>
            <span style={{ color: C.textMuted, fontSize: 8, fontWeight: 600 }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Live badge */}
      <div style={{
        position: "absolute", top: 20, right: 20,
        background: `${C.goldLight}14`, border: `1px solid ${C.goldLight}30`,
        borderRadius: 10, padding: "6px 10px",
        display: "flex", alignItems: "center", gap: 5,
        opacity: notifP,
        transform: `translateX(${interpolate(notifP, [0, 1], [16, 0])}px)`,
      }}>
        <div style={{
          width: 6, height: 6, borderRadius: "50%", background: C.gold,
          boxShadow: `0 0 6px ${C.gold}`,
        }} />
        <span style={{ color: C.gold, fontSize: 9, fontWeight: 700 }}>Canlı güncelleniyor</span>
      </div>
    </AbsoluteFill>
  );
}

/* ══════════════════════════════════════════
   Scene 2 — Note Writing
══════════════════════════════════════════ */
function NoteWritingScene({ frame, fps, C }: SceneProps) {
  const NOTE_TEXT = "Christopher Nolan bu filmde zamana farklı bir bakış açısı getiriyor. Interstellar, bilim kurgu sinemasının sınırlarını zorlayan, izleyiciyi hem duygusal hem entelektüel olarak etkileyen...";

  const headerP = sp(frame, fps, 0);
  const movieP = sp(frame, fps, 12, 80, 18);
  const starsP = sp(frame, fps, 28);
  const textP = sp(frame, fps, 45);
  const tagsP = sp(frame, fps, 70);

  const starsLit = Math.floor(interpolate(frame, [28, 65], [0, 5], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  }));

  const charCount = Math.floor(interpolate(frame, [50, 140], [0, NOTE_TEXT.length], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  }));

  return (
    <AbsoluteFill style={{ padding: 26, fontFamily: "system-ui, sans-serif" }}>
      {/* Glow */}
      <div style={{
        position: "absolute", bottom: -50, right: -50, width: 260, height: 260, borderRadius: "50%",
        background: `radial-gradient(circle, ${C.glowCyan}, transparent 70%)`,
        pointerEvents: "none",
      }} />

      {/* Header */}
      <div style={{
        opacity: headerP,
        transform: `translateY(${interpolate(headerP, [0, 1], [14, 0])}px)`,
        marginBottom: 16,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
          <span style={{ color: C.textMuted, fontSize: 9, cursor: "pointer" }}>← Notlarım</span>
          <span style={{ color: C.border, fontSize: 9 }}>/</span>
          <span style={{ color: C.textSoft, fontSize: 9, fontWeight: 600 }}>Yeni Not</span>
        </div>
        <h2 style={{ color: C.textStrong, fontSize: 16, fontWeight: 800, margin: 0, lineHeight: 1.2 }}>
          Not Yazılıyor
        </h2>
      </div>

      {/* Movie card */}
      <div style={{
        display: "flex", gap: 12, alignItems: "center",
        background: C.surfaceEl, border: `1px solid ${C.border}`,
        borderRadius: 11, padding: "10px 12px", marginBottom: 12,
        opacity: movieP,
        transform: `translateY(${interpolate(movieP, [0, 1], [12, 0])}px)`,
      }}>
        {/* Poster placeholder */}
        <div style={{
          width: 40, height: 56, borderRadius: 6, flexShrink: 0,
          background: `linear-gradient(160deg, ${C.cyan}, ${C.blue})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "white", fontSize: 18,
        }}>🎬</div>
        <div>
          <p style={{ color: C.textStrong, fontSize: 13, fontWeight: 800, margin: "0 0 2px" }}>Interstellar</p>
          <p style={{ color: C.textMuted, fontSize: 10, margin: "0 0 5px" }}>2014 · Christopher Nolan</p>
          <Chip label="Film" color={C.cyan} />
        </div>
      </div>

      {/* Star rating */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8, marginBottom: 10,
        opacity: starsP,
      }}>
        <span style={{ color: C.textMuted, fontSize: 9, fontWeight: 600 }}>Puan:</span>
        <div style={{ display: "flex", gap: 4 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <span key={i} style={{
              fontSize: 16,
              color: i <= starsLit ? C.amber : `${C.textMuted}44`,
              transition: "color 0.1s",
            }}>★</span>
          ))}
        </div>
        <span style={{ color: C.amber, fontSize: 10, fontWeight: 700 }}>
          {starsLit > 0 ? `${starsLit}/5` : ""}
        </span>
      </div>

      {/* Text area */}
      <div style={{
        background: C.surface,
        border: `1px solid ${C.gold}30`,
        borderRadius: 10, padding: "10px 12px", marginBottom: 10,
        minHeight: 72,
        opacity: textP,
        transform: `translateY(${interpolate(textP, [0, 1], [8, 0])}px)`,
      }}>
        <p style={{ color: C.textStrong, fontSize: 10, lineHeight: 1.65, margin: 0 }}>
          {NOTE_TEXT.slice(0, charCount)}
          {charCount < NOTE_TEXT.length && (
            <span style={{
              display: "inline-block", width: 1, height: 11,
              background: C.gold, marginLeft: 1, verticalAlign: "text-bottom",
              opacity: frame % 20 < 10 ? 1 : 0,
            }} />
          )}
        </p>
      </div>

      {/* Tags */}
      <div style={{
        display: "flex", gap: 5, flexWrap: "wrap",
        opacity: tagsP,
        transform: `translateY(${interpolate(tagsP, [0, 1], [8, 0])}px)`,
      }}>
        {["Bilim Kurgu", "Christopher Nolan", "Uzay", "Duygusal"].map((tag) => (
          <div key={tag} style={{
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 20, padding: "3px 8px",
            color: C.textSoft, fontSize: 9, fontWeight: 600,
          }}># {tag}</div>
        ))}
        <div style={{
          background: `${C.gold}14`, border: `1px solid ${C.gold}30`,
          borderRadius: 20, padding: "3px 8px",
          color: C.gold, fontSize: 9, fontWeight: 700, cursor: "pointer",
        }}>+ Etiket Ekle</div>
      </div>

      {/* Save button */}
      <div style={{
        position: "absolute", bottom: 20, right: 20,
        background: `linear-gradient(135deg, ${C.gold}, ${C.goldLight})`,
        borderRadius: 9, padding: "7px 16px",
        color: "white", fontSize: 10, fontWeight: 700,
        opacity: sp(frame, fps, 100),
        boxShadow: `0 4px 16px ${C.gold}40`,
      }}>Kaydet →</div>
    </AbsoluteFill>
  );
}

/* ══════════════════════════════════════════
   Main Composition — 300 frames @ 30fps = 10s
══════════════════════════════════════════ */
export type DigyNotesIntroProps = { theme?: "dark" | "light" };

export function DigyNotesIntro({ theme = "dark" }: DigyNotesIntroProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const C: Colors = theme === "light" ? LIGHT : DARK;

  const s1Opacity = interpolate(frame, [0, 12, 120, 148], [0, 1, 1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const s2Opacity = interpolate(frame, [148, 168, 275, 298], [0, 1, 1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  const scene2Frame = Math.max(0, frame - 155);

  return (
    <AbsoluteFill style={{ background: C.bg, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, opacity: s1Opacity }}>
        <NotesFeedScene frame={frame} fps={fps} C={C} />
      </div>
      <div style={{ position: "absolute", inset: 0, opacity: s2Opacity }}>
        <NoteWritingScene frame={scene2Frame} fps={fps} C={C} />
      </div>
    </AbsoluteFill>
  );
}
