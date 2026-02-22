"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Image from "next/image";
import "react-quill/dist/quill.snow.css";
import { Category } from "@/types";
import StarRating from "@/components/StarRating";
import { getStatusOptions } from "@/components/StatusBadge";
import { MediaSearch } from "@/components/MediaSearch";
import TagInput from "@/components/TagInput";
import toast from "react-hot-toast";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });
const customLoader = ({ src }: { src: string }) => src;

const inputBase =
  "w-full px-4 py-3 rounded-lg text-[#e8eaf6] placeholder-[#4a5568] bg-[#0d0f1a] border border-[#1e2235] focus:outline-none focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c]/20 transition-all text-sm";
const labelClass = "block text-[10px] font-bold uppercase tracking-[0.14em] text-[#6272a4] mb-2";
const sectionClass = "rounded-xl bg-[#0d0f1a] border border-[#1a1e2e] p-5";

function flashClass(flashed: boolean) {
  return flashed ? "ring-2 ring-[#c9a84c]/60 border-[#c9a84c]" : "";
}

// Görsel aspect ratio'ya göre en iyi pozisyonu otomatik belirle
function detectImagePosition(url: string, cb: (pos: string) => void) {
  const img = new window.Image();
  img.onload = () => {
    const ratio = img.naturalWidth / img.naturalHeight;
    cb(ratio > 1.35 ? "center 25%" : "center");
  };
  img.onerror = () => cb("center");
  img.src = url;
}

