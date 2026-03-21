"use client";

import { EASE } from "@/lib/variants";

import Image from "next/image";
import { useRef, useState } from "react";
import { AnimatePresence, motion, useInView } from "framer-motion";
import { useTheme } from "@/components/ThemeProvider";
import {
  BookOpenIcon,
  CalendarIcon,
  FilmSlateIcon,
  GameControllerIcon,
  MapPinIcon,
  PencilLineIcon,
  StarIcon,
  TelevisionIcon,
  UserIcon,
} from "@phosphor-icons/react";

const CATEGORIES = [
  {
    key: "film",
    label: "Film",
    Icon: FilmSlateIcon,
    color: "#6888c0",
    colorLight: "#9db9eb",
    bg: "rgba(56,88,168,0.10)",
    border: "rgba(56,88,168,0.25)",
    coverGradient: "linear-gradient(138deg, #07111a 0%, #102641 36%, #132845 62%, #08121b 100%)",
    artworkSrc: "/landing/category-showcase/film.svg",
    mockTitle: "Interstellar",
    mockCreator: "Christopher Nolan",
    mockYear: "2014",
    mockRating: 5,
    mockExcerpt:
      "Zaman, yerçekimi ve sevgi üzerine bir başyapıt. Cooper'ın kızına verdiği söz, insanlığın geleceğini değiştiriyor. Hans Zimmer'in müzikleri eşliğinde seyrettiğim en etkileyici uzay filmi.",
    mockHighlight: '"Sevgi, zaman ve uzayı aşan tek şeydir." — Bu replik filmin tüm özeti.',
    mockTags: ["bilim-kurgu", "uzay", "zaman", "drama"],
    mockStatus: "İzledim",
  },
  {
    key: "dizi",
    label: "Dizi",
    Icon: TelevisionIcon,
    color: "#c8b090",
    colorLight: "#e0c8a8",
    bg: "rgba(200,176,144,0.10)",
    border: "rgba(200,176,144,0.25)",
    coverGradient: "linear-gradient(138deg, #120d09 0%, #2b1d12 38%, #3a2818 62%, #130d08 100%)",
    artworkSrc: "/landing/category-showcase/series.svg",
    mockTitle: "Breaking Bad",
    mockCreator: "Vince Gilligan",
    mockYear: "2008–2013",
    mockRating: 5,
    mockExcerpt:
      "Walter White'ın bir kimya öğretmeninden uyuşturucu imparatoruna dönüşümü. Televizyon tarihinin en iyi karakter gelişimi denilebilir. Özellikle son sezon nefes kesiyor.",
    mockHighlight:
      "Ozymandias bölümü tek başına tüm diziyi izlemeye değer. 10/10 finallerden biri.",
    mockTags: ["drama", "gerilim", "suç", "karakter"],
    mockStatus: "Tamamlandı",
  },
  {
    key: "oyun",
    label: "Oyun",
    Icon: GameControllerIcon,
    color: "#0ea5e9",
    colorLight: "#7dd3fc",
    bg: "rgba(14,165,233,0.10)",
    border: "rgba(14,165,233,0.25)",
    coverGradient: "linear-gradient(138deg, #0b0d1d 0%, #1b2154 40%, #1a2258 62%, #090b16 100%)",
    artworkSrc: "/landing/category-showcase/game.svg",
    mockTitle: "The Last of Us Part II",
    mockCreator: "Naughty Dog",
    mockYear: "2020",
    mockRating: 4.5,
    mockExcerpt:
      "İntikam ve af arasında gidip gelen, duygusal olarak tüketen bir deneyim. Gameplay ve hikâye entegrasyonu muhteşem. Tartışmalı ama cesur bir anlatı tercihiyle unutulmaz.",
    mockHighlight: "Oyunun ortasındaki bakış açısı değişikliği beni tamamen hazırlıksız yakaladı.",
    mockTags: ["aksiyon", "hikaye", "duygusal"],
    mockStatus: "Oynadım",
  },
  {
    key: "kitap",
    label: "Kitap",
    Icon: BookOpenIcon,
    color: "#10b981",
    colorLight: "#6ee7b7",
    bg: "rgba(16,185,129,0.10)",
    border: "rgba(16,185,129,0.25)",
    coverGradient: "linear-gradient(138deg, #171005 0%, #2f2008 38%, #412c0d 64%, #120b04 100%)",
    artworkSrc: "/landing/category-showcase/book.svg",
    mockTitle: "Suç ve Ceza",
    mockCreator: "Fyodor Dostoyevski",
    mockYear: "1866",
    mockRating: 5,
    mockExcerpt:
      "Raskolnikov'un vicdanıyla yüzleşmesi, yüzyıllar sonra bile güncelliğini koruyor. Bir insanın kendini ahlaki olarak üstün görmesinin sonuçlarını bu kadar derin işleyen başka bir kitap yok.",
    mockHighlight:
      "Sonya ile itiraf sahnesi kitabın dönüm noktası. Her şey o andan sonra değişiyor.",
    mockTags: ["klasik", "psikolojik", "felsefe", "rus-edebiyatı"],
    mockStatus: "Okudum",
  },
  {
    key: "gezi",
    label: "Gezi",
    Icon: MapPinIcon,
    color: "#60a88a",
    colorLight: "#9fdfc2",
    bg: "rgba(80,160,120,0.10)",
    border: "rgba(80,160,120,0.25)",
    coverGradient: "linear-gradient(138deg, #08150f 0%, #153725 38%, #1b4830 64%, #07110d 100%)",
    artworkSrc: "/landing/category-showcase/travel.svg",
    mockTitle: "Kyoto, Japonya",
    mockCreator: "",
    mockYear: "2024",
    mockRating: 5,
    mockExcerpt:
      "Bamboo Grove'da yürürken zamanın durduğu o an. Fushimi Inari'nin binlerce torii kapısı altında tırmanış. Kinkaku-ji'nin altın yansıması ve göl üzerindeki sessizlik — gerçeküstü.",
    mockHighlight:
      "Arashiyama'daki bambu ormanında sabah 6'da yalnız yürümek, hayatımın en huzurlu anı.",
    mockTags: ["asya", "tapınak", "doğa", "kültür"],
    mockStatus: "Gezdim",
  },
  {
    key: "diger",
    label: "Diğer",
    Icon: PencilLineIcon,
    color: "#a0a0a0",
    colorLight: "#d2d2d2",
    bg: "rgba(160,160,160,0.08)",
    border: "rgba(160,160,160,0.20)",
    coverGradient: "linear-gradient(138deg, #111111 0%, #202020 38%, #2b2b2b 64%, #0b0b0b 100%)",
    artworkSrc: "/landing/category-showcase/other.svg",
    mockTitle: "Espresso Tarifleri",
    mockCreator: "",
    mockYear: "2025",
    mockRating: 4,
    mockExcerpt:
      "V60 pour-over, Aeropress, Chemex — her yöntemin kendi ritüeli var. Su sıcaklığı, öğütme boyutu ve demleme süresi üçlüsü mükemmel fincanın anahtarı. Kahve notlarım büyüyor.",
    mockHighlight: "93°C su + orta-ince öğütme + 3:30 demleme = şu ana kadarki en iyi V60.",
    mockTags: ["kahve", "tarif", "hobi", "deney"],
    mockStatus: "Devam Ediyor",
  },
] as const;

