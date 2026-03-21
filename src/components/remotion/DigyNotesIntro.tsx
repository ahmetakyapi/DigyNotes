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

type SceneProps = { readonly frame: number; readonly fps: number; readonly C: Colors };

function sp(frame: number, fps: number, delay = 0, stiffness = 100, damping = 20) {
  return spring({ frame: frame - delay, fps, config: { stiffness, damping } });
}

/* ── Scene opacity helper ── */
function sceneOpacity(frame: number, start: number) {
  return interpolate(
    frame,
    [start, start + 15, start + 155, start + 175],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
}

/* ── Category chip ── */
function Chip({ label, color }: { readonly label: string; readonly color: string }) {
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
function Stars({ count, total = 5, color }: { readonly count: number; readonly total?: number; readonly color: string }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {Array.from({ length: total }, (_, i) => i + 1).map((i) => (
        <span key={i} style={{ fontSize: 9, color: i <= count ? color : `${color}30` }}>★</span>
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
      excerpt: "Nolan'ın şaheseri. Zaman ve ahlak üzerine derin bir sorgulama...",
      avatar: "O", avatarColor: "#6366f1",
    },
    {
      title: "Breaking Bad",
      cat: "Dizi", catColor: C.gold,
      rating: 5,
      excerpt: "Walter White dönüşümü sinema tarihinin en iyi karakteri...",
      avatar: "B", avatarColor: "#8b5cf6",
    },
    {
      title: "Dune",
      cat: "Kitap", catColor: C.amber,
      rating: 4,
      excerpt: "Herbert'in evreni sonsuz zenginlikte. Arrakis'in kum fırtınaları...",
      avatar: "D", avatarColor: "#f59e0b",
    },
  ];

  const headerP = sp(frame, fps, 0);
  const statsP = sp(frame, fps, 80);
  const notifP = sp(frame, fps, 95);

  return (
    <AbsoluteFill style={{ padding: 26, fontFamily: "system-ui, sans-serif" }}>
      <div style={{
        position: "absolute", top: -60, left: -60, width: 280, height: 280, borderRadius: "50%",
        background: `radial-gradient(circle, ${C.glowGold}, transparent 70%)`,
        pointerEvents: "none",
      }} />

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
          <p style={{ color: C.textMuted, fontSize: 10, margin: 0 }}>47 not · 12 kategori</p>
        </div>
        <div style={{
          background: `${C.gold}18`, border: `1px solid ${C.gold}28`,
          borderRadius: 8, padding: "5px 10px",
          color: C.gold, fontSize: 10, fontWeight: 700,
        }}>+ Yeni Not</div>
      </div>

      {notes.map((n, i) => {
        const p = sp(frame, fps, 18 + i * 14, 90, 20);
        return (
          <div key={n.title} style={{
            display: "flex", alignItems: "flex-start", gap: 10,
            background: C.surfaceEl, border: `1px solid ${C.border}`,
            borderRadius: 11, padding: "10px 12px", marginBottom: 7,
            transform: `translateX(${interpolate(p, [0, 1], [24, 0])}px)`,
            opacity: p,
          }}>
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
      <div style={{
        position: "absolute", bottom: -50, right: -50, width: 260, height: 260, borderRadius: "50%",
        background: `radial-gradient(circle, ${C.glowCyan}, transparent 70%)`,
        pointerEvents: "none",
      }} />

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

      <div style={{
        display: "flex", gap: 12, alignItems: "center",
        background: C.surfaceEl, border: `1px solid ${C.border}`,
        borderRadius: 11, padding: "10px 12px", marginBottom: 12,
        opacity: movieP,
        transform: `translateY(${interpolate(movieP, [0, 1], [12, 0])}px)`,
      }}>
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

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, opacity: starsP }}>
        <span style={{ color: C.textMuted, fontSize: 9, fontWeight: 600 }}>Puan:</span>
        <div style={{ display: "flex", gap: 4 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <span key={i} style={{ fontSize: 16, color: i <= starsLit ? C.amber : `${C.textMuted}44` }}>★</span>
          ))}
        </div>
        <span style={{ color: C.amber, fontSize: 10, fontWeight: 700 }}>
          {starsLit > 0 ? `${starsLit}/5` : ""}
        </span>
      </div>

      <div style={{
        background: C.surface, border: `1px solid ${C.gold}30`,
        borderRadius: 10, padding: "10px 12px", marginBottom: 10, minHeight: 72,
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

      <div style={{
        display: "flex", gap: 5, flexWrap: "wrap",
        opacity: tagsP, transform: `translateY(${interpolate(tagsP, [0, 1], [8, 0])}px)`,
      }}>
        {["Bilim Kurgu", "Christopher Nolan", "Uzay", "Duygusal"].map((tag) => (
          <div key={tag} style={{
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 20, padding: "3px 8px", color: C.textSoft, fontSize: 9, fontWeight: 600,
          }}># {tag}</div>
        ))}
        <div style={{
          background: `${C.gold}14`, border: `1px solid ${C.gold}30`,
          borderRadius: 20, padding: "3px 8px", color: C.gold, fontSize: 9, fontWeight: 700,
        }}>+ Etiket Ekle</div>
      </div>

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
   Scene 3 — Search & Filter
══════════════════════════════════════════ */
function SearchScene({ frame, fps, C }: SceneProps) {
  const SEARCH_TEXT = "christopher nolan";
  const searchChars = Math.floor(interpolate(frame, [20, 70], [0, SEARCH_TEXT.length], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  }));

  const results = [
    { title: "Interstellar", cat: "Film", catColor: C.cyan, rating: 5, year: "2014" },
    { title: "Oppenheimer", cat: "Film", catColor: C.cyan, rating: 5, year: "2023" },
    { title: "Tenet", cat: "Film", catColor: C.cyan, rating: 4, year: "2020" },
    { title: "Inception", cat: "Film", catColor: C.cyan, rating: 5, year: "2010" },
  ];

  const filters = [
    { label: "Tümü", active: false, color: C.textMuted },
    { label: "Film", active: true, color: C.cyan },
    { label: "Dizi", active: false, color: C.gold },
    { label: "Kitap", active: false, color: C.amber },
    { label: "Müzik", active: false, color: C.blue },
  ];

  const headerP = sp(frame, fps, 0);
  const searchBoxP = sp(frame, fps, 8);
  const filtersP = sp(frame, fps, 16);
  const resultCountP = sp(frame, fps, 78);

  return (
    <AbsoluteFill style={{ padding: 26, fontFamily: "system-ui, sans-serif" }}>
      <div style={{
        position: "absolute", top: -60, right: -60, width: 260, height: 260, borderRadius: "50%",
        background: `radial-gradient(circle, ${C.glowCyan}, transparent 70%)`,
        pointerEvents: "none",
      }} />

      {/* Header */}
      <div style={{
        opacity: headerP,
        transform: `translateY(${interpolate(headerP, [0, 1], [14, 0])}px)`,
        marginBottom: 14,
      }}>
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
          Notları Keşfet
        </h2>
        <p style={{ color: C.textMuted, fontSize: 10, margin: 0 }}>47 not arasında arama yap</p>
      </div>

      {/* Search box */}
      <div style={{
        display: "flex", alignItems: "center", gap: 9,
        background: C.surfaceEl, border: `1px solid ${C.gold}30`,
        borderRadius: 11, padding: "10px 14px", marginBottom: 10,
        opacity: searchBoxP,
        transform: `translateY(${interpolate(searchBoxP, [0, 1], [10, 0])}px)`,
      }}>
        <span style={{ color: C.textMuted, fontSize: 14 }}>🔍</span>
        <span style={{ color: C.textStrong, fontSize: 12, flex: 1 }}>
          {SEARCH_TEXT.slice(0, searchChars)}
          {searchChars < SEARCH_TEXT.length && (
            <span style={{
              display: "inline-block", width: 1, height: 13,
              background: C.gold, marginLeft: 1, verticalAlign: "text-bottom",
              opacity: frame % 18 < 9 ? 1 : 0,
            }} />
          )}
          {searchChars >= SEARCH_TEXT.length && (
            <span style={{ color: C.textMuted, fontSize: 12 }}> </span>
          )}
        </span>
        <div style={{
          background: `${C.cyan}14`, border: `1px solid ${C.cyan}28`,
          borderRadius: 6, padding: "3px 8px", color: C.cyan, fontSize: 9, fontWeight: 700,
        }}>4 sonuç</div>
      </div>

      {/* Filter chips */}
      <div style={{
        display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap",
        opacity: filtersP, transform: `translateX(${interpolate(filtersP, [0, 1], [-12, 0])}px)`,
      }}>
        {filters.map((f) => (
          <div key={f.label} style={{
            background: f.active ? `${f.color}20` : C.surface,
            border: `1px solid ${f.active ? f.color + "40" : C.border}`,
            borderRadius: 20, padding: "4px 11px",
            color: f.active ? f.color : C.textMuted,
            fontSize: 9, fontWeight: f.active ? 700 : 500,
          }}>{f.label}</div>
        ))}
      </div>

      {/* Results */}
      {results.map((r, i) => {
        const p = sp(frame, fps, 80 + i * 10, 90, 20);
        return (
          <div key={r.title} style={{
            display: "flex", alignItems: "center", gap: 10,
            background: C.surfaceEl, border: `1px solid ${C.border}`,
            borderRadius: 10, padding: "9px 12px", marginBottom: 6,
            opacity: p, transform: `translateX(${interpolate(p, [0, 1], [18, 0])}px)`,
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: 8, flexShrink: 0,
              background: `linear-gradient(135deg, ${C.cyan}40, ${C.blue}40)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16,
            }}>🎬</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                <span style={{ color: C.textStrong, fontSize: 11, fontWeight: 700 }}>{r.title}</span>
                <Chip label={r.cat} color={r.catColor} />
              </div>
              <Stars count={r.rating} color={r.catColor} />
            </div>
            <span style={{ color: C.textMuted, fontSize: 9 }}>{r.year}</span>
          </div>
        );
      })}

      {/* Result count */}
      <div style={{
        position: "absolute", bottom: 22, left: 26,
        color: C.textMuted, fontSize: 9,
        opacity: resultCountP,
      }}>
        <span style={{ color: C.cyan, fontWeight: 700 }}>4</span> sonuç · &quot;christopher nolan&quot;
      </div>
    </AbsoluteFill>
  );
}

/* ══════════════════════════════════════════
   Scene 4 — Statistics
══════════════════════════════════════════ */
function StatsScene({ frame, fps, C }: SceneProps) {
  const months = [
    { m: "Eki", v: 3 }, { m: "Kas", v: 5 }, { m: "Ara", v: 4 },
    { m: "Oca", v: 7 }, { m: "Şub", v: 6 }, { m: "Mar", v: 8 },
  ];
  const maxV = 8;

  const cats = [
    { label: "Film", count: 29, color: C.cyan, pct: 62 },
    { label: "Kitap", count: 11, color: C.amber, pct: 23 },
    { label: "Dizi", count: 5, color: C.gold, pct: 11 },
    { label: "Müzik", count: 2, color: C.blue, pct: 4 },
  ];

  const headerP = sp(frame, fps, 0);
  const streakP = sp(frame, fps, 10);
  const chartLabelP = sp(frame, fps, 18);
  const catLabelP = sp(frame, fps, 90);

  return (
    <AbsoluteFill style={{ padding: 26, fontFamily: "system-ui, sans-serif" }}>
      <div style={{
        position: "absolute", bottom: -60, left: -60, width: 280, height: 280, borderRadius: "50%",
        background: `radial-gradient(circle, ${C.glowGold}, transparent 70%)`,
        pointerEvents: "none",
      }} />

      {/* Header */}
      <div style={{
        opacity: headerP,
        transform: `translateY(${interpolate(headerP, [0, 1], [14, 0])}px)`,
        marginBottom: 12,
        display: "flex", justifyContent: "space-between", alignItems: "flex-start",
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
            <span style={{ color: C.gold, fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>
              İstatistikler
            </span>
          </div>
          <h2 style={{ color: C.textStrong, fontSize: 16, fontWeight: 800, margin: "0 0 2px", lineHeight: 1.2 }}>
            Okuma Alışkanlıkları
          </h2>
          <p style={{ color: C.textMuted, fontSize: 10, margin: 0 }}>Son 6 ay · 33 not</p>
        </div>

        {/* Streak badge */}
        <div style={{
          background: `${C.amber}18`, border: `1px solid ${C.amber}30`,
          borderRadius: 12, padding: "8px 12px", textAlign: "center",
          opacity: streakP, transform: `translateX(${interpolate(streakP, [0, 1], [14, 0])}px)`,
        }}>
          <div style={{ fontSize: 18, lineHeight: 1, marginBottom: 2 }}>🔥</div>
          <strong style={{ color: C.amber, fontSize: 16, fontWeight: 900, lineHeight: 1, display: "block" }}>12</strong>
          <span style={{ color: C.textMuted, fontSize: 8 }}>gün seri</span>
        </div>
      </div>

      {/* Chart label */}
      <p style={{
        color: C.textMuted, fontSize: 9, fontWeight: 700, letterSpacing: 1.5,
        textTransform: "uppercase", margin: "0 0 8px",
        opacity: chartLabelP,
      }}>Aylık Not Sayısı</p>

      {/* Bar chart */}
      <div style={{
        display: "flex", alignItems: "flex-end", gap: 6, height: 72, marginBottom: 16,
      }}>
        {months.map((m, i) => {
          const barH = interpolate(frame, [25 + i * 8, 75 + i * 8], [0, (m.v / maxV) * 72], {
            extrapolateLeft: "clamp", extrapolateRight: "clamp",
          });
          const isLast = i === months.length - 1;
          return (
            <div key={m.m} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", height: 72 }}>
                <div style={{
                  width: "100%", height: barH,
                  background: isLast
                    ? `linear-gradient(180deg, ${C.gold}, ${C.goldLight})`
                    : `${C.gold}40`,
                  borderRadius: "3px 3px 0 0",
                  minWidth: 18,
                }} />
              </div>
              <span style={{ color: isLast ? C.gold : C.textMuted, fontSize: 8, fontWeight: isLast ? 700 : 400 }}>
                {m.m}
              </span>
            </div>
          );
        })}
      </div>

      {/* Category breakdown label */}
      <p style={{
        color: C.textMuted, fontSize: 9, fontWeight: 700, letterSpacing: 1.5,
        textTransform: "uppercase", margin: "0 0 9px",
        opacity: catLabelP,
      }}>Kategori Dağılımı</p>

      {cats.map((cat, i) => {
        const p = sp(frame, fps, 95 + i * 10);
        const barW = interpolate(frame, [110 + i * 10, 150 + i * 10], [0, cat.pct], {
          extrapolateLeft: "clamp", extrapolateRight: "clamp",
        });
        return (
          <div key={cat.label} style={{
            marginBottom: 8, opacity: p,
            transform: `translateX(${interpolate(p, [0, 1], [-14, 0])}px)`,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 6, height: 6, borderRadius: 2, background: cat.color }} />
                <span style={{ color: C.textSoft, fontSize: 10 }}>{cat.label}</span>
              </div>
              <span style={{ color: cat.color, fontSize: 10, fontWeight: 700 }}>{cat.count}</span>
            </div>
            <div style={{ height: 4, background: `${cat.color}18`, borderRadius: 2, overflow: "hidden" }}>
              <div style={{ width: `${barW}%`, height: "100%", background: cat.color, borderRadius: 2 }} />
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
}

/* ══════════════════════════════════════════
   Scene 5 — Collections
══════════════════════════════════════════ */
function CollectionsScene({ frame, fps, C }: SceneProps) {
  const collections = [
    {
      name: "İzleme Listesi",
      count: 12,
      desc: "Bekleyen filmler",
      color: C.cyan,
      emoji: "🎬",
      items: ["Dune: Part 2", "Poor Things", "Asteroid City"],
    },
    {
      name: "Kitaplığım",
      count: 8,
      desc: "Okuduğum kitaplar",
      color: C.amber,
      emoji: "📚",
      items: ["Suç ve Ceza", "1984", "Savaş ve Barış"],
    },
    {
      name: "Favori Filmler",
      count: 17,
      desc: "Tüm zamanların en iyileri",
      color: C.gold,
      emoji: "⭐",
      items: ["Interstellar", "Inception", "Blade Runner 2049"],
    },
  ];

  const headerP = sp(frame, fps, 0);
  const totalP = sp(frame, fps, 110);

  return (
    <AbsoluteFill style={{ padding: 26, fontFamily: "system-ui, sans-serif" }}>
      <div style={{
        position: "absolute", top: -60, right: -60, width: 280, height: 280, borderRadius: "50%",
        background: `radial-gradient(circle, ${C.glowGold}, transparent 70%)`,
        pointerEvents: "none",
      }} />

      {/* Header */}
      <div style={{
        opacity: headerP,
        transform: `translateY(${interpolate(headerP, [0, 1], [14, 0])}px)`,
        marginBottom: 16,
        display: "flex", justifyContent: "space-between", alignItems: "center",
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
              Koleksiyonlar
            </span>
          </div>
          <h2 style={{ color: C.textStrong, fontSize: 16, fontWeight: 800, margin: "0 0 2px", lineHeight: 1.2 }}>
            Listelerim
          </h2>
          <p style={{ color: C.textMuted, fontSize: 10, margin: 0 }}>3 koleksiyon · 37 içerik</p>
        </div>
        <div style={{
          background: `${C.gold}18`, border: `1px solid ${C.gold}28`,
          borderRadius: 8, padding: "5px 10px",
          color: C.gold, fontSize: 10, fontWeight: 700,
        }}>+ Yeni Liste</div>
      </div>

      {collections.map((col, i) => {
        const p = sp(frame, fps, 18 + i * 22, 80, 18);
        return (
          <div key={col.name} style={{
            background: C.surfaceEl,
            border: `1px solid ${col.color}22`,
            borderRadius: 14, padding: "13px 14px", marginBottom: 10,
            opacity: p, transform: `translateX(${interpolate(p, [0, 1], [i % 2 === 0 ? -22 : 22, 0])}px)`,
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                  background: `${col.color}18`, border: `1px solid ${col.color}28`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18,
                }}>{col.emoji}</div>
                <div>
                  <p style={{ color: C.textStrong, fontSize: 12, fontWeight: 700, margin: "0 0 2px" }}>{col.name}</p>
                  <p style={{ color: C.textMuted, fontSize: 10, margin: 0 }}>{col.desc}</p>
                </div>
              </div>
              <div style={{
                background: `${col.color}18`, color: col.color,
                fontSize: 14, fontWeight: 900,
                padding: "4px 10px", borderRadius: 8,
                border: `1px solid ${col.color}28`,
              }}>{col.count}</div>
            </div>

            {/* Preview items */}
            <div style={{ display: "flex", gap: 5 }}>
              {col.items.map((item) => (
                <div key={item} style={{
                  background: C.surface, border: `1px solid ${C.border}`,
                  borderRadius: 6, padding: "3px 8px",
                  color: C.textSoft, fontSize: 8, fontWeight: 500,
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  maxWidth: 90,
                }}>{item}</div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Total badge */}
      <div style={{
        position: "absolute", bottom: 22, left: 26, right: 26,
        background: `${C.gold}10`, border: `1px solid ${C.gold}20`,
        borderRadius: 10, padding: "9px 14px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        opacity: totalP, transform: `translateY(${interpolate(totalP, [0, 1], [10, 0])}px)`,
      }}>
        <span style={{ color: C.textSoft, fontSize: 10 }}>Toplam takip edilen içerik</span>
        <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
          <strong style={{ color: C.gold, fontSize: 20, fontWeight: 900, lineHeight: 1 }}>37</strong>
          <span style={{ color: C.textMuted, fontSize: 9 }}>içerik</span>
        </div>
      </div>
    </AbsoluteFill>
  );
}

/* ══════════════════════════════════════════
   Main Composition
   840 frames @ 30fps = 28s looping
   Scene 1: Notes Feed        0   → 175
   Scene 2: Note Writing      165 → 340
   Scene 3: Search & Filter   330 → 505
   Scene 4: Statistics        495 → 670
   Scene 5: Collections       660 → 840
══════════════════════════════════════════ */
export type DigyNotesIntroProps = { theme?: "dark" | "light" };

export function DigyNotesIntro({ theme = "dark" }: DigyNotesIntroProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const C: Colors = theme === "light" ? LIGHT : DARK;

  const s1Op = sceneOpacity(frame, 0);
  const s2Op = sceneOpacity(frame, 165);
  const s3Op = sceneOpacity(frame, 330);
  const s4Op = sceneOpacity(frame, 495);
  const s5Op = sceneOpacity(frame, 660);

  return (
    <AbsoluteFill style={{ background: C.bg, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, opacity: s1Op }}>
        <NotesFeedScene frame={frame} fps={fps} C={C} />
      </div>
      <div style={{ position: "absolute", inset: 0, opacity: s2Op }}>
        <NoteWritingScene frame={Math.max(0, frame - 165)} fps={fps} C={C} />
      </div>
      <div style={{ position: "absolute", inset: 0, opacity: s3Op }}>
        <SearchScene frame={Math.max(0, frame - 330)} fps={fps} C={C} />
      </div>
      <div style={{ position: "absolute", inset: 0, opacity: s4Op }}>
        <StatsScene frame={Math.max(0, frame - 495)} fps={fps} C={C} />
      </div>
      <div style={{ position: "absolute", inset: 0, opacity: s5Op }}>
        <CollectionsScene frame={Math.max(0, frame - 660)} fps={fps} C={C} />
      </div>
    </AbsoluteFill>
  );
}
