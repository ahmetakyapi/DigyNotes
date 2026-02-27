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
  "w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-all focus:outline-none focus:border-[var(--gold)] focus:ring-1 focus:ring-[#c4a24b]/20";
const labelClass = "block text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)] mb-2";
const sectionClass = "rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-3.5 sm:p-4 xl:p-5";

function flashClass(flashed: boolean) {
  return flashed ? "ring-2 ring-[#c4a24b]/60 border-[#c4a24b]" : "";
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
    setIsSearchOpen(cat !== "Diğer");
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
    const plainContent = stripHtml(content);
    const requiredFields: string[] = [title, category, image, plainContent];
    if (config.creatorRequired) requiredFields.push(creator);
    if (config.yearsRequired) requiredFields.push(years);

    if (requiredFields.some((f) => !f)) {
      toast.error("Lütfen zorunlu alanları doldurun.");
      return;
    }
    const autoExcerpt = plainContent.slice(0, 300);
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
    <main className="min-h-[calc(100dvh-3.75rem)] py-4 pb-36 sm:py-6 sm:pb-32 lg:py-8">
      <div className="mx-auto max-w-[1280px] px-3.5 sm:px-5 lg:px-6">
        <div className="mb-5 border-b border-[var(--border)] pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-[var(--text-primary)]">Yeni Not</h1>
                <span className="inline-flex items-center rounded-full border border-[#c4a24b]/25 bg-[#c4a24b]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--gold)]">
                  Taslak
                </span>
                {autofillDone && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-[#2bbf6a]/25 bg-[#2bbf6a]/10 px-2 py-0.5 text-[10px] font-semibold text-[#2bbf6a]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#2bbf6a]" />
                    Otomatik dolduruldu
                  </span>
                )}
              </div>
              {title ? (
                <p className="max-w-xs truncate text-sm text-[var(--text-muted)]">{title}</p>
              ) : (
                <p className="text-sm text-[var(--text-muted)]">Yeni içerik oluştur</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-shrink-0 whitespace-nowrap text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--gold)]"
            >
              ← Geri
            </button>
          </div>
        </div>

        <form className="grid items-start gap-3.5 xl:grid-cols-[minmax(0,1.42fr)_minmax(320px,0.95fr)]">
          <div className="min-w-0 space-y-3.5 sm:space-y-4">
            <div className={sectionClass}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
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

                <div>
                  <label className={labelClass}>Durum</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className={inputClass("status")}
                  >
                    {statusOptions.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                {searchLabel !== null && (
                  <div className="sm:col-span-2">
                    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-raised)]/40 p-3">
                      <button
                        type="button"
                        onClick={() => setIsSearchOpen((v) => !v)}
                        className="flex w-full items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-[#c4a24b]/15">
                            <svg
                              className="h-3.5 w-3.5 text-[var(--gold)]"
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
                          <div className="min-w-0 text-left">
                            <p className="text-xs font-semibold text-[var(--gold)]">Otomatik Doldurma</p>
                            <p className="truncate text-[10px] text-[var(--text-muted)]">{searchLabel} tipi aktif</p>
                          </div>
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
                        <div className="mt-3 border-t border-[var(--border)] pt-3.5">
                          {category === "Gezi" ? (
                            <PlaceSearch onSelect={handlePlaceSelect} />
                          ) : (
                            <MediaSearch category={category} onSelect={handleMediaSelect} lockedTab={mediaTab} />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

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

                <div className={config.showCreator ? "" : "sm:col-span-2"}>
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
            </div>
            <div className={sectionClass}>
              <label className={labelClass}>İçerik</label>
              <div className="dn-compose-editor overflow-hidden rounded-lg border border-[var(--border)]">
                <ReactQuill theme="snow" value={content} onChange={setContent} />
              </div>
            </div>
          </div>

          <aside className="order-2 min-w-0 space-y-3.5 sm:space-y-4 xl:sticky xl:top-24 xl:order-none xl:self-start">
            <div className={sectionClass}>
              <label className={labelClass}>Kapak Görseli URL</label>
              <input
                type="url"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                className={inputClass("image")}
                placeholder="https://..."
              />
              {image && (
                <div className="mt-3 overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--media-panel-bg)] shadow-[var(--shadow-soft)]">
                  <div className="relative h-36 w-full sm:h-48 lg:h-52 xl:h-56">
                    <Image
                      loader={customLoader}
                      src={image}
                      alt=""
                      fill
                      aria-hidden
                      className="scale-105 object-cover opacity-55 blur-2xl"
                      unoptimized
                    />
                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          "linear-gradient(120deg, var(--media-panel-sheen) 0%, transparent 45%, transparent 75%, var(--media-panel-sheen) 100%)",
                      }}
                    />
                    <Image
                      loader={customLoader}
                      src={image}
                      alt="Kapak önizleme"
                      fill
                      className={isLandscape ? "object-cover" : "object-contain"}
                      style={
                        isLandscape
                          ? { objectPosition: imagePosition }
                          : {
                              objectPosition: imagePosition,
                              filter: "drop-shadow(0 16px 24px rgba(0,0,0,0.35))",
                            }
                      }
                      unoptimized
                    />
                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          "linear-gradient(180deg, var(--media-overlay-soft) 0%, var(--media-overlay-mid) 60%, var(--media-overlay-strong) 100%)",
                      }}
                    />
                    <span className="absolute left-3 top-3 rounded-full border border-[#c4a24b]/30 bg-[var(--bg-overlay)] px-2.5 py-1 text-[10px] font-semibold text-[var(--gold)] backdrop-blur-md">
                      Kapak Önizleme
                    </span>
                    <span className="absolute bottom-3 right-3 rounded-md border border-white/25 bg-black/40 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
                      {isLandscape ? "Yatay kadraj" : "Poster kadrajı"}
                    </span>
                  </div>
                  <div className="border-t border-[var(--border-subtle)] bg-[var(--bg-card)] px-3.5 py-2.5">
                    <p className="text-[11px] text-[var(--text-secondary)]">
                      {isLandscape
                        ? "Yatay görseller için üst odaklı kadraj otomatik uygulandı."
                        : "Poster tipindeki görseller için merkez odak korunuyor."}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className={sectionClass}>
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                Not Özeti
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
                <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-raised)] px-2.5 py-2">
                  <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Kategori</p>
                  <p className="mt-0.5 truncate text-sm font-semibold text-[var(--text-primary)]">
                    {category || "-"}
                  </p>
                </div>
                <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-raised)] px-2.5 py-2">
                  <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Durum</p>
                  <p className="mt-0.5 truncate text-sm font-semibold text-[var(--text-primary)]">
                    {status || "-"}
                  </p>
                </div>
                <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-raised)] px-2.5 py-2">
                  <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Puan</p>
                  <p className="mt-0.5 text-sm font-semibold text-[var(--text-primary)]">
                    {rating > 0 ? `${rating} / 5` : "Yok"}
                  </p>
                </div>
              </div>
            </div>

            <div className={sectionClass}>
              <label className={labelClass}>Puan</label>
              <div className="mt-1 flex flex-wrap items-center gap-3">
                <StarRating rating={rating} interactive onRate={setRating} size={24} />
                <span className="text-sm text-[var(--text-secondary)]">
                  {rating > 0 ? `${rating} / 5` : "Henüz puanlanmadı"}
                </span>
                {rating > 0 && (
                  <button
                    type="button"
                    onClick={() => setRating(0)}
                    className="text-xs text-[var(--text-muted)] transition-colors hover:text-[#e53e3e]"
                  >
                    Sıfırla
                  </button>
                )}
              </div>
            </div>

            <div className={sectionClass}>
              <label className={labelClass}>Etiketler</label>
              <div className="mb-3">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Popüler Etiketler
                </p>
                {popularTagsLoading ? (
                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="h-7 w-16 animate-pulse rounded-lg bg-[var(--bg-raised)]" />
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
                              ? "border-[#c4a24b]/40 bg-[#c4a24b]/10 text-[var(--gold)]"
                              : "border-[var(--border)] bg-[var(--bg-raised)] text-[var(--text-secondary)] hover:border-[#c4a24b]/40 hover:text-[var(--gold)]"
                          }`}
                        >
                          #{tagName}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-[var(--text-muted)]">Henüz etiket kullanılmamış</p>
                )}
              </div>

              <TagInput value={tags} onChange={setTags} />
            </div>
          </aside>
        </form>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border)] bg-[var(--bg-base)]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-2.5 px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5 lg:px-6">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
              Yeni Not
            </p>
            {title ? (
              <p className="max-w-[200px] truncate text-sm text-[var(--text-secondary)] sm:max-w-xs">{title}</p>
            ) : (
              <p className="text-sm italic text-[var(--text-muted)]">Başlık girilmedi</p>
            )}
          </div>
          <div className="flex w-full flex-shrink-0 items-center gap-2 sm:w-auto">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-lg px-4 py-2 text-sm text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)] sm:px-4"
            >
              İptal
            </button>
            <button
              type="button"
              onClick={doSubmit}
              disabled={isSubmitting}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[var(--gold)] px-6 py-2.5 text-sm font-semibold text-[var(--text-on-accent)] transition-all hover:bg-[var(--gold-light)] disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none"
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
                "Notu Kaydet"
              )}
            </button>
          </div>
        </div>
        <div className="sm:hidden" style={{ height: "env(safe-area-inset-bottom, 0px)" }} />
      </div>
    </main>
  );
}