type Category = (typeof CATEGORIES)[number];

function Stars({
  count,
  color,
  isLight,
}: {
  readonly count: number;
  readonly color: string;
  readonly isLight: boolean;
}) {
  const emptyStroke = isLight ? "#d1d5db" : "#2a2a2a";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((step) => (
        <StarIcon
          key={step}
          size={14}
          weight={step <= count ? "fill" : "regular"}
          color={step <= count ? color : emptyStroke}
          style={{ opacity: step <= count ? 1 : 0.3 }}
        />
      ))}
    </div>
  );
}

function getCoverTitleLines(title: string) {
  const words = title.split(/\s+/).filter(Boolean);

  if (words.length <= 2) {
    return [title];
  }

  if (words.length === 3) {
    return [words.slice(0, 2).join(" "), words[2]];
  }

  const midpoint = Math.ceil(words.length / 2);
  return [words.slice(0, midpoint).join(" "), words.slice(midpoint).join(" ")];
}

function CoverArtwork({ cat }: { readonly cat: Category }) {
  return (
    <div className="pointer-events-none absolute bottom-2 right-2 top-16 w-[34%] min-w-[112px] max-w-[220px] sm:bottom-4 sm:right-4 sm:top-8 sm:w-[40%] sm:min-w-[220px] sm:max-w-[340px]">
      <div
        className="absolute inset-0 rounded-[2rem] border backdrop-blur-[3px]"
        style={{
          borderColor: `${cat.color}2d`,
          background: "linear-gradient(135deg, rgba(6,8,12,0.12), rgba(255,255,255,0.02))",
          boxShadow: `0 24px 80px ${cat.color}18`,
        }}
      />
      <div className="absolute inset-0">
        <Image
          src={cat.artworkSrc}
          alt=""
          fill
          unoptimized
          className="object-contain object-right-bottom"
          aria-hidden="true"
        />
      </div>
      <div
        className="absolute inset-0 rounded-[2rem]"
        style={{
          background:
            "linear-gradient(90deg, rgba(6,8,12,0.04), rgba(6,8,12,0.02) 40%, rgba(6,8,12,0.22) 100%)",
        }}
      />
    </div>
  );
}

