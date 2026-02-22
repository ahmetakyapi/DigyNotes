"use client";
import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Image from "next/image";
import "react-quill/dist/quill.snow.css";
import { Post } from "@/types";
import { FIXED_CATEGORIES } from "@/lib/categories";
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

export default function EditPostPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [originalCategory, setOriginalCategory] = useState("");

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [rating, setRating] = useState(0);
  const [status, setStatus] = useState("");
  const [image, setImage] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [creator, setCreator] = useState("");
  const [years, setYears] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [externalRating, setExternalRating] = useState<number | null>(null);
  const [imagePosition, setImagePosition] = useState("center");
  const [isLandscape, setIsLandscape] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [flashFields, setFlashFields] = useState<Set<string>>(new Set());
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const positionDetectedRef = useRef(false);

  useEffect(() => {
    fetch(`/api/posts/${params.id}`)
      .then((r) => r.json())
      .then((post: Post) => {
        setTitle(post.title);
        setCategory(post.category);
        setOriginalCategory(post.category);
        setRating(post.rating ?? 0);
        setStatus(post.status ?? getStatusOptions(post.category)[0]);
        setImage(post.image);
        setExcerpt(post.excerpt);
        setContent(post.content);
        setCreator(post.creator ?? "");
        setYears(post.years ?? "");
        setImagePosition(post.imagePosition ?? "center");
        setTags((post.tags ?? []).map((t) => t.name));
        setExternalRating(post.externalRating ?? null);
        setLoading(false);
      })
      .catch(() => {
        toast.error("İçerik yüklenemedi");
        setLoading(false);
      });
  }, [params.id]);

  // Kaydedilmemiş değişiklik uyarısı
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // Auto-detect image position based on aspect ratio
  function detectImagePosition(url: string, cb: (pos: string, landscape: boolean) => void) {
    const img = new window.Image();
    img.onload = () => {
      const ratio = img.naturalWidth / img.naturalHeight;
      const landscape = ratio > 1.35;
      cb(landscape ? "center 25%" : "center", landscape);
    };
    img.onerror = () => cb("center", false);
    img.src = url;
  }

  useEffect(() => {
    if (!image) return;
    const timer = setTimeout(() => {
      positionDetectedRef.current = true;
      detectImagePosition(image, (pos, landscape) => {
        setImagePosition(pos);
        setIsLandscape(landscape);
      });
    }, 600);
    return () => clearTimeout(timer);
  }, [image]);

  const markDirty = () => {
    if (!isDirty) setIsDirty(true);
  };

  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
    const opts = getStatusOptions(cat);
    setStatus(opts[0]);
    markDirty();
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
      const catName = result._tab === "dizi" ? "Dizi" : result._tab === "kitap" ? "Kitap" : "Film";
      handleCategoryChange(catName);
    }
    markDirty();

    const filled = new Set<string>(["title", "creator", "years", "excerpt"]);
    if (result.image) filled.add("image");
    if (result._tab) filled.add("category");
    setFlashFields(filled);
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    flashTimerRef.current = setTimeout(() => setFlashFields(new Set()), 2000);
  };

  const doSubmit = async () => {
    if (!title || !category || !image || !excerpt || !content) {
      toast.error("Lütfen tüm alanları doldurun.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${params.id}`, {
        method: "PUT",
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
          externalRating,
        }),
      });
      if (!res.ok) throw new Error();
      setIsDirty(false);
      toast.success("Değişiklikler kaydedildi!");
      router.push(`/posts/${params.id}`);
    } catch {
      toast.error("Kaydedilemedi!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = (field: string) => `${inputBase} ${flashClass(flashFields.has(field))}`;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0c0e16] py-8">
        <div className="mx-auto max-w-3xl space-y-4 px-4 sm:px-6">
          <div className="mb-8 h-8 w-48 animate-pulse rounded-lg bg-[#1a1e2e]" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-3 rounded-xl border border-[#1a1e2e] bg-[#0d0f1a] p-5">
              <div className="h-3 w-24 animate-pulse rounded bg-[#1a1e2e]" />
              <div className="h-10 animate-pulse rounded-lg bg-[#1a1e2e]" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0c0e16] py-8 pb-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        {/* Page header */}
        <div className="mb-8 border-b border-[#1a1e2e] pb-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-[#e8eaf6]">Yazıyı Düzenle</h1>
                <span className="inline-flex items-center rounded-full border border-[#c9a84c]/25 bg-[#c9a84c]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#c9a84c]">
                  Düzenleniyor
                </span>
                {isDirty && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-[#e53e3e]/25 bg-[#e53e3e]/10 px-2 py-0.5 text-[10px] font-semibold text-[#e53e3e]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#e53e3e]" />
                    Kaydedilmedi
                  </span>
                )}
              </div>
              {title && <p className="max-w-xs truncate text-sm text-[#4a5568]">{title}</p>}
            </div>
            <button
              type="button"
              onClick={() => router.push(`/category/${encodeURIComponent(originalCategory)}`)}
              className="flex-shrink-0 whitespace-nowrap text-sm text-[#4a5568] transition-colors hover:text-[#c9a84c]"
            >
              ← {originalCategory || "Geri"}
            </button>
          </div>
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
                  — mevcut alanların üzerine yazar
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

        <form className="space-y-4">
          {/* Başlık + Kategori */}
          <div className={sectionClass}>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Başlık</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    markDirty();
                  }}
                  className={inputClass("title")}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Kategori</label>
                <select
                  value={category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className={inputClass("category")}
                >
                  {FIXED_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
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
                  onChange={(e) => {
                    setCreator(e.target.value);
                    markDirty();
                  }}
                  className={inputClass("creator")}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>
                  {category === "Dizi" ? "Yayın Yılları" : "Yıl"}
                </label>
                <input
                  type="text"
                  value={years}
                  onChange={(e) => {
                    setYears(e.target.value);
                    markDirty();
                  }}
                  className={inputClass("years")}
                  required
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Durum</label>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  markDirty();
                }}
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
            <TagInput
              value={tags}
              onChange={(t) => {
                setTags(t);
                markDirty();
              }}
            />
          </div>

          {/* Puan */}
          <div className={sectionClass}>
            <label className={labelClass}>Puan</label>
            <div className="mt-1 flex items-center gap-4">
              <StarRating
                rating={rating}
                interactive
                onRate={(r) => {
                  setRating(r);
                  markDirty();
                }}
                size={26}
              />
              <span className="text-sm text-[#6272a4]">
                {rating > 0 ? `${rating} / 5` : "Henüz puanlanmadı"}
              </span>
              {rating > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setRating(0);
                    markDirty();
                  }}
                  className="text-xs text-[#4a5568] transition-colors hover:text-[#e53e3e]"
                >
                  Sıfırla
                </button>
              )}
            </div>
          </div>

          {/* Görsel */}
          <div className={sectionClass}>
            <label className={labelClass}>Kapak Görseli URL</label>
            <input
              type="url"
              value={image}
              onChange={(e) => {
                setImage(e.target.value);
                markDirty();
              }}
              className={inputClass("image")}
            />
            {image && (
              <div className="mt-3 space-y-2">
                <div className="relative h-32 w-full overflow-hidden rounded-lg border border-[#252d40]">
                  <Image
                    loader={customLoader}
                    src={image}
                    alt="Önizleme"
                    fill
                    className="object-cover"
                    style={{ objectPosition: imagePosition }}
                  />
                </div>
                {isLandscape && (
                  <p className="flex items-center gap-1 text-[10px] text-[#c9a84c]/70">
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Yatay görsel — pozisyon otomatik ayarlandı
                  </p>
                )}
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
                onChange={(e) => {
                  setExcerpt(e.target.value);
                  markDirty();
                }}
                rows={3}
                className={inputClass("excerpt")}
                required
              />
            </div>
            <div>
              <label className={labelClass}>İçerik</label>
              <div className="overflow-hidden rounded-lg border border-[#1e2235]">
                <ReactQuill
                  theme="snow"
                  value={content}
                  onChange={(v) => {
                    setContent(v);
                    markDirty();
                  }}
                />
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* ─── Sticky Save Bar ─── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#1a1e2e] bg-[#0c0e16]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#3a3a5a]">
              Düzenleniyor
            </p>
            {title ? (
              <p className="max-w-[200px] truncate text-sm text-[#8892b0] sm:max-w-xs">{title}</p>
            ) : (
              <p className="text-sm italic text-[#3a3a5a]">—</p>
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
              disabled={isSubmitting}
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
                <>
                  {isDirty && (
                    <span className="h-2 w-2 flex-shrink-0 rounded-full bg-[#0c0e16]/50" />
                  )}
                  Değişiklikleri Kaydet
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
