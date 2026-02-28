"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import Image from "next/image";
import "react-quill/dist/quill.snow.css";
import StarRating from "@/components/StarRating";
import { getStatusOptions } from "@/components/StatusBadge";
import { MediaSearch } from "@/components/MediaSearch";
import PlaceSearch, { PlaceResult } from "@/components/PlaceSearch";
import TagInput from "@/components/TagInput";
import { FormStatusMessage } from "@/components/FormStatusMessage";
import toast from "react-hot-toast";
import {
  FIXED_CATEGORIES,
  getCategoryLabel,
  getCategoryFromSearchTab,
  isOtherCategory,
  isTravelCategory,
  normalizeFixedCategory,
} from "@/lib/categories";
import { ClientApiError, getClientErrorMessage, requestJson } from "@/lib/client-api";
import { buildOpenStreetMapLink, formatCoordinate } from "@/lib/maps";
import { CATEGORY_EXAMPLE_TAGS, categorySupportsSpoiler } from "@/lib/post-config";
import { getPostTemplate, getTemplateSignature } from "@/lib/post-templates";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });
const customLoader = ({ src }: { src: string }) => src;

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
  movies: {
    showCreator: true,
    creatorLabel: "Yönetmen",
    yearsLabel: "Yıl",
    yearsPlaceholder: "2024",
    yearsRequired: true,
    creatorRequired: true,
  },
  series: {
    showCreator: true,
    creatorLabel: "Yönetmen / Yapımcı",
    yearsLabel: "Yayın Yılları",
    yearsPlaceholder: "2020–2023",
    yearsRequired: true,
    creatorRequired: true,
  },
  game: {
    showCreator: true,
    creatorLabel: "Geliştirici",
    yearsLabel: "Yıl",
    yearsPlaceholder: "2024",
    yearsRequired: true,
    creatorRequired: true,
  },
  book: {
    showCreator: true,
    creatorLabel: "Yazar",
    yearsLabel: "Yıl",
    yearsPlaceholder: "2024",
    yearsRequired: true,
    creatorRequired: true,
  },
  travel: {
    showCreator: false,
    creatorLabel: "",
    yearsLabel: "Ziyaret Tarihi",
    yearsPlaceholder: "2024",
    yearsRequired: false,
    creatorRequired: false,
  },
  other: {
    showCreator: true,
    creatorLabel: "Kaynak / Kişi",
    yearsLabel: "Yıl",
    yearsPlaceholder: "2024",
    yearsRequired: false,
    creatorRequired: false,
  },
};

const inputBase =
  "w-full rounded-lg border border-[var(--border)] bg-[var(--bg-raised)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-all duration-150 focus:outline-none focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)]/20 focus:bg-[var(--bg-card)]";
const labelClass =
  "block text-[10px] font-bold uppercase tracking-[0.13em] text-[var(--text-muted)] mb-1.5";
const cardClass = "rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 sm:p-5";