function CoverBackground({ cat }: { readonly cat: Category }) {
  const titleLines = getCoverTitleLines(cat.mockTitle);
  const coverTags = cat.key === "oyun" ? cat.mockTags.slice(0, 2) : cat.mockTags.slice(0, 3);

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: cat.coverGradient }}>
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(circle at 14% 24%, ${cat.bg} 0%, transparent 32%),
            radial-gradient(circle at 84% 24%, ${cat.color}24 0%, transparent 28%),
            linear-gradient(90deg, rgba(5,8,12,0.22) 0%, rgba(5,8,12,0.08) 46%, rgba(5,8,12,0.22) 100%)
          `,
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />
      <div
        className="absolute inset-y-0 left-0 w-[76%] sm:w-[72%]"
        style={{
          background:
            "linear-gradient(90deg, rgba(7,9,14,0.52) 0%, rgba(7,9,14,0.24) 52%, transparent 100%)",
        }}
      />
      <div
        className="absolute -left-12 top-8 h-36 w-36 rounded-full blur-[72px] sm:h-56 sm:w-56"
        style={{ background: cat.color, opacity: 0.12 }}
      />
      <div
        className="absolute bottom-[-20%] right-[12%] h-32 w-32 rounded-full blur-[72px] sm:h-48 sm:w-48"
        style={{ background: cat.colorLight, opacity: 0.14 }}
      />

      <CoverArtwork cat={cat} />

      <div className="absolute inset-0 flex flex-col justify-end px-4 pb-4 pt-20 sm:px-6 sm:pb-5 sm:pt-16">
        <div className="max-w-[62%] sm:max-w-[52%]">
          <div className="space-y-1">
            {titleLines.map((line) => (
              <div
                key={line}
                className="text-[1.5rem] font-black leading-[0.94] tracking-[-0.045em] text-white sm:text-[3.2rem]"
              >
                {line}
              </div>
            ))}
          </div>
          <div className="mt-4 flex max-w-full flex-wrap gap-2">
            {coverTags.map((tag) => (
              <span
                key={tag}
                className="text-white/84 max-w-full rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] sm:px-3 sm:py-1.5 sm:text-[10px]"
                style={{
                  borderColor: `${cat.color}2e`,
                  background: "rgba(7, 10, 15, 0.28)",
                  boxShadow: `0 0 0 1px ${cat.color}12 inset`,
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,transparent,rgba(6,8,12,0.44),rgba(6,8,12,0.78))]" />
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${cat.color}60, transparent)` }}
      />
    </div>
  );
}

