"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Image from "next/image";
import "react-quill/dist/quill.snow.css";
import StarRating from "@/components/StarRating";
import { getStatusOptions } from "@/components/StatusBadge";
import { MediaSearch } from "@/components/MediaSearch";
import PlaceSearch, { type PlaceResult } from "@/components/PlaceSearch";
import TagInput from "@/components/TagInput";
import toast from "react-hot-toast";
import { FIXED_CATEGORIES } from "@/lib/categories";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });
const customLoader = ({ src }: { src: string }) => src;

/* ── Kategori bazlı alan konfigürasyonu ── */
const CATEGORY_CONFIG: Record<
  string,
  {
    showCreator: boolean;
    creatorLabel: string;
    yearsLabel: string;
    yearsPlaceholder: string;
    yearsRequired: boolean;
    creatorRequired: boolean;
  }
> = {
  Film: {
    showCreator: true,
    creatorLabel: "Yönetmen",
    yearsLabel: "Yıl",
    yearsPlaceholder: "2024",
    yearsRequired: true,
    creatorRequired: true,
  },
  Dizi: {
    showCreator: true,
    creatorLabel: "Yönetmen / Yapımcı",
    yearsLabel: "Yayın Yılları",
    yearsPlaceholder: "2020–2023",
    yearsRequired: true,
    creatorRequired: true,
  },
  Oyun: {
    showCreator: true,
    creatorLabel: "Geliştirici",
    yearsLabel: "Yıl",
    yearsPlaceholder: "2024",
    yearsRequired: true,
    creatorRequired: true,
  },
  Kitap: {
    showCreator: true,
    creatorLabel: "Yazar",
    yearsLabel: "Yıl",
    yearsPlaceholder: "2024",
    yearsRequired: true,
    creatorRequired: true,
  },
  Gezi: {
    showCreator: false,
    creatorLabel: "",
    yearsLabel: "Ziyaret Tarihi",
    yearsPlaceholder: "2024",
    yearsRequired: false,
    creatorRequired: false,
  },
  Diğer: {
    showCreator: true,
    creatorLabel: "Kaynak / Kişi",
    yearsLabel: "Yıl",
    yearsPlaceholder: "2024",
    yearsRequired: false,
    creatorRequired: false,
  },
};

const inputBase =
  "w-full px-3.5 py-2.5 rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] bg-[var(--bg-raised)] border border-[var(--border)] focus:outline-none focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c]/20 transition-all text-sm";
const labelClass =
  "block text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)] mb-1.5";

function flashClass(flashed: boolean) {
  return flashed ? "ring-2 ring-[#c9a84c]/60 border-[#c9a84c]" : "";
}

function detectImagePosition(url: string, cb: (pos: string) => void) {
  const img = new window.Image();
  img.onload = () => {
    const ratio = img.naturalWidth / img.naturalHeight;
    cb(ratio > 1.35 ? "center 25%" : "center");
  };
  img.onerror = () => cb("center");
  img.src = url;
}

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, "").trim();
}

