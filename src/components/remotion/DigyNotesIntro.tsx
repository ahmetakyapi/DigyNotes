"use client";

import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import {
  Film,
  Tv,
  BookOpen,
  Search,
  Star,
  TrendingUp,
  Tag,
  Bookmark,
  List,
  BarChart3,
  Flame,
  CheckCircle,
  Clock,
  Plus,
  ArrowLeft,
  type LucideIcon,
} from "lucide-react";

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
  purple: "#a78bfa",
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
  purple: "#7c3aed",
  textStrong: "#0f172a",
  textSoft: "#475569",
  textMuted: "#94a3b8",
  glowGold: "rgba(16,185,129,0.09)",
  glowCyan: "rgba(6,182,212,0.07)",
} as const;

type Colors = {
  bg: string;
  surface: string;
  surfaceEl: string;
  border: string;
  gold: string;
  goldLight: string;
  cyan: string;
  blue: string;
  amber: string;
  red: string;
  purple: string;
  textStrong: string;
  textSoft: string;
  textMuted: string;
  glowGold: string;
  glowCyan: string;
};

type SceneProps = { readonly frame: number; readonly fps: number; readonly C: Colors };

function sp(frame: number, fps: number, delay = 0, stiffness = 100, damping = 20) {
  return spring({ frame: frame - delay, fps, config: { stiffness, damping } });
}

function sceneOpacity(frame: number, start: number) {
  return interpolate(frame, [start, start + 15, start + 155, start + 175], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

/* ── DigyNotes logo component ── */
function DigyNotesLogo() {
  return <Img src="/app-logo.png" style={{ height: 22, width: "auto", objectFit: "contain" }} />;
}

/* ── Category chip ── */
function Chip({ label, color }: { readonly label: string; readonly color: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        background: `${color}18`,
        border: `1px solid ${color}30`,
        borderRadius: 20,
        padding: "2px 8px",
        color,
        fontSize: 8,
        fontWeight: 700,
        letterSpacing: 0.8,
        textTransform: "uppercase",
      }}
    >
      {label}
    </span>
  );
}

/* ── Star rating ── */
function StarRating({
  count,
  total = 5,
  color,
}: {
  readonly count: number;
  readonly total?: number;
  readonly color: string;
}) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {Array.from({ length: total }, (_, i) => i + 1).map((i) => (
        <Star key={i} size={9} color={color} fill={i <= count ? color : "none"} strokeWidth={1.5} />
      ))}
    </div>
  );
}

/* ── Movie poster card ── */
type PosterData = {
  title: string;
  subtitle: string;
  grad: string;
  accent: string;
  Icon: LucideIcon;
  posterUrl: string;
};