function MockNoteCard({ cat }: { readonly cat: Category }) {
  const { theme } = useTheme();
  const isLight = theme === "light";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.96, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -16, scale: 0.97, filter: "blur(6px)" }}
      transition={{ duration: 0.45, ease: EASE }}
      className="dn-category-showcase-card overflow-hidden rounded-[1.6rem] border"
      style={{
        borderColor: isLight ? "rgba(226,232,240,0.7)" : cat.border,
        background: isLight
          ? "linear-gradient(135deg, rgba(255,252,247,0.98), rgba(248,243,233,0.98))"
          : "linear-gradient(135deg, color-mix(in srgb, var(--bg-card) 92%, transparent), color-mix(in srgb, var(--surface-strong) 94%, transparent))",
        boxShadow: isLight
          ? "0 20px 60px rgba(15,23,42,0.07), 0 8px 24px rgba(15,23,42,0.04)"
          : "0 30px 80px rgba(0,0,0,0.22)",
      }}
    >
      <div className="relative h-44 w-full overflow-hidden sm:h-56">
        <CoverBackground cat={cat} />

        <div
          className="absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-full px-3 py-1.5 backdrop-blur-md sm:left-4 sm:top-4"
          style={{
            background: isLight ? "rgba(255,255,255,0.82)" : "rgba(8,10,14,0.56)",
            border: isLight ? `1px solid rgba(226,232,240,0.6)` : `1px solid ${cat.border}`,
          }}
        >
          <cat.Icon size={12} style={{ color: cat.color }} />
          <span
            className="text-[11px] font-bold uppercase tracking-[0.22em]"
            style={{ color: isLight ? cat.color : cat.colorLight }}
          >
            {cat.label}
          </span>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h4 className="text-base font-bold text-[var(--text-primary)] sm:text-lg">
              {cat.mockTitle}
            </h4>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[13px] text-[var(--text-secondary)]">
              {cat.mockCreator && (
                <span className="flex items-center gap-1">
                  <UserIcon size={10} style={{ color: cat.color, opacity: 0.6 }} />
                  {cat.mockCreator}
                </span>
              )}
              <span className="flex items-center gap-1">
                <CalendarIcon size={10} style={{ color: cat.color, opacity: 0.6 }} />
                {cat.mockYear}
              </span>
            </div>
          </div>
          <Stars count={cat.mockRating} color={cat.color} isLight={isLight} />
        </div>

        <p className="mb-3 text-[14px] leading-[1.7] text-[var(--text-secondary)]">
          {cat.mockExcerpt}
        </p>

        <div
          className="mb-4 rounded-xl border-l-2 py-2 pl-3 pr-2"
          style={{
            borderColor: `${cat.color}50`,
            background: isLight
              ? `linear-gradient(135deg, ${cat.color}08, rgba(248,250,252,0.5))`
              : `linear-gradient(135deg, ${cat.bg}, rgba(255,255,255,0.02))`,
          }}
        >
          <p className="text-[13px] italic leading-[1.65] text-[var(--text-secondary)]">
            {cat.mockHighlight}
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {cat.mockTags.map((tag) => (
            <span
              key={tag}
              className="rounded-full px-2.5 py-1 text-[11px] font-medium"
              style={{
                background: isLight
                  ? "rgba(241,245,249,0.8)"
                  : "color-mix(in srgb, var(--bg-card) 68%, transparent)",
                color: "var(--text-muted)",
                border: isLight ? "1px solid rgba(226,232,240,0.8)" : "1px solid var(--border)",
              }}
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function getTabStyles(cat: Category, isActive: boolean, isLight: boolean) {
  if (!isActive) {
    return {
      tabBg: "transparent",
      tabBorder: "1px solid transparent",
      tabShadow: "none",
      iconBg: isLight ? "rgba(241,245,249,0.8)" : "rgba(42,42,42,0.3)",
      labelColor: "var(--text-secondary)",
    };
  }

  return isLight
    ? {
        tabBg: "rgba(255,255,255,0.95)",
        tabBorder: "1px solid rgba(226,232,240,0.9)",
        tabShadow: "0 4px 16px rgba(15,23,42,0.06), 0 1px 4px rgba(15,23,42,0.04)",
        iconBg: `${cat.color}14`,
        labelColor: cat.color,
      }
    : {
        tabBg: `linear-gradient(135deg, ${cat.bg}, rgba(255,255,255,0.02))`,
        tabBorder: `1px solid ${cat.border}`,
        tabShadow: "none",
        iconBg: cat.bg,
        labelColor: cat.colorLight,
      };
}

function CategoryTab({
  cat,
  isActive,
  isLight,
  onClick,
}: {
  readonly cat: Category;
  readonly isActive: boolean;
  readonly isLight: boolean;
  readonly onClick: () => void;
}) {
  const { tabBg, tabBorder, tabShadow, iconBg, labelColor } = getTabStyles(cat, isActive, isLight);

  return (
    <motion.button
      onClick={onClick}
      data-active={isActive ? "true" : "false"}
      className="dn-category-tab group relative flex flex-shrink-0 items-center gap-2.5 rounded-2xl px-3.5 py-2.5 text-left transition-colors duration-200 sm:w-44 sm:px-4 sm:py-3"
      style={{ background: tabBg, border: tabBorder, boxShadow: tabShadow }}
      whileHover={{ scale: 1.03, x: 2 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.15 }}
    >
      <div
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl transition-all duration-200"
        style={{
          background: iconBg,
          boxShadow: isActive ? `0 0 16px ${cat.color}22` : "none",
        }}
      >
        <cat.Icon size={16} style={{ color: isActive ? cat.color : "var(--text-muted)" }} />
      </div>
      <span
        className="text-[14px] font-semibold transition-colors duration-200 sm:text-sm"
        style={{ color: labelColor }}
      >
        {cat.label}
      </span>
      {isActive && (
        <motion.div
          className="absolute -left-px top-1/2 hidden h-5 w-[3px] -translate-y-1/2 rounded-r-full sm:block"
          style={{ background: cat.color }}
          layoutId="showcase-indicator"
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
    </motion.button>
  );
}

export function CategoryShowcase() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });
  const [activeIdx, setActiveIdx] = useState(0);
  const activeCat = CATEGORIES[activeIdx];
  const { theme } = useTheme();
  const isLight = theme === "light";

  return (
    <section
      ref={sectionRef}
      className="relative mx-auto w-full max-w-4xl px-3 pb-16 pt-6 sm:px-6 sm:pb-24 sm:pt-12"
    >
      <motion.div
        className="absolute left-1/2 top-0 h-px w-0 -translate-x-1/2"
        animate={isInView ? { width: "66%" } : {}}
        transition={{ duration: 1, ease: EASE }}
        style={{
          background: "linear-gradient(90deg, transparent, rgba(16,185,129,0.2), transparent)",
        }}
      />

      <motion.div
        className="mb-8 text-center sm:mb-12"
        initial={{ opacity: 0, y: 28, filter: "blur(10px)" }}
        animate={isInView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
        transition={{ duration: 0.8, ease: EASE }}
      >
        <div className="mb-4 flex items-center justify-center sm:mb-5">
          <motion.div
            className="chip"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <StarIcon size={12} />
            Her Kategori
          </motion.div>
        </div>

        <motion.h2
          className="mb-3 text-[1.35rem] font-black text-[var(--text-primary)] sm:mb-4 sm:text-4xl xl:text-5xl"
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          Bir not,{" "}
          <span
            className="dn-shimmer-text"
            style={{
              background: "linear-gradient(90deg, #a7f3d0, #10b981, #059669, #34d399, #a7f3d0)",
              backgroundSize: "200% 100%",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            altı ayrı hava
          </span>
        </motion.h2>

        <motion.p
          className="mx-auto max-w-md text-[14px] font-medium text-[var(--text-secondary)] sm:text-base"
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Filmden kitaba, geziden oyuna; her kategori notunu kendi tarzına uygun bir kapakla öne
          çıkarır.
        </motion.p>
      </motion.div>

      <motion.div
        className="flex flex-col gap-6 sm:flex-row sm:gap-8"
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7, delay: 0.25 }}
      >
        <div
          className="scrollbar-hide -mx-3 flex gap-1.5 overflow-x-auto px-3 pb-2 sm:mx-0 sm:flex-col sm:gap-2 sm:overflow-visible sm:px-0 sm:pb-0"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {CATEGORIES.map((cat, index) => (
            <CategoryTab
              key={cat.key}
              cat={cat}
              isActive={index === activeIdx}
              isLight={isLight}
              onClick={() => setActiveIdx(index)}
            />
          ))}
        </div>

        <div className="flex-1">
          <AnimatePresence mode="wait">
            <MockNoteCard key={activeCat.key} cat={activeCat} />
          </AnimatePresence>
        </div>
      </motion.div>
    </section>
  );
}