export default function NewPostPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>(FIXED_CATEGORIES[0]);
  const [rating, setRating] = useState(0);
  const [image, setImage] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [creator, setCreator] = useState("");
  const [years, setYears] = useState("");
  const [status, setStatus] = useState(getStatusOptions(FIXED_CATEGORIES[0])[0]);
  const [tags, setTags] = useState<string[]>([]);
  const [externalRating, setExternalRating] = useState<number | null>(null);
  const [imagePosition, setImagePosition] = useState("center");
  const [isLandscape, setIsLandscape] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(true);
  const [flashFields, setFlashFields] = useState<Set<string>>(new Set());
  const [autofillDone, setAutofillDone] = useState(false);
  const [popularTags, setPopularTags] = useState<string[]>([]);
  const [popularTagsLoading, setPopularTagsLoading] = useState(true);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const imgTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!image) {
      setIsLandscape(false);
      return;
    }
    if (imgTimerRef.current) clearTimeout(imgTimerRef.current);
    imgTimerRef.current = setTimeout(() => {
      detectImagePosition(image, (pos) => {
        setImagePosition(pos);
        setIsLandscape(pos !== "center");
      });
    }, 600);
    return () => {
      if (imgTimerRef.current) clearTimeout(imgTimerRef.current);
    };
  }, [image]);

  /* Kategori değişince popüler tagleri getir, yoksa global fallback */
  const fetchPopularTags = useCallback(async (cat: string) => {
    setPopularTagsLoading(true);
    try {
      const res = await fetch(`/api/tags?category=${encodeURIComponent(cat)}&limit=8`);
      if (!res.ok) return;
      const data: { id: string; name: string; count: number }[] = await res.json();
      if (data.length > 0) {
        setPopularTags(data.map((t) => t.name));
        return;
      }
      // Kategori bazlı tag yoksa global en popülerleri getir
      const fallback = await fetch(`/api/tags?limit=8`);
      if (!fallback.ok) return;
      const globalData: { id: string; name: string; count: number }[] = await fallback.json();
      setPopularTags(globalData.map((t) => t.name));
    } catch {
      setPopularTags([]);
    } finally {
      setPopularTagsLoading(false);
    }
  }, []);

  /* İlk yüklemede de popüler tagleri getir */
  useEffect(() => {
    fetchPopularTags(FIXED_CATEGORIES[0]);
  }, [fetchPopularTags]);

  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
    setStatus(getStatusOptions(cat)[0]);
    // Gezi seçilince creator alanını temizle (gösterilmeyecek)
    if (cat === "Gezi") setCreator("");
    fetchPopularTags(cat);
  };

  const handleMediaSelect = (result: {
    title: string;
    creator: string;
    years: string;
    image: string;
    excerpt: string;
    externalRating?: number | null;
    _tab?: string;
  }) => {
    setTitle(result.title);
    setCreator(result.creator);
    setYears(result.years);
    if (result.image) setImage(result.image);
    setExcerpt(result.excerpt);
    if (result.excerpt) setContent(`<p>${result.excerpt}</p>`);
    setExternalRating(result.externalRating ?? null);
    if (result._tab) {
      const catName =
        result._tab === "dizi"
          ? "Dizi"
          : result._tab === "kitap"
            ? "Kitap"
            : result._tab === "oyun"
              ? "Oyun"
              : "Film";
      handleCategoryChange(catName);
    }
    const filled = new Set<string>(["title", "creator", "years"]);
    if (result.image) filled.add("image");
    if (result._tab) filled.add("category");
    setFlashFields(filled);
    setAutofillDone(true);
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    flashTimerRef.current = setTimeout(() => setFlashFields(new Set()), 2000);
  };

  /* Gezi yer arama handler */
  const handlePlaceSelect = (place: PlaceResult) => {
    const placeName =
      place.address?.city ||
      place.address?.town ||
      place.address?.village ||
      place.display_name.split(",")[0].trim();
    setTitle(placeName);
    setYears(new Date().getFullYear().toString());
    if (place.thumbUrl) setImage(place.thumbUrl);
    const filled = new Set<string>(["title", "years"]);
    if (place.thumbUrl) filled.add("image");
    setFlashFields(filled);
    setAutofillDone(true);
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    flashTimerRef.current = setTimeout(() => setFlashFields(new Set()), 2000);
  };

  /* Popüler tag'e tıklanınca ekle */
  const handleAddPopularTag = (tagName: string) => {
    if (tags.length >= 10) {
      toast.error("En fazla 10 etiket ekleyebilirsiniz.");
      return;
    }
    if (tags.includes(tagName)) return;
    setTags((prev) => [...prev, tagName]);
  };

  const config = CATEGORY_CONFIG[category] ?? CATEGORY_CONFIG["Diğer"];

  /* Kategori → MediaSearch tab eşlemesi */
  const mediaTab =
    category === "Film"
      ? ("film" as const)
      : category === "Dizi"
        ? ("dizi" as const)
        : category === "Oyun"
          ? ("oyun" as const)
          : category === "Kitap"
            ? ("kitap" as const)
            : undefined;

  /* Arama bölümü başlığı */
  const searchLabel =
    category === "Film"
      ? "Film Ara"
      : category === "Dizi"
        ? "Dizi Ara"
        : category === "Oyun"
          ? "Oyun Ara"
          : category === "Kitap"
            ? "Kitap Ara"
            : category === "Gezi"
              ? "Yer Ara"
              : null; // Diğer → gizle

  const doSubmit = async () => {
    const requiredFields: string[] = [title, category, image, content];
    if (config.creatorRequired) requiredFields.push(creator);
    if (config.yearsRequired) requiredFields.push(years);

    if (requiredFields.some((f) => !f)) {
      toast.error("Lütfen zorunlu alanları doldurun.");
      return;
    }
    const autoExcerpt = excerpt || stripHtml(content).slice(0, 300);
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          category,
          rating,
          status,
          image,
          excerpt: autoExcerpt,
          content,
          creator: config.showCreator ? creator : "",
          years,
          imagePosition,
          tags,
          externalRating,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Not başarıyla kaydedildi!");
      router.push("/notes");
    } catch {
      toast.error("Not kaydedilirken bir hata oluştu!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = (field: string) => `${inputBase} ${flashClass(flashFields.has(field))}`;
  const statusOptions = getStatusOptions(category);

  return (
    <main className="min-h-screen pb-24">
      <div className="mx-auto max-w-3xl space-y-3 px-4 py-5 sm:px-6 sm:py-7">
        {/* ── Page title ── */}
        <div className="flex items-center gap-3 pb-1">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)]"
          >
            <svg
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2.2"
              strokeLinecap="round"
            >
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-[var(--text-primary)]">Yeni Not</h1>
          {autofillDone && (
            <span className="inline-flex items-center gap-1 rounded-full border border-[#c9a84c]/30 bg-[#c9a84c]/10 px-2 py-0.5 text-[10px] font-semibold text-[#c9a84c]">
              <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z" />
              </svg>
              Otomatik dolduruldu
            </span>
          )}
        </div>

        {/* ── 1. Kategori Seç ── */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3.5">
          <label className={labelClass}>Kategori</label>
          <div className="flex flex-wrap gap-1.5">
            {FIXED_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => handleCategoryChange(cat)}
                className={`rounded-md px-3 py-2 text-[12px] font-semibold transition-all duration-150 active:scale-95 ${
                  category === cat
                    ? "bg-[#c9a84c] text-[#0c0c0c] shadow-[0_2px_8px_rgba(201,168,76,0.25)]"
                    : "border border-[var(--border)] bg-[var(--bg-raised)] text-[var(--text-secondary)] hover:border-[#c9a84c]/30 hover:text-[var(--text-primary)]"
                } ${flashFields.has("category") && cat === category ? "ring-2 ring-[#c9a84c]/60" : ""}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* ── 2. İçerik / Yer Ara — Diğer kategorisinde gizlenir ── */}
        {searchLabel !== null && (
          <div className="overflow-visible rounded-xl border border-[var(--border)] bg-[var(--bg-card)]">
            <button
              type="button"
              onClick={() => setIsSearchOpen((v) => !v)}
              className="flex w-full items-center justify-between px-4 py-3.5 transition-colors hover:bg-[var(--bg-raised)]"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-[#c9a84c]/15">
                  <svg
                    className="h-3.5 w-3.5 text-[#c9a84c]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z"
                    />
                  </svg>
                </div>
                <span className="text-sm font-semibold text-[#c9a84c]">{searchLabel}</span>
                <span className="text-[10px] text-[var(--text-muted)]">
                  — bilgileri otomatik doldur
                </span>
              </div>
              <svg
                className={`h-4 w-4 text-[var(--text-muted)] transition-transform duration-200 ${isSearchOpen ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {isSearchOpen && (
              <div className="border-t border-[var(--border)] px-4 pb-5 pt-4">
                {category === "Gezi" ? (
                  <PlaceSearch onSelect={handlePlaceSelect} />
                ) : (
                  <MediaSearch category={category} onSelect={handleMediaSelect} lockedTab={mediaTab} />
                )}
              </div>
            )}
          </div>
        )}

        {/* ── 3. Kapak + Başlık ── */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
          <div className="flex gap-4">
            {/* Poster thumbnail */}
            <div
              className={`relative flex-shrink-0 overflow-hidden rounded-lg bg-[var(--bg-raised)] transition-all duration-300 ${
                image
                  ? "h-36 w-24 border border-[var(--border)] sm:h-44 sm:w-28"
                  : "h-20 w-14 border border-dashed border-[var(--border)]"
              }`}
            >
              {image ? (
                <Image
                  loader={customLoader}
                  src={image}
                  alt="Kapak"
                  fill
                  className="object-cover"
                  style={{ objectPosition: imagePosition }}
                  unoptimized
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-1">
                  <svg
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    className="text-[var(--text-muted)]"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                  <span className="text-[9px] text-[var(--text-muted)]">Görsel</span>
                </div>
              )}
              {isLandscape && (
                <div className="absolute bottom-1 right-1 rounded bg-[#c9a84c]/90 px-1 text-[8px] font-bold text-black">
                  16:9
                </div>
              )}
            </div>

            {/* Başlık */}
            <div className="min-w-0 flex-1">
              <label className={labelClass}>Başlık</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={inputClass("title")}
                placeholder="Başlık girin..."
              />
            </div>
          </div>

          {/* Kapak URL */}
          <div className="mt-4">
            <label className={labelClass}>Kapak Görseli URL</label>
            <input
              type="url"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              className={inputClass("image")}
              placeholder="https://..."
            />
          </div>
        </div>

        {/* ── 3. Yaratıcı + Yıl + Durum ── */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
          <div className={`mb-4 grid gap-3 ${config.showCreator ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
            {/* Creator — kategori bazlı göster/gizle */}
            {config.showCreator && (
              <div>
                <label className={labelClass}>
                  {config.creatorLabel}
                  {config.creatorRequired && (
                    <span className="ml-1 text-[#e53e3e]">*</span>
                  )}
                </label>
                <input
                  type="text"
                  value={creator}
                  onChange={(e) => setCreator(e.target.value)}
                  className={inputClass("creator")}
                  placeholder="—"
                />
              </div>
            )}
            <div>
              <label className={labelClass}>
                {config.yearsLabel}
                {config.yearsRequired && (
                  <span className="ml-1 text-[#e53e3e]">*</span>
                )}
              </label>
              <input
                type="text"
                value={years}
                onChange={(e) => setYears(e.target.value)}
                className={inputClass("years")}
                placeholder={config.yearsPlaceholder}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Durum</label>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((s) => {
                const isCompleted = ["İzlendi", "Okundu", "Tamamlandı", "Gidildi"].includes(s);
                const isOngoing = ["İzleniyor", "Okunuyor", "Devam Ediyor", "Oynanıyor"].includes(s);
                const activeStyle = isCompleted
                  ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                  : isOngoing
                    ? "bg-[#c9a84c]/15 border-[#c9a84c]/40 text-[#c9a84c]"
                    : "bg-[var(--text-secondary)]/15 border-[var(--text-secondary)]/40 text-[var(--text-secondary)]";
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={`rounded-lg border px-4 py-2 text-[12px] font-semibold transition-all duration-150 active:scale-95 ${
                      status === s
                        ? activeStyle
                        : "border-[var(--border)] bg-[var(--bg-raised)] text-[var(--text-secondary)] hover:border-[#c9a84c]/30 hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Puan — durum kartının alt satırı */}
          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-[var(--border)] pt-4">
            <label className={labelClass + " mb-0 w-10 shrink-0"}>Puan</label>
            <StarRating rating={rating} interactive onRate={setRating} size={26} />
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold leading-none text-[var(--text-primary)]">
                {rating > 0 ? rating.toFixed(1) : "—"}
              </span>
              {rating > 0 && <span className="text-xs text-[var(--text-muted)]">/ 5</span>}
            </div>
            {rating > 0 && (
              <button
                type="button"
                onClick={() => setRating(0)}
                className="ml-auto text-[11px] text-[var(--text-muted)] transition-colors hover:text-[#e53e3e]"
              >
                Sıfırla
              </button>
            )}
          </div>
        </div>

        {/* ── 5. Etiketler ── */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-4">
          <label className={labelClass}>Etiketler</label>

          {/* Popüler etiketler — kategori bazlı */}
          <div className="mb-3.5">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#555555]">
                Popüler
              </span>
              <div className="h-px flex-1 bg-[#1e1e1e]" />
            </div>
            {popularTagsLoading ? (
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-7 w-16 animate-pulse rounded-lg bg-[#1a1a1a]" />
                ))}
              </div>
            ) : popularTags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {popularTags.map((tagName) => {
                  const isAdded = tags.includes(tagName);
                  return (
                    <button
                      key={tagName}
                      type="button"
                      onClick={() => handleAddPopularTag(tagName)}
                      disabled={isAdded || tags.length >= 10}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-150 active:scale-95 disabled:cursor-default disabled:opacity-40 ${
                        isAdded
                          ? "border-[#c9a84c]/40 bg-[#c9a84c]/10 text-[#c9a84c]"
                          : "border-[#2a2a2a] bg-[#161616] text-[#888888] hover:border-[#c9a84c]/40 hover:bg-[#1e1c14] hover:text-[#c9a84c]"
                      }`}
                    >
                      #{tagName}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-[#555555]">Henüz etiket kullanılmamış</p>
            )}
          </div>

          <TagInput value={tags} onChange={setTags} />
        </div>

        {/* ── 6. Not Editörü ── */}
        <div className="rounded-xl border border-[#c9a84c]/25 bg-[var(--bg-card)] p-4">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-[#c9a84c]/15">
              <svg className="h-3 w-3 text-[#c9a84c]" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </div>
            <span className={labelClass + " mb-0"}>Notunuz</span>
          </div>
          <div className="overflow-hidden rounded-lg border border-[var(--border)]">
            <ReactQuill theme="snow" value={content} onChange={setContent} />
          </div>
        </div>
      </div>

      {/* ── Sticky Save Bar ── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border)] bg-[var(--bg-base)]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
              Kaydet
            </p>
            <p className="max-w-[180px] truncate text-sm text-[var(--text-secondary)] sm:max-w-xs">
              {title || <span className="italic text-[var(--text-muted)]">Başlık girilmedi</span>}
            </p>
          </div>
          <div className="flex flex-shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-lg px-4 py-2 text-sm text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)]"
            >
              İptal
            </button>
            <button
              type="button"
              onClick={doSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-lg bg-[#c9a84c] px-6 py-2.5 text-sm font-bold text-[#0c0e16] transition-all hover:bg-[#e0c068] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isSubmitting && (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              )}
              {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </div>
        </div>
        <div className="sm:hidden" style={{ height: "env(safe-area-inset-bottom, 0px)" }} />
      </div>
    </main>
  );
}
