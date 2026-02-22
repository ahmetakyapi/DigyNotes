"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Image from "next/image";
import "react-quill/dist/quill.snow.css";
import StarRating from "@/components/StarRating";
import { getStatusOptions } from "@/components/StatusBadge";
import { MediaSearch } from "@/components/MediaSearch";
import TagInput from "@/components/TagInput";
import toast from "react-hot-toast";
import { FIXED_CATEGORIES } from "@/lib/categories";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });
const customLoader = ({ src }: { src: string }) => src;

const inputBase =
  "w-full px-3.5 py-2.5 rounded-lg text-[#e8eaf6] placeholder-[#3a4060] bg-[#080b14] border border-[#1e2235] focus:outline-none focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c]/20 transition-all text-sm";
const labelClass =
  "block text-[10px] font-bold uppercase tracking-[0.14em] text-[#50608a] mb-1.5";

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

  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
    setStatus(getStatusOptions(cat)[0]);
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

  const doSubmit = async () => {
    if (!title || !category || !image || !content || !creator || !years) {
      toast.error("Lütfen tüm alanları doldurun.");
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
          creator,
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
    <main className="min-h-screen bg-[#0c0e16] pb-40 sm:pb-24">
      <div className="mx-auto max-w-3xl space-y-3 px-4 py-5 sm:px-6 sm:py-7">

        {/* ── Page title ── */}
        <div className="flex items-center gap-3 pb-1">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-[#445] transition-colors hover:bg-[#1a1e2e] hover:text-[#e8eaf6]"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2" strokeLinecap="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-[#e8eaf6]">Yeni Not</h1>
          {autofillDone && (
            <span className="inline-flex items-center gap-1 rounded-full border border-[#c9a84c]/30 bg-[#c9a84c]/10 px-2 py-0.5 text-[10px] font-semibold text-[#c9a84c]">
              <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z" />
              </svg>
              Otomatik dolduruldu
            </span>
          )}
        </div>

        {/* ── 1. İçerik Ara ── */}
        <div className="overflow-visible rounded-xl border border-[#1a1e2e] bg-[#0d0f1a]">
          <button
            type="button"
            onClick={() => setIsSearchOpen((v) => !v)}
            className="flex w-full items-center justify-between px-4 py-3.5 transition-colors hover:bg-[#10121e]"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-[#c9a84c]/15">
                <svg className="h-3.5 w-3.5 text-[#c9a84c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-[#c9a84c]">İçerik Ara</span>
              <span className="text-[10px] text-[#2a3050]">— bilgileri otomatik doldur</span>
            </div>
            <svg
              className={`h-4 w-4 text-[#2a3050] transition-transform duration-200 ${isSearchOpen ? "rotate-180" : ""}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {isSearchOpen && (
            <div className="border-t border-[#1a1e2e] px-4 pb-5 pt-4">
              <MediaSearch category={category} onSelect={handleMediaSelect} />
            </div>
          )}
        </div>

        {/* ── 2. Kapak + Başlık + Kategori ── */}
        <div className="rounded-xl border border-[#1a1e2e] bg-[#0d0f1a] p-4">
          <div className="flex gap-4">
            {/* Poster thumbnail */}
            <div
              className={`relative flex-shrink-0 overflow-hidden rounded-lg bg-[#080b14] transition-all duration-300 ${
                image ? "h-36 w-24 border border-[#1e2540] sm:h-44 sm:w-28" : "h-20 w-14 border border-dashed border-[#1e2540]"
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
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" className="text-[#2a3050]">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                  <span className="text-[9px] text-[#2a3050]">Görsel</span>
                </div>
              )}
              {isLandscape && (
                <div className="absolute bottom-1 right-1 rounded bg-[#c9a84c]/90 px-1 text-[8px] font-bold text-black">
                  16:9
                </div>
              )}
            </div>

            {/* Başlık + Kategori */}
            <div className="min-w-0 flex-1 space-y-3">
              <div>
                <label className={labelClass}>Başlık</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={inputClass("title")}
                  placeholder="Başlık girin..."
                />
              </div>
              <div>
                <label className={labelClass}>Kategori</label>
                <div className="flex flex-wrap gap-1.5">
                  {FIXED_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleCategoryChange(cat)}
                      className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-all duration-150 ${
                        category === cat
                          ? "bg-[#c9a84c] text-[#0c0c0c] shadow-[0_2px_8px_rgba(201,168,76,0.25)]"
                          : "border border-[#1e2540] bg-[#080b14] text-[#6070a0] hover:border-[#2a3a60] hover:text-[#c0c8e8]"
                      } ${flashFields.has("category") && cat === category ? "ring-2 ring-[#c9a84c]/60" : ""}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
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
        <div className="rounded-xl border border-[#1a1e2e] bg-[#0d0f1a] p-4">
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>
                {category === "Kitap"
                  ? "Yazar"
                  : category === "Oyun"
                    ? "Geliştirici"
                    : "Yönetmen / Yaratıcı"}
              </label>
              <input
                type="text"
                value={creator}
                onChange={(e) => setCreator(e.target.value)}
                className={inputClass("creator")}
                placeholder="—"
              />
            </div>
            <div>
              <label className={labelClass}>{category === "Dizi" ? "Yayın Yılları" : "Yıl"}</label>
              <input
                type="text"
                value={years}
                onChange={(e) => setYears(e.target.value)}
                className={inputClass("years")}
                placeholder={category === "Dizi" ? "2020–2023" : "2024"}
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
                    : "bg-[#6070a0]/15 border-[#6070a0]/40 text-[#8892b0]";
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={`rounded-lg border px-4 py-1.5 text-[12px] font-semibold transition-all duration-150 ${
                      status === s
                        ? activeStyle
                        : "border-[#1e2540] bg-[#080b14] text-[#6070a0] hover:border-[#2a3a60] hover:text-[#c0c8e8]"
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── 4. Puan ── */}
        <div className="flex items-center gap-4 rounded-xl border border-[#1a1e2e] bg-[#0d0f1a] px-4 py-4">
          <div className="flex flex-1 flex-col gap-1.5">
            <label className={labelClass}>Puan</label>
            <StarRating rating={rating} interactive onRate={setRating} size={30} />
          </div>
          <div className="flex items-end gap-1">
            <span className="text-3xl font-bold leading-none text-[#f0ede8]">
              {rating > 0 ? rating.toFixed(1) : "—"}
            </span>
            {rating > 0 && (
              <span className="mb-0.5 text-xs text-[#555]">/ 5</span>
            )}
          </div>
          {rating > 0 && (
            <button
              type="button"
              onClick={() => setRating(0)}
              className="flex-shrink-0 text-[11px] text-[#3a3a5a] transition-colors hover:text-[#e53e3e]"
            >
              Sıfırla
            </button>
          )}
        </div>

        {/* ── 5. Etiketler ── */}
        <div className="rounded-xl border border-[#1a1e2e] bg-[#0d0f1a] px-4 py-4">
          <label className={labelClass}>Etiketler</label>
          <TagInput value={tags} onChange={setTags} />
        </div>

        {/* ── 6. Not Editörü ── */}
        <div className="rounded-xl border border-[#c9a84c]/25 bg-[#0d0f1a] p-4 shadow-[0_0_40px_rgba(201,168,76,0.05)]">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-[#c9a84c]/15">
              <svg className="h-3 w-3 text-[#c9a84c]" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </div>
            <span className={labelClass + " mb-0"}>Notunuz</span>
          </div>
          <div className="overflow-hidden rounded-lg border border-[#1e2540]">
            <ReactQuill theme="snow" value={content} onChange={setContent} />
          </div>
        </div>

      </div>

      {/* ── Sticky Save Bar ── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#1a1e2e] bg-[#0c0e16]/96 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#2a3050]">Kaydet</p>
            <p className="max-w-[180px] truncate text-sm text-[#6272a4] sm:max-w-xs">
              {title || <span className="italic text-[#2a3050]">Başlık girilmedi</span>}
            </p>
          </div>
          <div className="flex flex-shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-lg px-4 py-2 text-sm text-[#445] transition-colors hover:bg-[#1a1e2e] hover:text-[#e8eaf6]"
            >
              İptal
            </button>
            <button
              type="button"
              onClick={doSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-lg bg-[#c9a84c] px-6 py-2.5 text-sm font-bold text-[#0c0e16] shadow-[0_4px_20px_rgba(201,168,76,0.35)] transition-all hover:bg-[#e0c068] hover:shadow-[0_4px_28px_rgba(201,168,76,0.5)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isSubmitting && (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              )}
              {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </div>
        </div>
        {/* Mobile tab bar spacer */}
        <div className="h-safe-bottom sm:hidden" style={{ height: "env(safe-area-inset-bottom, 0px)" }} />
      </div>
    </main>
  );
}