function flashClass(flashed: boolean) {
  return flashed ? "ring-2 ring-[var(--gold)]/50 border-[var(--gold)]/60" : "";
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
  const searchParams = useSearchParams();
  const initialCategory = FIXED_CATEGORIES[0];
  const initialTemplate = getPostTemplate(initialCategory);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>(initialCategory);
  const [rating, setRating] = useState(0);
  const [image, setImage] = useState("");
  const [content, setContent] = useState(initialTemplate?.html ?? "");
  const [creator, setCreator] = useState("");
  const [years, setYears] = useState("");
  const [status, setStatus] = useState(getStatusOptions(initialCategory)[0]);
  const [hasSpoiler, setHasSpoiler] = useState(false);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [locationLabel, setLocationLabel] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [externalRating, setExternalRating] = useState<number | null>(null);
  const [imagePosition, setImagePosition] = useState("center");
  const [isLandscape, setIsLandscape] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(true);
  const [flashFields, setFlashFields] = useState<Set<string>>(new Set());
  const [autofillDone, setAutofillDone] = useState(false);
  const [lastAppliedTemplateCategory, setLastAppliedTemplateCategory] = useState<string | null>(
    initialTemplate ? initialCategory : null
  );
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const imgTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prefillAppliedRef = useRef(false);

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

  const applyTemplate = useCallback(
    (nextCategory: string, options?: { force?: boolean }) => {
      const template = getPostTemplate(nextCategory);
      if (!template) return false;

      const currentSignature = getTemplateSignature(content);
      const previousTemplate = lastAppliedTemplateCategory
        ? getPostTemplate(lastAppliedTemplateCategory)
        : null;
      const previousTemplateSignature = previousTemplate
        ? getTemplateSignature(previousTemplate.html)
        : "";
      const shouldReplace =
        options?.force || currentSignature === "" || currentSignature === previousTemplateSignature;

      if (!shouldReplace) return false;

      setContent(template.html);
      setLastAppliedTemplateCategory(nextCategory);
      return true;
    },
    [content, lastAppliedTemplateCategory]
  );

  const handleCategoryChange = (cat: string) => {
    applyTemplate(cat);
    setCategory(cat);
    setStatus(getStatusOptions(cat)[0]);
    setIsSearchOpen(!isOtherCategory(cat));
    if (!categorySupportsSpoiler(cat)) {
      setHasSpoiler(false);
    }
    if (isTravelCategory(cat)) {
      setCreator("");
    } else {
      setLat(null);
      setLng(null);
      setLocationLabel("");
    }
  };

  const handleMediaSelect = (result: {
    title: string;
    creator: string;
    years: string;
    image: string;
    excerpt: string;
    externalRating?: number | null;
    latitude?: number | null;
    longitude?: number | null;
    locationLabel?: string;
    _tab?: string;
  }) => {
    const isTravelResult = result._tab === "gezi";
    const nextCategory = getCategoryFromSearchTab(result._tab);

    setTitle(result.title);
    if (!isTravelResult) setCreator(result.creator);
    if (nextCategory) {
      handleCategoryChange(nextCategory);
    }
    setYears(result.years || (isTravelResult ? new Date().getFullYear().toString() : ""));
    if (result.image) setImage(result.image);
    if (result.excerpt && !isTravelResult) {
      setContent(`<p>${result.excerpt}</p>`);
      setLastAppliedTemplateCategory(null);
    }
    setExternalRating(result.externalRating ?? null);
    if (isTravelResult) {
      setLat(typeof result.latitude === "number" ? result.latitude : null);
      setLng(typeof result.longitude === "number" ? result.longitude : null);
      setLocationLabel(result.locationLabel ?? "");
    }
    const filled = new Set<string>(["title", "years"]);
    if (!isTravelResult) filled.add("creator");
    if (result.image) filled.add("image");
    if (result._tab) filled.add("category");
    setFlashFields(filled);
    setAutofillDone(true);
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    flashTimerRef.current = setTimeout(() => setFlashFields(new Set()), 2000);
  };

  const handleAddPopularTag = (tagName: string) => {
    if (tags.length >= 10) {
      toast.error("En fazla 10 etiket ekleyebilirsiniz.");
      return;
    }
    if (tags.includes(tagName)) return;
    setTags((prev) => [...prev, tagName]);
  };

  useEffect(() => {
    if (prefillAppliedRef.current) return;

    const prefillTitle = searchParams.get("title")?.trim();
    const prefillCategory = searchParams.get("category")?.trim();
    const prefillCreator = searchParams.get("creator")?.trim();
    const prefillYears = searchParams.get("years")?.trim();
    const prefillImage = searchParams.get("image")?.trim();
    const prefillExcerpt = searchParams.get("excerpt")?.trim();
    const prefillExternalRating = Number.parseFloat(searchParams.get("externalRating") ?? "");
    const hasPrefillData = Boolean(
      prefillTitle ||
      prefillCategory ||
      prefillCreator ||
      prefillYears ||
      prefillImage ||
      prefillExcerpt
    );

    if (!hasPrefillData) return;
    prefillAppliedRef.current = true;

    const nextCategory = normalizeFixedCategory(prefillCategory) ?? category;

    if (nextCategory) {
      handleCategoryChange(nextCategory);
    }

    if (prefillTitle) setTitle(prefillTitle);
    if (prefillCreator && !isTravelCategory(nextCategory)) setCreator(prefillCreator);
    if (prefillYears) setYears(prefillYears);
    if (prefillImage) setImage(prefillImage);
    if (prefillExcerpt && !isTravelCategory(nextCategory)) {
      setContent(`<p>${prefillExcerpt}</p>`);
      setLastAppliedTemplateCategory(null);
    }
    if (Number.isFinite(prefillExternalRating)) {
      setExternalRating(prefillExternalRating);
    }
    setAutofillDone(true);
    setIsSearchOpen(false);
  }, [category, handleCategoryChange, searchParams]);

  const handlePlaceSelect = (place: PlaceResult) => {
    const main =
      place.address?.city ||
      place.address?.town ||
      place.address?.village ||
      place.display_name.split(",")[0].trim();

    setTitle(main);
    if (!image && place.thumbUrl) setImage(place.thumbUrl);
    if (!years) setYears(new Date().getFullYear().toString());
    setLat(Number.parseFloat(place.lat));
    setLng(Number.parseFloat(place.lon));
    setLocationLabel(place.display_name);
    toast.success("Konum güncellendi");
  };

  const config = CATEGORY_CONFIG[category] ?? CATEGORY_CONFIG["other"];
  const supportsSpoiler = categorySupportsSpoiler(category);
  const exampleTags = CATEGORY_EXAMPLE_TAGS[category as keyof typeof CATEGORY_EXAMPLE_TAGS] ?? [];
  const activeTemplate = getPostTemplate(category);
  const isTemplateActive = Boolean(
    activeTemplate && getTemplateSignature(content) === getTemplateSignature(activeTemplate.html)
  );

  const doSubmit = async () => {
    const plainContent = stripHtml(content);
    const requiredFields: string[] = [title, category, image, plainContent];
    if (config.creatorRequired) requiredFields.push(creator);
    if (config.yearsRequired) requiredFields.push(years);

    if (requiredFields.some((f) => !f)) {
      const message = "Lütfen zorunlu alanları doldurun.";
      setSubmitError(message);
      toast.error(message);
      return;
    }
    const autoExcerpt = plainContent.slice(0, 300);
    setSubmitError("");
    setIsSubmitting(true);
    try {
      await requestJson(
        "/api/posts",
        {
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
            hasSpoiler: supportsSpoiler ? hasSpoiler : false,
            lat: isTravelCategory(category) ? lat : null,
            lng: isTravelCategory(category) ? lng : null,
            imagePosition,
            tags,
            externalRating,
          }),
        },
        "Not kaydedilemedi."
      );
      toast.success("Not başarıyla kaydedildi!");
      router.push("/notes");
    } catch (error) {
      const message = getClientErrorMessage(error, "Not kaydedilemedi.");
      setSubmitError(message);
      toast.error(message);

      if (error instanceof ClientApiError && error.status === 401) {
        router.push("/login");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const ic = (field: string) => `${inputBase} ${flashClass(flashFields.has(field))}`;
  const statusOptions = getStatusOptions(category);

  /* ─────────────────────────────────────────── */
  /* LAYOUT: Sol (form + içerik) | Sağ sticky sidebar (arama + kapak + puan)
     Mobilde: Sağ sidebar CSS order-1 → en üstte görünür (arama önce gelir)
             Sol form CSS order-2 → arama altında */
  /* ─────────────────────────────────────────── */
  return (
    <main className="min-h-[calc(100dvh-3.75rem)] pb-28 sm:pb-24">
      <div className="mx-auto max-w-[1280px] px-3.5 sm:px-5 lg:px-6">
        {/* ── Sayfa başlığı ── */}
        <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] py-5 sm:py-6">
          <div className="flex min-w-0 flex-wrap items-center gap-2.5">
            <h1 className="text-xl font-bold text-[var(--text-primary)] sm:text-2xl">Yeni Not</h1>
            <span className="border-[var(--gold)]/20 bg-[var(--gold)]/8 inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[var(--gold)]">
              Taslak
            </span>
            {autofillDone && (
              <span className="bg-[#2bbf6a]/8 inline-flex items-center gap-1.5 rounded-full border border-[#2bbf6a]/25 px-2.5 py-0.5 text-[10px] font-semibold text-[#2bbf6a]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#2bbf6a]" />
                Otomatik dolduruldu
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-shrink-0 text-sm text-[var(--text-muted)] transition-colors duration-200 hover:text-[var(--gold)]"
          >
            ← Geri
          </button>
        </div>

        {submitError && (
          <div className="pt-4">
            <FormStatusMessage message={submitError} />
          </div>
        )}

        {/* ── İki kolon ızgarası ── */}
        <form className="grid gap-4 pt-5 sm:pt-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          {/* ════════════════════════════════
              SOL — Form alanları + İçerik
              (mobile: order-2, masaüstü: order-1)
          ════════════════════════════════ */}
          <div className="order-2 min-w-0 space-y-4 xl:order-1">
            {/* ─ Temel Bilgiler + Etiketler (tek kart) ─ */}
            <div className={cardClass}>
              {/* Kategori | Durum */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Kategori</label>
                  <select
                    value={category}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className={ic("category")}
                  >
                    {FIXED_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {getCategoryLabel(cat)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Durum</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className={ic("status")}
                  >
                    {statusOptions.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Başlık */}
              <div className="mt-3.5">
                <label className={labelClass}>Başlık</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={ic("title")}
                  placeholder="Başlık girin..."
                />
              </div>

              {/* Creator | Yıl — Gezi'de sadece Yıl gösterilir */}
              <div className="mt-3.5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {config.showCreator && (
                  <div>
                    <label className={labelClass}>
                      {config.creatorLabel}
                      {config.creatorRequired && (
                        <span className="ml-1 text-[var(--danger)]">*</span>
                      )}
                    </label>
                    <input
                      type="text"
                      value={creator}
                      onChange={(e) => setCreator(e.target.value)}
                      className={ic("creator")}
                      placeholder="—"
                    />
                  </div>
                )}
                <div className={config.showCreator ? "" : "sm:col-span-2"}>
                  <label className={labelClass}>
                    {config.yearsLabel}
                    {config.yearsRequired && <span className="ml-1 text-[var(--danger)]">*</span>}
                  </label>
                  <input
                    type="text"
                    value={years}
                    onChange={(e) => setYears(e.target.value)}
                    className={ic("years")}
                    placeholder={config.yearsPlaceholder}
                  />
                </div>
              </div>

              {isTravelCategory(category) && (
                <div className="mt-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-raised)] p-3.5">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className={labelClass}>Konum</p>
                      <p className="-mt-1 text-[11px] leading-5 text-[var(--text-muted)]">
                        Gezi notunu haritaya işlemek için bir yer seç.
                      </p>
                    </div>
                    {typeof lat === "number" && typeof lng === "number" && (
                      <a
                        href={buildOpenStreetMapLink(lat, lng)}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-1.5 text-[11px] font-medium text-[var(--text-secondary)] transition-colors hover:border-[#c4a24b]/35 hover:text-[var(--text-primary)]"
                      >
                        Haritada aç
                      </a>
                    )}
                  </div>
                  <PlaceSearch onSelect={handlePlaceSelect} />
                  <div className="mt-3 rounded-lg border border-dashed border-[var(--border)] px-3 py-2.5 text-xs text-[var(--text-muted)]">
                    {typeof lat === "number" && typeof lng === "number" ? (
                      <div className="space-y-1.5">
                        <p className="font-medium text-[var(--text-secondary)]">
                          {locationLabel || title || "Konum seçildi"}
                        </p>
                        <p>
                          {formatCoordinate(lat)}, {formatCoordinate(lng)}
                        </p>
                      </div>
                    ) : (
                      <p>
                        Henüz bir konum seçilmedi. Gezi notlarının haritada görünmesi için koordinat
                        gerekir.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* ── Etiketler ── */}
              <div className="mt-4 border-t border-[var(--border)] pt-4">
                {/* Label + popüler chip'ler aynı satırda */}
                <div className="mb-2.5 flex flex-wrap items-center gap-x-3 gap-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.13em] text-[var(--text-muted)]">
                    Etiketler
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {exampleTags.map((tagName) => {
                      const isAdded = tags.includes(tagName);
                      return (
                        <button
                          key={tagName}
                          type="button"
                          onClick={() => handleAddPopularTag(tagName)}
                          disabled={isAdded || tags.length >= 10}
                          className={`rounded-md border px-2 py-0.5 text-[11px] font-medium transition-all duration-150 active:scale-95 disabled:cursor-default disabled:opacity-40 ${
                            isAdded
                              ? "border-[var(--gold)]/40 bg-[var(--gold)]/10 text-[var(--gold)]"
                              : "hover:border-[var(--gold)]/40 border-[var(--border)] bg-[var(--bg-raised)] text-[var(--text-secondary)] hover:text-[var(--gold)]"
                          }`}
                        >
                          #{tagName}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <TagInput value={tags} onChange={setTags} />
              </div>
            </div>

            {/* ─ İçerik editörü ─ */}
            <div className={cardClass}>
              <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <label className={labelClass}>İçerik</label>
                  {activeTemplate && (
                    <p className="-mt-0.5 text-[11px] leading-5 text-[var(--text-muted)]">
                      {activeTemplate.description}
                    </p>
                  )}
                </div>
                {activeTemplate && (
                  <button
                    type="button"
                    onClick={() => {
                      const currentSignature = getTemplateSignature(content);
                      if (
                        currentSignature !== "" &&
                        !isTemplateActive &&
                        !window.confirm(
                          "Mevcut içerik değişecek. Kategori şablonunu yeniden uygulamak istiyor musun?"
                        )
                      ) {
                        return;
                      }

                      applyTemplate(category, { force: true });
                    }}
                    className={`inline-flex items-center rounded-lg border px-3 py-1.5 text-[11px] font-medium transition-colors ${
                      isTemplateActive
                        ? "border-[#c4a24b]/35 bg-[#c4a24b]/10 text-[var(--gold)]"
                        : "border-[var(--border)] bg-[var(--bg-raised)] text-[var(--text-secondary)] hover:border-[#c4a24b]/30 hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {isTemplateActive ? "Şablon aktif" : "Şablonu uygula"}
                  </button>
                )}
              </div>
              <div className="dn-compose-editor mt-1 overflow-hidden rounded-lg border border-[var(--border)]">
                <ReactQuill theme="snow" value={content} onChange={setContent} />
              </div>
              {activeTemplate && (
                <p className="mt-2 text-[11px] leading-5 text-[var(--text-muted)]">
                  Kategori değişince boş veya daha önce otomatik eklenmiş şablon içeriği otomatik
                  güncellenir.
                </p>
              )}
            </div>
          </div>

          {/* ════════════════════════════════
              SAĞ SIDEBAR — Arama + Kapak + Puan
              (mobile: order-1 → en üstte; masaüstü: order-2 sticky)
          ════════════════════════════════ */}
          <aside className="order-1 min-w-0 space-y-4 xl:sticky xl:top-24 xl:order-2 xl:self-start">
            {/* ─ Otomatik Doldurma ─ */}
            {!isOtherCategory(category) && (
              <div className={cardClass}>
                <button
                  type="button"
                  onClick={() => setIsSearchOpen((v) => !v)}
                  className="flex w-full items-center gap-3 text-left"
                >
                  {/* İkon */}
                  <div className="border-[var(--gold)]/20 bg-[var(--gold)]/8 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border">
                    <svg
                      className="h-4 w-4 text-[var(--gold)]"
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

                  {/* Başlık + açıklama */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      Otomatik Doldurma
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      {isTravelCategory(category)
                        ? "Yer ara, başlık ve kapak otomatik dolsun"
                        : "Film, Dizi, Oyun, Kitap veya Gezi ara"}
                    </p>
                  </div>

                  {/* Sağ taraf: badge + chevron */}
                  <div className="flex flex-shrink-0 items-center gap-2">
                    {autofillDone && (
                      <span className="rounded-full border border-[#2bbf6a]/25 bg-[#2bbf6a]/10 px-2 py-0.5 text-[10px] font-semibold text-[#2bbf6a]">
                        Dolduruldu
                      </span>
                    )}
                    <svg
                      className={`h-4 w-4 flex-shrink-0 text-[var(--text-muted)] transition-transform duration-200 ${isSearchOpen ? "rotate-180" : ""}`}
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
                  </div>
                </button>

                {isSearchOpen && (
                  <div className="mt-4 border-t border-[var(--border)] pt-4">
                    <MediaSearch category={category} onSelect={handleMediaSelect} />
                  </div>
                )}
              </div>
            )}

            {/* ─ Kapak Görseli ─ */}
            <div className={cardClass}>
              <label className={labelClass}>Kapak Görseli</label>
              <input
                type="url"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                className={`${ic("image")} mt-0.5`}
                placeholder="https://..."
              />

              {image && (
                <div className="mt-3 overflow-hidden rounded-xl border border-[var(--border-subtle)]">
                  {/* Önizleme alanı */}
                  <div className="relative h-52 w-full bg-[var(--media-panel-bg)]">
                    {/* Blurlu arka plan */}
                    <Image
                      loader={customLoader}
                      src={image}
                      alt=""
                      fill
                      aria-hidden
                      className="scale-110 object-cover opacity-40 blur-2xl"
                      unoptimized
                    />
                    {/* Sheen overlay */}
                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          "linear-gradient(135deg, var(--media-panel-sheen) 0%, transparent 50%, var(--media-panel-sheen) 100%)",
                      }}
                    />
                    {/* Ana görsel */}
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
                              filter: "drop-shadow(0 20px 32px rgba(0,0,0,0.5))",
                            }
                      }
                      unoptimized
                    />
                    {/* Alt gradient */}
                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          "linear-gradient(180deg, transparent 40%, var(--media-overlay-mid) 75%, var(--media-overlay-strong) 100%)",
                      }}
                    />
                    {/* Üst sol badge */}
                    <span className="border-[var(--gold)]/30 absolute left-3 top-3 rounded-full border bg-black/50 px-2.5 py-1 text-[10px] font-semibold text-[var(--gold)] backdrop-blur-md">
                      Kapak Önizleme
                    </span>
                    {/* Alt sağ kadraj bilgisi */}
                    <span className="absolute bottom-3 right-3 rounded-md border border-white/20 bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur-sm">
                      {isLandscape ? "Yatay" : "Poster"}
                    </span>
                  </div>
                  {/* Alt bilgi çubuğu */}
                  <div className="border-t border-[var(--border-subtle)] bg-[var(--bg-raised)] px-3.5 py-2">
                    <p className="text-[11px] text-[var(--text-muted)]">
                      {isLandscape
                        ? "Yatay görsel — üst odaklı kadraj uygulandı"
                        : "Poster görsel — merkez odak korunuyor"}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* ─ Puan ─ */}
            <div className={cardClass}>
              <label className={labelClass}>Puan</label>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <StarRating rating={rating} interactive onRate={setRating} size={26} />
                <span className="text-sm font-medium text-[var(--text-secondary)]">
                  {rating > 0 ? `${rating} / 5` : "Henüz puanlanmadı"}
                </span>
                {rating > 0 && (
                  <button
                    type="button"
                    onClick={() => setRating(0)}
                    className="text-xs text-[var(--text-muted)] transition-colors duration-150 hover:text-[var(--danger)]"
                  >
                    Sıfırla
                  </button>
                )}
              </div>
            </div>

            {supportsSpoiler && (
              <div className={cardClass}>
                <p className={labelClass}>Yayın Ayarları</p>
                <label className="hover:border-[var(--gold)]/30 flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-raised)] px-3.5 py-3 transition-colors">
                  <input
                    type="checkbox"
                    checked={hasSpoiler}
                    onChange={(e) => setHasSpoiler(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-[var(--border)] text-[var(--gold)] focus:ring-[var(--gold)]"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-[var(--text-primary)]">
                      Spoiler uyarısı ekle
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-[var(--text-muted)]">
                      Detay sayfasında içerik blur olur ve okur önce onay verir.
                    </span>
                  </span>
                </label>
              </div>
            )}
          </aside>
        </form>
      </div>

      {/* ── Sabit alt kaydetme çubuğu ── */}
      <div className="bg-[var(--bg-base)]/95 fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-3 px-3.5 py-3 sm:px-5 lg:px-6">
          {/* Sol: başlık önizleme */}
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
              Yeni Not · {category}
            </p>
            {title ? (
              <p className="max-w-[180px] truncate text-sm text-[var(--text-secondary)] sm:max-w-xs">
                {title}
              </p>
            ) : (
              <p className="text-sm italic text-[var(--text-muted)]">Başlık girilmedi</p>
            )}
          </div>

          {/* Sağ: butonlar */}
          <div className="flex flex-shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-lg px-4 py-2 text-sm text-[var(--text-muted)] transition-colors duration-200 hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)]"
            >
              İptal
            </button>
            <button
              type="button"
              onClick={doSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-lg bg-[var(--gold)] px-5 py-2.5 text-sm font-semibold text-[var(--text-on-accent)] transition-all duration-200 hover:bg-[var(--gold-light)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
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