function Poster({
  data,
  width = 40,
  height = 56,
}: {
  readonly data: PosterData;
  readonly width?: number;
  readonly height?: number;
}) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: 7,
        flexShrink: 0,
        overflow: "hidden",
        position: "relative",
        boxShadow: `0 4px 12px ${data.accent}40`,
      }}
    >
      <Img
        src={data.posterUrl}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
      {/* Subtle bottom gradient for text readability */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(180deg, transparent 55%, rgba(0,0,0,0.5) 100%)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

/* ── Poster data definitions ── */
const OPPENHEIMER: PosterData = {
  title: "Oppenheimer",
  subtitle: "2023 · Christopher Nolan",
  grad: "linear-gradient(160deg, #1a0500 0%, #7c2d12 55%, #ea580c 100%)",
  accent: "#fb923c",
  Icon: Film,
  posterUrl: "/landing/posters/oppenheimer.jpg",
};
const BREAKING_BAD: PosterData = {
  title: "Breaking Bad",
  subtitle: "2008–2013 · AMC",
  grad: "linear-gradient(160deg, #052005 0%, #14532d 50%, #16a34a 100%)",
  accent: "#4ade80",
  Icon: Tv,
  posterUrl: "/landing/posters/breaking-bad.jpg",
};
const DUNE: PosterData = {
  title: "Dune",
  subtitle: "Frank Herbert",
  grad: "linear-gradient(160deg, #1c1000 0%, #6b4c00 50%, #ca8a04 100%)",
  accent: "#fbbf24",
  Icon: BookOpen,
  posterUrl: "/landing/posters/dune.jpg",
};
const INTERSTELLAR: PosterData = {
  title: "Interstellar",
  subtitle: "2014 · Christopher Nolan",
  grad: "linear-gradient(160deg, #000814 0%, #0a1628 50%, #1e40af 100%)",
  accent: "#60a5fa",
  Icon: Film,
  posterUrl: "/landing/posters/interstellar.jpg",
};
const INCEPTION: PosterData = {
  title: "Inception",
  subtitle: "2010 · Christopher Nolan",
  grad: "linear-gradient(160deg, #0f0a1e 0%, #1e1248 50%, #4c1d95 100%)",
  accent: "#a78bfa",
  Icon: Film,
  posterUrl: "/landing/posters/inception.jpg",
};
const TENET: PosterData = {
  title: "Tenet",
  subtitle: "2020 · Christopher Nolan",
  grad: "linear-gradient(160deg, #000a1a 0%, #0a2040 50%, #1e3a78 100%)",
  accent: "#38bdf8",
  Icon: Film,
  posterUrl: "/landing/posters/tenet.jpg",
};
const POOR_THINGS: PosterData = {
  title: "Poor Things",
  subtitle: "2023 · Yorgos Lanthimos",
  grad: "linear-gradient(160deg, #1a0a1a 0%, #6b21a8 55%, #a855f7 100%)",
  accent: "#c084fc",
  Icon: Film,
  posterUrl: "/landing/posters/poor-things.jpg",
};

/* ══════════════════════════════════════════
   Scene 1 — Notes Feed
══════════════════════════════════════════ */
function NotesFeedScene({ frame, fps, C }: SceneProps) {
  const notes = [
    {
      poster: OPPENHEIMER,
      cat: "Film",
      catColor: C.cyan,
      rating: 5,
      excerpt: "Nolan'ın şaheseri. Zaman ve ahlak üzerine derin bir sorgulama...",
    },
    {
      poster: BREAKING_BAD,
      cat: "Dizi",
      catColor: C.gold,
      rating: 5,
      excerpt: "Walter White dönüşümü sinema tarihinin en iyi karakteri...",
    },
    {
      poster: DUNE,
      cat: "Kitap",
      catColor: C.amber,
      rating: 4,
      excerpt: "Herbert'in evreni sonsuz zenginlikte. Arrakis'in kum fırtınaları...",
    },
  ];

  const headerP = sp(frame, fps, 0);
  const statsP = sp(frame, fps, 80);

  return (
    <AbsoluteFill style={{ padding: 26, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div
        style={{
          position: "absolute",
          top: -60,
          left: -60,
          width: 280,
          height: 280,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${C.glowGold}, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      {/* Header */}
      <div
        style={{
          transform: `translateY(${interpolate(headerP, [0, 1], [14, 0])}px)`,
          opacity: headerP,
          marginBottom: 14,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div style={{ marginBottom: 5 }}>
            <DigyNotesLogo />
          </div>
          <h2
            style={{
              color: C.textStrong,
              fontSize: 15,
              fontWeight: 800,
              margin: "0 0 2px",
              lineHeight: 1.2,
            }}
          >
            Son Notlar
          </h2>
          <p
            style={{
              color: C.textMuted,
              fontSize: 10,
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <List size={9} color={C.textMuted} />
            47 not · 12 kategori
          </p>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            background: `${C.gold}18`,
            border: `1px solid ${C.gold}28`,
            borderRadius: 8,
            padding: "5px 10px",
            color: C.gold,
            fontSize: 10,
            fontWeight: 700,
          }}
        >
          <Plus size={10} color={C.gold} />
          Yeni Not
        </div>
      </div>

      {/* Note cards */}
      {notes.map((n, i) => {
        const p = sp(frame, fps, 18 + i * 14, 90, 20);
        return (
          <div
            key={n.poster.title}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 11,
              background: C.surfaceEl,
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              padding: "10px 12px",
              marginBottom: 8,
              transform: `translateX(${interpolate(p, [0, 1], [24, 0])}px)`,
              opacity: p,
            }}
          >
            <Poster data={n.poster} width={38} height={54} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                <p style={{ color: C.textStrong, fontSize: 11, fontWeight: 700, margin: 0 }}>
                  {n.poster.title}
                </p>
                <Chip label={n.cat} color={n.catColor} />
              </div>
              <div style={{ marginBottom: 4 }}>
                <StarRating count={n.rating} color={n.catColor} />
              </div>
              <p style={{ color: C.textMuted, fontSize: 9, margin: 0, lineHeight: 1.55 }}>
                {n.excerpt}
              </p>
            </div>
          </div>
        );
      })}

      {/* Stats strip */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 6,
          marginTop: 4,
          opacity: statsP,
          transform: `translateY(${interpolate(statsP, [0, 1], [10, 0])}px)`,
        }}
      >
        {[
          { label: "Toplam Not", value: "47", color: C.gold, Icon: List },
          { label: "Film & Dizi", value: "29", color: C.cyan, Icon: Film },
          { label: "Bu Ay", value: "8", color: C.blue, Icon: TrendingUp },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: `${s.color}10`,
              border: `1px solid ${s.color}22`,
              borderRadius: 10,
              padding: "8px 10px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
            }}
          >
            <s.Icon size={12} color={s.color} strokeWidth={2} />
            <strong style={{ color: s.color, fontSize: 17, fontWeight: 900, lineHeight: 1 }}>
              {s.value}
            </strong>
            <span style={{ color: C.textMuted, fontSize: 8, fontWeight: 600 }}>{s.label}</span>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
}

/* ══════════════════════════════════════════
   Scene 2 — Note Writing
══════════════════════════════════════════ */
function NoteWritingScene({ frame, fps, C }: SceneProps) {
  const NOTE_TEXT =
    "Christopher Nolan bu filmde zamana farklı bir bakış açısı getiriyor. Interstellar, bilim kurgu sinemasının sınırlarını zorlayan, izleyiciyi hem duygusal hem entelektüel olarak etkileyen...";

  const headerP = sp(frame, fps, 0);
  const movieP = sp(frame, fps, 12, 80, 18);
  const starsP = sp(frame, fps, 28);
  const textP = sp(frame, fps, 45);
  const tagsP = sp(frame, fps, 70);
  const btnP = sp(frame, fps, 100);

  const starsLit = Math.floor(
    interpolate(frame, [28, 65], [0, 5], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );

  const charCount = Math.floor(
    interpolate(frame, [50, 140], [0, NOTE_TEXT.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );

  return (
    <AbsoluteFill style={{ padding: 26, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div
        style={{
          position: "absolute",
          bottom: -50,
          right: -50,
          width: 260,
          height: 260,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${C.glowCyan}, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      {/* Header */}
      <div
        style={{
          opacity: headerP,
          transform: `translateY(${interpolate(headerP, [0, 1], [14, 0])}px)`,
          marginBottom: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
          <ArrowLeft size={11} color={C.textMuted} strokeWidth={2} />
          <span style={{ color: C.textMuted, fontSize: 9 }}>Notlarım</span>
          <span style={{ color: C.border, fontSize: 9 }}>/</span>
          <span style={{ color: C.textSoft, fontSize: 9, fontWeight: 600 }}>Yeni Not</span>
        </div>
        <h2
          style={{ color: C.textStrong, fontSize: 15, fontWeight: 800, margin: 0, lineHeight: 1.2 }}
        >
          Not Yazılıyor
        </h2>
      </div>

      {/* Movie card */}
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          background: C.surfaceEl,
          border: `1px solid ${C.border}`,
          borderRadius: 12,
          padding: "10px 12px",
          marginBottom: 11,
          opacity: movieP,
          transform: `translateY(${interpolate(movieP, [0, 1], [12, 0])}px)`,
        }}
      >
        <Poster data={INTERSTELLAR} width={42} height={58} />
        <div>
          <p style={{ color: C.textStrong, fontSize: 13, fontWeight: 800, margin: "0 0 3px" }}>
            Interstellar
          </p>
          <p
            style={{
              color: C.textMuted,
              fontSize: 10,
              margin: "0 0 6px",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Clock size={9} color={C.textMuted} strokeWidth={2} />
            2014 · Christopher Nolan
          </p>
          <Chip label="Film" color={C.cyan} />
        </div>
      </div>

      {/* Star rating */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 10,
          opacity: starsP,
        }}
      >
        <span style={{ color: C.textMuted, fontSize: 9, fontWeight: 600 }}>Puan:</span>
        <div style={{ display: "flex", gap: 5 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Star
              key={i}
              size={18}
              color={i <= starsLit ? C.amber : `${C.textMuted}44`}
              fill={i <= starsLit ? C.amber : "none"}
              strokeWidth={1.5}
            />
          ))}
        </div>
        {starsLit > 0 && (
          <span style={{ color: C.amber, fontSize: 10, fontWeight: 700 }}>{starsLit}/5</span>
        )}
      </div>

      {/* Text area */}
      <div
        style={{
          background: C.surface,
          border: `1px solid ${C.gold}30`,
          borderRadius: 10,
          padding: "10px 12px",
          marginBottom: 10,
          minHeight: 68,
          opacity: textP,
          transform: `translateY(${interpolate(textP, [0, 1], [8, 0])}px)`,
        }}
      >
        <p style={{ color: C.textStrong, fontSize: 10, lineHeight: 1.68, margin: 0 }}>
          {NOTE_TEXT.slice(0, charCount)}
          {charCount < NOTE_TEXT.length && (
            <span
              style={{
                display: "inline-block",
                width: 1,
                height: 11,
                background: C.gold,
                marginLeft: 1,
                verticalAlign: "text-bottom",
                opacity: frame % 20 < 10 ? 1 : 0,
              }}
            />
          )}
        </p>
      </div>

      {/* Tags */}
      <div
        style={{
          display: "flex",
          gap: 5,
          flexWrap: "wrap",
          opacity: tagsP,
          transform: `translateY(${interpolate(tagsP, [0, 1], [8, 0])}px)`,
        }}
      >
        {["Bilim Kurgu", "Christopher Nolan", "Uzay"].map((tag) => (
          <div
            key={tag}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 20,
              padding: "3px 8px",
              color: C.textSoft,
              fontSize: 9,
              fontWeight: 600,
            }}
          >
            <Tag size={8} color={C.textMuted} strokeWidth={2} />
            {tag}
          </div>
        ))}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            background: `${C.gold}14`,
            border: `1px solid ${C.gold}30`,
            borderRadius: 20,
            padding: "3px 8px",
            color: C.gold,
            fontSize: 9,
            fontWeight: 700,
          }}
        >
          <Plus size={8} color={C.gold} />
          Etiket Ekle
        </div>
      </div>

      {/* Save button */}
      <div
        style={{
          position: "absolute",
          bottom: 20,
          right: 20,
          background: `linear-gradient(135deg, ${C.gold}, ${C.goldLight})`,
          borderRadius: 10,
          padding: "8px 18px",
          color: "white",
          fontSize: 10,
          fontWeight: 700,
          opacity: btnP,
          boxShadow: `0 4px 16px ${C.gold}40`,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <CheckCircle size={11} color="white" strokeWidth={2.5} />
        Kaydet
      </div>
    </AbsoluteFill>
  );
}

/* ══════════════════════════════════════════
   Scene 3 — Search & Filter
══════════════════════════════════════════ */
function SearchScene({ frame, fps, C }: SceneProps) {
  const SEARCH_TEXT = "christopher nolan";
  const searchChars = Math.floor(
    interpolate(frame, [20, 70], [0, SEARCH_TEXT.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );

  const results = [
    { poster: INTERSTELLAR, cat: "Film", catColor: C.cyan, rating: 5, year: "2014" },
    { poster: OPPENHEIMER, cat: "Film", catColor: C.cyan, rating: 5, year: "2023" },
    { poster: TENET, cat: "Film", catColor: C.blue, rating: 4, year: "2020" },
    { poster: INCEPTION, cat: "Film", catColor: C.purple, rating: 5, year: "2010" },
  ];

  const filters = [
    { label: "Tümü", active: false, color: C.textMuted },
    { label: "Film", active: true, color: C.cyan, Icon: Film },
    { label: "Dizi", active: false, color: C.gold, Icon: Tv },
    { label: "Kitap", active: false, color: C.amber, Icon: BookOpen },
  ];

  const headerP = sp(frame, fps, 0);
  const searchBoxP = sp(frame, fps, 8);
  const filtersP = sp(frame, fps, 16);

  return (
    <AbsoluteFill style={{ padding: 26, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div
        style={{
          position: "absolute",
          top: -60,
          right: -60,
          width: 260,
          height: 260,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${C.glowCyan}, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      {/* Header */}
      <div
        style={{
          opacity: headerP,
          transform: `translateY(${interpolate(headerP, [0, 1], [14, 0])}px)`,
          marginBottom: 12,
        }}
      >
        <div style={{ marginBottom: 6 }}>
          <DigyNotesLogo />
        </div>
        <h2
          style={{
            color: C.textStrong,
            fontSize: 15,
            fontWeight: 800,
            margin: "0 0 2px",
            lineHeight: 1.2,
          }}
        >
          Notları Keşfet
        </h2>
        <p style={{ color: C.textMuted, fontSize: 10, margin: 0 }}>47 not arasında arama yap</p>
      </div>

      {/* Search box */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 9,
          background: C.surfaceEl,
          border: `1px solid ${C.gold}35`,
          borderRadius: 12,
          padding: "9px 13px",
          marginBottom: 9,
          opacity: searchBoxP,
          transform: `translateY(${interpolate(searchBoxP, [0, 1], [10, 0])}px)`,
          boxShadow: `0 0 0 3px ${C.gold}10`,
        }}
      >
        <Search size={13} color={C.textMuted} strokeWidth={2} />
        <span style={{ color: C.textStrong, fontSize: 12, flex: 1 }}>
          {SEARCH_TEXT.slice(0, searchChars)}
          {searchChars < SEARCH_TEXT.length && (
            <span
              style={{
                display: "inline-block",
                width: 1,
                height: 13,
                background: C.gold,
                marginLeft: 1,
                verticalAlign: "text-bottom",
                opacity: frame % 18 < 9 ? 1 : 0,
              }}
            />
          )}
        </span>
        <div
          style={{
            background: `${C.cyan}14`,
            border: `1px solid ${C.cyan}28`,
            borderRadius: 6,
            padding: "3px 8px",
            color: C.cyan,
            fontSize: 9,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: 3,
          }}
        >
          <Film size={8} color={C.cyan} />4 sonuç
        </div>
      </div>

      {/* Filter chips */}
      <div
        style={{
          display: "flex",
          gap: 5,
          marginBottom: 10,
          flexWrap: "wrap",
          opacity: filtersP,
          transform: `translateX(${interpolate(filtersP, [0, 1], [-12, 0])}px)`,
        }}
      >
        {filters.map((f) => {
          const FIcon = f.Icon;
          return (
            <div
              key={f.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                background: f.active ? `${f.color}20` : C.surface,
                border: `1px solid ${f.active ? f.color + "40" : C.border}`,
                borderRadius: 20,
                padding: "4px 10px",
                color: f.active ? f.color : C.textMuted,
                fontSize: 9,
                fontWeight: f.active ? 700 : 500,
              }}
            >
              {FIcon && <FIcon size={9} color={f.active ? f.color : C.textMuted} strokeWidth={2} />}
              {f.label}
            </div>
          );
        })}
      </div>

      {/* Results */}
      {results.map((r, i) => {
        const p = sp(frame, fps, 78 + i * 10, 90, 20);
        return (
          <div
            key={r.poster.title}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: C.surfaceEl,
              border: `1px solid ${C.border}`,
              borderRadius: 10,
              padding: "8px 12px",
              marginBottom: 6,
              opacity: p,
              transform: `translateX(${interpolate(p, [0, 1], [18, 0])}px)`,
            }}
          >
            <Poster data={r.poster} width={30} height={42} />
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                <span style={{ color: C.textStrong, fontSize: 11, fontWeight: 700 }}>
                  {r.poster.title}
                </span>
                <Chip label={r.cat} color={r.catColor} />
              </div>
              <StarRating count={r.rating} color={r.catColor} />
            </div>
            <span style={{ color: C.textMuted, fontSize: 9 }}>{r.year}</span>
          </div>
        );
      })}
    </AbsoluteFill>
  );
}

/* ══════════════════════════════════════════
   Scene 4 — Statistics
══════════════════════════════════════════ */
function StatsScene({ frame, fps, C }: SceneProps) {
  const months = [
    { m: "Eki", v: 3 },
    { m: "Kas", v: 5 },
    { m: "Ara", v: 4 },
    { m: "Oca", v: 7 },
    { m: "Şub", v: 6 },
    { m: "Mar", v: 8 },
  ];
  const maxV = 8;

  const cats = [
    { label: "Film", count: 29, color: C.cyan, pct: 62, Icon: Film },
    { label: "Kitap", count: 11, color: C.amber, pct: 23, Icon: BookOpen },
    { label: "Dizi", count: 5, color: C.gold, pct: 11, Icon: Tv },
    { label: "Oyun", count: 2, color: C.blue, pct: 4, Icon: Bookmark },
  ];

  const headerP = sp(frame, fps, 0);
  const streakP = sp(frame, fps, 10);
  const chartLabelP = sp(frame, fps, 18);
  const catLabelP = sp(frame, fps, 90);

  return (
    <AbsoluteFill style={{ padding: 26, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div
        style={{
          position: "absolute",
          bottom: -60,
          left: -60,
          width: 280,
          height: 280,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${C.glowGold}, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      {/* Header */}
      <div
        style={{
          opacity: headerP,
          transform: `translateY(${interpolate(headerP, [0, 1], [14, 0])}px)`,
          marginBottom: 12,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
            <BarChart3 size={11} color={C.gold} strokeWidth={2} />
            <span
              style={{
                color: C.gold,
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: 1.5,
                textTransform: "uppercase",
              }}
            >
              İstatistikler
            </span>
          </div>
          <h2
            style={{
              color: C.textStrong,
              fontSize: 15,
              fontWeight: 800,
              margin: "0 0 2px",
              lineHeight: 1.2,
            }}
          >
            Okuma Alışkanlıkları
          </h2>
          <p style={{ color: C.textMuted, fontSize: 10, margin: 0 }}>Son 6 ay · 33 not</p>
        </div>

        {/* Streak badge */}
        <div
          style={{
            background: `${C.amber}14`,
            border: `1px solid ${C.amber}30`,
            borderRadius: 12,
            padding: "8px 12px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 3,
            opacity: streakP,
            transform: `translateX(${interpolate(streakP, [0, 1], [14, 0])}px)`,
          }}
        >
          <Flame size={16} color={C.amber} strokeWidth={2} fill={`${C.amber}40`} />
          <strong style={{ color: C.amber, fontSize: 16, fontWeight: 900, lineHeight: 1 }}>
            12
          </strong>
          <span style={{ color: C.textMuted, fontSize: 8 }}>gün seri</span>
        </div>
      </div>

      {/* Chart label */}
      <p
        style={{
          color: C.textMuted,
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: 1.2,
          textTransform: "uppercase",
          margin: "0 0 8px",
          opacity: chartLabelP,
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        <BarChart3 size={9} color={C.textMuted} />
        Aylık Not Sayısı
      </p>

      {/* Bar chart */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 6,
          height: 70,
          marginBottom: 14,
        }}
      >
        {months.map((m, i) => {
          const barH = interpolate(frame, [25 + i * 8, 75 + i * 8], [0, (m.v / maxV) * 70], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const isLast = i === months.length - 1;
          return (
            <div
              key={m.m}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-end",
                  height: 70,
                  width: "100%",
                }}
              >
                <div
                  style={{
                    height: barH,
                    background: isLast
                      ? `linear-gradient(180deg, ${C.goldLight}, ${C.gold})`
                      : `${C.gold}35`,
                    borderRadius: "4px 4px 0 0",
                    minWidth: 16,
                    boxShadow: isLast ? `0 -2px 8px ${C.gold}40` : "none",
                  }}
                />
              </div>
              <span
                style={{
                  color: isLast ? C.gold : C.textMuted,
                  fontSize: 8,
                  fontWeight: isLast ? 700 : 400,
                }}
              >
                {m.m}
              </span>
            </div>
          );
        })}
      </div>

      {/* Category breakdown label */}
      <p
        style={{
          color: C.textMuted,
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: 1.2,
          textTransform: "uppercase",
          margin: "0 0 9px",
          opacity: catLabelP,
        }}
      >
        Kategori Dağılımı
      </p>

      {cats.map((cat, i) => {
        const p = sp(frame, fps, 95 + i * 10);
        const barW = interpolate(frame, [110 + i * 10, 150 + i * 10], [0, cat.pct], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const CatIcon = cat.Icon;
        return (
          <div
            key={cat.label}
            style={{
              marginBottom: 8,
              opacity: p,
              transform: `translateX(${interpolate(p, [0, 1], [-14, 0])}px)`,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <CatIcon size={9} color={cat.color} strokeWidth={2} />
                <span style={{ color: C.textSoft, fontSize: 10 }}>{cat.label}</span>
              </div>
              <span style={{ color: cat.color, fontSize: 10, fontWeight: 700 }}>{cat.count}</span>
            </div>
            <div
              style={{
                height: 4,
                background: `${cat.color}18`,
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${barW}%`,
                  height: "100%",
                  background: cat.color,
                  borderRadius: 2,
                }}
              />
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
      Icon: Film,
      posters: [POOR_THINGS, TENET, INCEPTION],
    },
    {
      name: "Kitaplığım",
      count: 8,
      desc: "Okuduğum kitaplar",
      color: C.amber,
      Icon: BookOpen,
      posters: [DUNE],
    },
    {
      name: "Favori Filmler",
      count: 17,
      desc: "Tüm zamanların en iyileri",
      color: C.gold,
      Icon: Star,
      posters: [INTERSTELLAR, OPPENHEIMER, INCEPTION],
    },
  ];

  const headerP = sp(frame, fps, 0);
  const totalP = sp(frame, fps, 112);

  return (
    <AbsoluteFill style={{ padding: 26, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div
        style={{
          position: "absolute",
          top: -60,
          right: -60,
          width: 280,
          height: 280,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${C.glowGold}, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      {/* Header */}
      <div
        style={{
          opacity: headerP,
          transform: `translateY(${interpolate(headerP, [0, 1], [14, 0])}px)`,
          marginBottom: 14,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ marginBottom: 5 }}>
            <DigyNotesLogo />
          </div>
          <h2
            style={{
              color: C.textStrong,
              fontSize: 15,
              fontWeight: 800,
              margin: "0 0 2px",
              lineHeight: 1.2,
            }}
          >
            Koleksiyonlarım
          </h2>
          <p style={{ color: C.textMuted, fontSize: 10, margin: 0 }}>3 liste · 37 içerik</p>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            background: `${C.gold}18`,
            border: `1px solid ${C.gold}28`,
            borderRadius: 8,
            padding: "5px 10px",
            color: C.gold,
            fontSize: 10,
            fontWeight: 700,
          }}
        >
          <Plus size={10} color={C.gold} />
          Yeni Liste
        </div>
      </div>

      {collections.map((col, i) => {
        const p = sp(frame, fps, 18 + i * 22, 80, 18);
        const ColIcon = col.Icon;
        return (
          <div
            key={col.name}
            style={{
              background: C.surfaceEl,
              border: `1px solid ${col.color}22`,
              borderRadius: 14,
              padding: "12px 13px",
              marginBottom: 9,
              opacity: p,
              transform: `translateX(${interpolate(p, [0, 1], [i % 2 === 0 ? -22 : 22, 0])}px)`,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 9,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    flexShrink: 0,
                    background: `${col.color}18`,
                    border: `1px solid ${col.color}28`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ColIcon size={16} color={col.color} strokeWidth={1.75} />
                </div>
                <div>
                  <p
                    style={{
                      color: C.textStrong,
                      fontSize: 12,
                      fontWeight: 700,
                      margin: "0 0 2px",
                    }}
                  >
                    {col.name}
                  </p>
                  <p style={{ color: C.textMuted, fontSize: 9, margin: 0 }}>{col.desc}</p>
                </div>
              </div>
              <div
                style={{
                  background: `${col.color}18`,
                  color: col.color,
                  fontSize: 13,
                  fontWeight: 900,
                  padding: "4px 10px",
                  borderRadius: 8,
                  border: `1px solid ${col.color}28`,
                }}
              >
                {col.count}
              </div>
            </div>

            {/* Poster preview row */}
            <div style={{ display: "flex", gap: 5, alignItems: "flex-end" }}>
              {col.posters.map((poster) => (
                <Poster key={poster.title} data={poster} width={28} height={40} />
              ))}
              {col.count > col.posters.length && (
                <div
                  style={{
                    width: 28,
                    height: 40,
                    borderRadius: 7,
                    background: `${col.color}12`,
                    border: `1px solid ${col.color}22`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: col.color,
                    fontSize: 10,
                    fontWeight: 800,
                  }}
                >
                  +{col.count - col.posters.length}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Total badge */}
      <div
        style={{
          position: "absolute",
          bottom: 22,
          left: 26,
          right: 26,
          background: `${C.gold}10`,
          border: `1px solid ${C.gold}20`,
          borderRadius: 10,
          padding: "8px 14px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          opacity: totalP,
          transform: `translateY(${interpolate(totalP, [0, 1], [10, 0])}px)`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <List size={11} color={C.textSoft} strokeWidth={2} />
          <span style={{ color: C.textSoft, fontSize: 10 }}>Toplam takip edilen içerik</span>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
          <strong style={{ color: C.gold, fontSize: 20, fontWeight: 900, lineHeight: 1 }}>
            37
          </strong>
          <span style={{ color: C.textMuted, fontSize: 9 }}>içerik</span>
        </div>
      </div>
    </AbsoluteFill>
  );
}

/* ══════════════════════════════════════════
   Main Composition — 840 frames @ 30fps = 28s
══════════════════════════════════════════ */
export type DigyNotesIntroProps = { readonly theme?: "dark" | "light" };

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