export default function NewPostPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [rating, setRating] = useState(0);
  const [image, setImage] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [creator, setCreator] = useState("");
  const [years, setYears] = useState("");
  const [status, setStatus] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [imagePosition, setImagePosition] = useState("center");
  const [isLandscape, setIsLandscape] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [flashFields, setFlashFields] = useState<Set<string>>(new Set());
  const [autofillDone, setAutofillDone] = useState(false);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const imgTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((cats: Category[]) => {
        setCategories(cats);
        if (cats.length > 0) {
          setCategory(cats[0].name);
          setStatus(getStatusOptions(cats[0].name)[0]);
        }
      })
      .catch(console.error);
  }, []);

  // Görsel URL değişince otomatik pozisyon tespit et
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
    _tab?: string;
  }) => {
    setTitle(result.title);
    setCreator(result.creator);
    setYears(result.years);
    if (result.image) setImage(result.image);
    setExcerpt(result.excerpt);
    if (result.excerpt) setContent(`<p>${result.excerpt}</p>`);
    if (result._tab) {
      const catName = result._tab === "dizi" ? "Dizi" : result._tab === "kitap" ? "Kitap" : "Film";
      const matched = categories.find((c) => c.name === catName);
      if (matched) handleCategoryChange(matched.name);
    }
    const filled = new Set<string>(["title", "creator", "years", "excerpt"]);
    if (result.image) filled.add("image");
    if (result._tab) filled.add("category");
    setFlashFields(filled);
    setAutofillDone(true);
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    flashTimerRef.current = setTimeout(() => setFlashFields(new Set()), 2000);
  };

  const doSubmit = async () => {
    if (!title || !category || !image || !excerpt || !content || !creator || !years) {
      toast.error("Lütfen tüm alanları doldurun.");
      return;
    }
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
          excerpt,
          content,
          creator,
          years,
          imagePosition,
          tags,
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

  return (
    <main className="min-h-screen bg-[#0c0e16] py-8 pb-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        {/* Page header */}
        <div className="mb-8 border-b border-[#1a1e2e] pb-5">
          <div className="mb-1 flex items-center gap-3">
            <h1 className="text-xl font-bold text-[#e8eaf6]">Yeni Not</h1>
            {autofillDone && (
              <span className="inline-flex items-center gap-1 rounded-full border border-[#c9a84c]/30 bg-[#c9a84c]/10 px-2 py-0.5 text-[10px] font-semibold text-[#c9a84c]">
                <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z" />
                </svg>
                Otomatik dolduruldu
              </span>
            )}
          </div>
          <p className="text-xs text-[#4a5568]">Film, dizi veya kitap notu ekle</p>
        </div>

        {/* İçerik Ara */}
        <div className="mb-6 overflow-hidden rounded-xl border border-[#1a1e2e] bg-[#0d0f1a]">
          <button
            type="button"
            onClick={() => setIsSearchOpen((v) => !v)}
            className="flex w-full items-center justify-between px-4 py-3.5 transition-colors hover:bg-[#10121e]"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-[#c9a84c]/15">
                <svg
                  className="h-3 w-3 text-[#c9a84c]"
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
              <div>
                <span className="text-xs font-semibold text-[#c9a84c]">
                  Film, Dizi veya Kitap Ara
                </span>
                <span className="ml-2 hidden text-[10px] text-[#3a3a4a] sm:inline">
                  — Bilgileri otomatik doldur
                </span>
              </div>
            </div>
            <svg
              className={`h-4 w-4 text-[#3a3a5a] transition-transform duration-200 ${isSearchOpen ? "rotate-180" : ""}`}
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
            <div className="border-t border-[#1a1e2e] px-5 pb-5 pt-4">
              <MediaSearch category={category} onSelect={handleMediaSelect} />
            </div>
          )}
        </div>

        <div className="space-y-4">
          {/* Başlık + Kategori */}
          <div className={sectionClass}>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Başlık</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={inputClass("title")}
                  placeholder="Film, dizi veya kitap adı"
                />
              </div>
              <div>
                <label className={labelClass}>Kategori</label>
                <select
                  value={category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className={inputClass("category")}
                >
                  {categories.length === 0 && <option value="">Önce bir kategori oluştur</option>}
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Creator + Years + Status */}
          <div className={sectionClass}>
            <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>
                  {category === "Kitap" ? "Yazar" : "Yönetmen / Yaratıcı"}
                </label>
                <input
                  type="text"
                  value={creator}
                  onChange={(e) => setCreator(e.target.value)}
                  className={inputClass("creator")}
                />
              </div>
              <div>
                <label className={labelClass}>
                  {category === "Dizi" ? "Yayın Yılları" : "Yıl"}
                </label>
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
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={inputClass("status")}
              >
                {getStatusOptions(category).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Etiketler */}
          <div className={sectionClass}>
            <label className={labelClass}>Etiketler</label>
            <TagInput value={tags} onChange={setTags} />
          </div>

          {/* Puan */}
          <div className={sectionClass}>
            <label className={labelClass}>Puan</label>
            <div className="mt-1 flex items-center gap-4">
              <StarRating rating={rating} interactive onRate={setRating} size={26} />
              <span className="text-sm text-[#6272a4]">
                {rating > 0 ? `${rating} / 5` : "Henüz puanlanmadı"}
              </span>
              {rating > 0 && (
                <button
                  type="button"
                  onClick={() => setRating(0)}
                  className="text-xs text-[#4a5568] transition-colors hover:text-[#e53e3e]"
                >
                  Sıfırla
                </button>
              )}
            </div>
          </div>

          {/* Görsel */}
          <div className={sectionClass}>
            <div className="mb-2 flex items-center justify-between">
              <label className={labelClass + " mb-0"}>Kapak Görseli URL</label>
              {isLandscape && (
                <span className="flex items-center gap-1 text-[10px] text-[#6272a4]">
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                    />
                  </svg>
                  Yatay görsel — otomatik ayarlandı
                </span>
              )}
            </div>
            <input
              type="url"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              className={inputClass("image")}
              placeholder="https://..."
            />
            {image && (
              <div className="relative mt-3 h-32 w-24 overflow-hidden rounded-lg border border-[#252d40] sm:h-44 sm:w-32">
                <Image
                  loader={customLoader}
                  src={image}
                  alt="Önizleme"
                  fill
                  className="object-cover"
                  style={{ objectPosition: imagePosition }}
                />
              </div>
            )}
          </div>

          {/* Özet + İçerik */}
          <div className={sectionClass}>
            <div className="mb-4">
              <div className="mb-2 flex items-center justify-between">
                <label className={labelClass + " mb-0"}>Kısa Özet</label>
                <span className="text-[10px] text-[#3a3a5a]">{excerpt.length} karakter</span>
              </div>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                rows={3}
                className={inputClass("excerpt")}
                placeholder="Kısa bir özet veya ilk izlenim..."
              />
            </div>
            <div>
              <label className={labelClass}>İçerik</label>
              <div className="overflow-hidden rounded-lg border border-[#1e2235]">
                <ReactQuill theme="snow" value={content} onChange={setContent} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Sticky Save Bar ─── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#1a1e2e] bg-[#0c0e16]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#3a3a5a]">
              Yeni Not
            </p>
            {title ? (
              <p className="max-w-[200px] truncate text-sm text-[#8892b0] sm:max-w-xs">{title}</p>
            ) : (
              <p className="text-sm italic text-[#3a3a5a]">Başlık girilmedi</p>
            )}
          </div>
          <div className="flex flex-shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-lg px-4 py-2 text-sm text-[#4a5568] transition-colors hover:bg-[#1a1e2e] hover:text-[#e8eaf6]"
            >
              İptal
            </button>
            <button
              type="button"
              onClick={doSubmit}
              disabled={isSubmitting || categories.length === 0}
              className="flex items-center gap-2 rounded-lg bg-[#c9a84c] px-6 py-2.5 text-sm font-semibold text-[#0c0e16] shadow-[0_4px_20px_rgba(201,168,76,0.3)] transition-all hover:bg-[#e0c068] hover:shadow-[0_4px_24px_rgba(201,168,76,0.45)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isSubmitting ? (
                <>
                  <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
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
                  Kaydediliyor...
                </>
              ) : (
                "Kaydet"
              )}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
