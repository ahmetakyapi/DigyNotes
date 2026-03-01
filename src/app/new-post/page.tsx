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
  getSearchTabForCategory,
  isTravelCategory,
  normalizeFixedCategory,
} from "@/lib/categories";
import { ClientApiError, getClientErrorMessage, requestJson } from "@/lib/client-api";
import { customLoader } from "@/lib/image";
import { buildOpenStreetMapLink, formatCoordinate } from "@/lib/maps";
import {
  CATEGORY_EXAMPLE_TAGS,
  categorySupportsAutofill,
  categorySupportsSpoiler,
  getPostComposerGuidance,
} from "@/lib/post-config";
import {
  detectImagePosition,
  getPostCategoryFormConfig,
  syncPostCategoryDependentFields,
} from "@/lib/post-form";
import { getPostTemplate, getTemplateSignature } from "@/lib/post-templates";
import { stripHtml } from "@/lib/text";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

const inputBase =
  "w-full rounded-lg border border-[var(--border)] bg-[var(--bg-raised)] px-3.5 py-2.5 text-[16px] sm:text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-all duration-150 focus:outline-none focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)]/20 focus:bg-[var(--bg-card)]";
const labelClass =
  "mb-1.5 block text-[10px] font-bold uppercase tracking-[0.13em] text-[var(--text-muted)]";
const cardClass = "rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 sm:p-5";
const helperTextClass = "mt-2 text-[11px] leading-5 text-[var(--text-muted)]";

function flashClass(flashed: boolean) {
  return flashed ? "ring-2 ring-[var(--gold)]/50 border-[var(--gold)]/60" : "";
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
      detectImagePosition(image, (pos, landscape) => {
        setImagePosition(pos);
        setIsLandscape(landscape);
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

  const handleCategoryChange = useCallback(
    (nextCategory: string) => {
      applyTemplate(nextCategory);

      const nextFields = syncPostCategoryDependentFields(nextCategory, {
        creator,
        hasSpoiler,
        lat,
        lng,
        locationLabel,
      });

      setCategory(nextCategory);
      setStatus(getStatusOptions(nextCategory)[0]);
      setCreator(nextFields.creator);
      setHasSpoiler(nextFields.hasSpoiler);
      setLat(nextFields.lat);
      setLng(nextFields.lng);
      setLocationLabel(nextFields.locationLabel);
      setAutofillDone(false);
    },
    [applyTemplate, creator, hasSpoiler, lat, lng, locationLabel]
  );

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

    if (nextCategory) {
      handleCategoryChange(nextCategory);
    }

    setTitle(result.title);
    if (!isTravelResult) setCreator(result.creator);
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
    setAutofillDone(true);
    toast.success("Konum güncellendi");
  };

  const config = getPostCategoryFormConfig(category);
  const supportsSpoiler = categorySupportsSpoiler(category);
  const supportsAutofill = categorySupportsAutofill(category);
  const lockedSearchTab = getSearchTabForCategory(category) ?? undefined;
  const categoryLabel = getCategoryLabel(category);
  const guidance = getPostComposerGuidance(category);
  const exampleTags = CATEGORY_EXAMPLE_TAGS[category as keyof typeof CATEGORY_EXAMPLE_TAGS] ?? [];
  const activeTemplate = getPostTemplate(category);
  const plainContent = stripHtml(content).trim();
  const hasLocation = typeof lat === "number" && typeof lng === "number";
  const isTemplateActive = Boolean(
    activeTemplate && getTemplateSignature(content) === getTemplateSignature(activeTemplate.html)
  );
  const footerHint = title
    ? `${status}${rating > 0 ? ` · ${rating}/5` : ""}`
    : supportsAutofill
      ? "Önce arama yap ya da başlığı elle netleştir."
      : guidance.manualHint;
  const flowSteps = [
    {
      step: "1",
      label: "Kategori",
      detail: `${categoryLabel} seçili`,
      complete: true,
    },
    {
      step: "2",
      label: supportsAutofill ? guidance.searchTitle : "Manuel başlangıç",
      detail: supportsAutofill ? guidance.searchHint : guidance.manualHint,
      complete: supportsAutofill ? autofillDone || hasLocation : Boolean(title || creator || image),
    },
    {
      step: "3",
      label: "Başlık",
      detail: title ? title : guidance.titleHint,
      complete: Boolean(title.trim()),
    },
    {
      step: "4",
      label: "Durum",
      detail: status,
      complete: Boolean(status),
    },
  ];

  const doSubmit = async () => {
    const requiredFields: string[] = [title, category, image, plainContent];
    if (config.creatorRequired) requiredFields.push(creator);
    if (config.yearsRequired) requiredFields.push(years);

    if (requiredFields.some((field) => !field)) {
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
  const completedStepCount = flowSteps.filter((item) => item.complete).length;
  const nextPendingStep = flowSteps.find((item) => !item.complete);
  const nextActionText = autofillDone
    ? "Başlık ve durumu tamamla"
    : nextPendingStep?.label ?? "İçeriğe geç";
  const statusSidebarCard = (
    <div className={cardClass}>
      <p className={labelClass}>Not Durumu</p>
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-raised)] p-3.5">
        <p className="text-sm font-semibold text-[var(--text-primary)]">
          {title || "Başlık bekliyor"}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="border-[var(--gold)]/20 bg-[var(--gold)]/8 rounded-full border px-2.5 py-1 text-[10px] font-semibold text-[var(--gold)]">
            {categoryLabel}
          </span>
          <span className="rounded-full border border-[var(--border)] bg-[var(--bg-card)] px-2.5 py-1 text-[10px] font-medium text-[var(--text-secondary)]">
            {status}
          </span>
          {externalRating !== null && (
            <span className="rounded-full border border-[var(--border)] bg-[var(--bg-card)] px-2.5 py-1 text-[10px] font-medium text-[var(--text-secondary)]">
              Dış puan: {externalRating}
            </span>
          )}
        </div>
        <p className="mt-3 text-[11px] leading-5 text-[var(--text-muted)]">
          {title ? "Not görünür hale geliyor." : footerHint}
        </p>

        <div className="mt-4 border-t border-[var(--border)] pt-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-faint)]">
              Puan
            </span>
            {rating > 0 && (
              <button
                type="button"
                onClick={() => setRating(0)}
                className="text-[11px] text-[var(--text-muted)] transition-colors duration-150 hover:text-[var(--danger)]"
              >
                Sıfırla
              </button>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <StarRating rating={rating} interactive onRate={setRating} size={26} />
            <span className="text-sm font-medium text-[var(--text-secondary)]">
              {rating > 0 ? `${rating} / 5` : "Henüz puanlanmadı"}
            </span>
          </div>
        </div>

        {supportsSpoiler && (
          <label className="mt-4 flex cursor-pointer items-start gap-3 border-t border-[var(--border)] pt-4">
            <input
              type="checkbox"
              checked={hasSpoiler}
              onChange={(event) => setHasSpoiler(event.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-[var(--border)] text-[var(--gold)] focus:ring-[var(--gold)]"
            />
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-[var(--text-primary)]">
                Spoiler uyarısı ekle
              </span>
              <span className="mt-1 block text-xs leading-5 text-[var(--text-muted)]">
                İçerik detay sayfasında önce onayla açılır.
              </span>
            </span>
          </label>
        )}
      </div>
    </div>
  );

  const coverSidebarCard = (
    <div className={cardClass}>
      <label className={labelClass}>Kapak Görseli</label>
      <input
        type="url"
        value={image}
        onChange={(event) => setImage(event.target.value)}
        className={`${ic("image")} mt-0.5`}
        placeholder="https://..."
      />
      <p className={helperTextClass}>{guidance.imageHint}</p>

      {image ? (
        <div className="mt-3 overflow-hidden rounded-xl border border-[var(--border-subtle)]">
          <div className="relative h-52 w-full bg-[var(--media-panel-bg)]">
            <Image
              loader={customLoader}
              src={image}
              alt=""
              fill
              aria-hidden
              className="scale-110 object-cover opacity-40 blur-2xl"
              unoptimized
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(135deg, var(--media-panel-sheen) 0%, transparent 50%, var(--media-panel-sheen) 100%)",
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
                      filter: "drop-shadow(0 20px 32px rgba(0,0,0,0.5))",
                    }
              }
              unoptimized
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, transparent 40%, var(--media-overlay-mid) 75%, var(--media-overlay-strong) 100%)",
              }}
            />
            <span
              className="absolute left-3 top-3 rounded-full border px-2.5 py-1 text-[10px] font-semibold backdrop-blur-md"
              style={{
                borderColor: "var(--media-control-border)",
                background: "var(--media-control-bg)",
                color: "var(--gold)",
              }}
            >
              Kapak Önizleme
            </span>
            <span
              className="absolute bottom-3 right-3 rounded-md border px-2 py-0.5 text-[10px] font-medium backdrop-blur-sm"
              style={{
                borderColor: "var(--media-control-border)",
                background: "var(--media-control-bg)",
                color: "var(--media-control-text)",
              }}
            >
              {isLandscape ? "Yatay" : "Poster"}
            </span>
          </div>
          <div className="border-t border-[var(--border-subtle)] bg-[var(--bg-raised)] px-3.5 py-2">
            <p className="text-[11px] text-[var(--text-muted)]">
              {isLandscape
                ? "Yatay görsel. Üst odaklı kadraj uygulandı."
                : "Poster görsel. Merkez odak korunuyor."}
            </p>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-[11px] leading-5 text-[var(--text-muted)]">
          Kapak şu an boş. Arama sonucu, yer seçimi ya da manuel URL ile dolabilir.
        </p>
      )}
    </div>
  );

  const tagsSidebarCard = (
    <div className={cardClass}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className={labelClass}>Etiketler</p>
        <span className="rounded-full border border-[var(--border)] bg-[var(--bg-raised)] px-2.5 py-1 text-[10px] font-medium text-[var(--text-secondary)]">
          {tags.length}/10
        </span>
      </div>

      <TagInput value={tags} onChange={setTags} />
      <p className={`${helperTextClass} mt-3`}>
        Etiketler notu daha sonra ararken ve kategori içinde daraltırken işini
        kolaylaştırır.
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
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
  );

  return (
    <main className="min-h-[calc(100dvh-3.75rem)] pb-28 sm:pb-24">
      <div className="mx-auto max-w-[1280px] px-3.5 sm:px-5 lg:px-6">
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

        <form className="grid gap-4 pt-5 sm:pt-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="order-1 min-w-0 space-y-4">
            <section
              className={`${cardClass} overflow-hidden`}
              style={{
                background:
                  "radial-gradient(circle at top left, rgba(196,162,75,0.12), transparent 34%), var(--bg-card)",
              }}
            >
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-2xl">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--gold)]">
                      İlk aksiyon
                    </p>
                    <h2 className="mt-1 text-lg font-semibold text-[var(--text-primary)] sm:text-[1.35rem]">
                      {supportsAutofill ? guidance.searchTitle : "Başlıkla başla"}
                    </h2>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--text-secondary)]">
                      {supportsAutofill
                        ? "Kategori seç, arama sonucunu al ve sonra alt alandaki başlık ile durum bilgilerini tamamla."
                        : guidance.manualHint}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border border-[var(--border)] bg-[var(--bg-raised)] px-3 py-1 text-[11px] font-medium text-[var(--text-secondary)]">
                      {completedStepCount}/4 adım hazır
                    </span>
                    <span className="rounded-full border border-[var(--gold)]/24 bg-[var(--gold)]/10 px-3 py-1 text-[11px] font-medium text-[var(--gold)]">
                      Sıradaki: {nextActionText}
                    </span>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-base)] p-3.5">
                    <label className={labelClass}>Kategori</label>
                    <select
                      value={category}
                      onChange={(event) => handleCategoryChange(event.target.value)}
                      className={ic("category")}
                    >
                      {FIXED_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {getCategoryLabel(cat)}
                        </option>
                      ))}
                    </select>
                    <p className={helperTextClass}>
                      Seçtiğin kategori aramayı, şablonu ve görünür alanları ayarlar.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-base)] p-3.5 sm:p-4">
                    <div className="mb-3">
                      <p className="text-sm font-semibold text-[var(--text-primary)]">
                        {supportsAutofill ? guidance.searchTitle : "Başlıkla başla"}
                      </p>
                      <p className="mt-1 text-[11px] leading-5 text-[var(--text-muted)]">
                        {supportsAutofill
                          ? guidance.searchDescription
                          : "Bu kategoride otomatik arama yok. Önce başlığı ver, sonra aşağıdaki alanlarla notu tamamla."}
                      </p>
                    </div>

                    {supportsAutofill ? (
                      <>
                        <MediaSearch
                          category={category}
                          lockedTab={lockedSearchTab}
                          onSelect={handleMediaSelect}
                        />
                        <p className="mt-3 text-[11px] leading-5 text-[var(--text-muted)]">
                          {autofillDone
                            ? "Temel alanlar doldu. Aşağıda sadece başlığı ve durumu gözden geçirmen yeterli."
                            : isTravelCategory(category)
                              ? "Doğru yeri seçtiğinde koordinatlar görünür ve gezi notu haritayla bağ kurar."
                              : "Arama başlangıcı hızlandırır; istersen sonucu seçmeden de devam edebilirsin."}
                        </p>
                      </>
                    ) : (
                      <>
                        <input
                          type="text"
                          value={title}
                          onChange={(event) => setTitle(event.target.value)}
                          className={ic("title")}
                          placeholder={guidance.titlePlaceholder}
                        />
                        <p className={helperTextClass}>
                          {title
                            ? "Başlık hazır. Aşağıda durum ve diğer alanları tamamlayabilirsin."
                            : guidance.titleHint}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <div className={cardClass}>
              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--gold)]">
                  3. adım
                </p>
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                  {supportsAutofill
                    ? "Başlığı ve temel durumu netleştir"
                    : "Durum ve temel alanları tamamla"}
                </h3>
              </div>

              {supportsAutofill && (
                <div className="mt-4">
                  <label className={labelClass}>Başlık</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    className={ic("title")}
                    placeholder={guidance.titlePlaceholder}
                  />
                  <p className={helperTextClass}>
                    {title
                      ? "Başlık görünür durumda. İstersen tonu daha kişisel hale getirebilirsin."
                      : guidance.titleHint}
                  </p>
                </div>
              )}

              <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,0.8fr)_1fr_1fr]">
                <div>
                  <label className={labelClass}>Durum</label>
                  <select
                    value={status}
                    onChange={(event) => setStatus(event.target.value)}
                    className={ic("status")}
                  >
                    {statusOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <p className={helperTextClass}>{guidance.statusHint}</p>
                </div>

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
                      onChange={(event) => setCreator(event.target.value)}
                      className={ic("creator")}
                      placeholder="—"
                    />
                    <p className={helperTextClass}>
                      {creator
                        ? `${config.creatorLabel} bilgisi görünür durumda kalır.`
                        : `${config.creatorLabel} alanı bu kategori için ${config.creatorRequired ? "zorunlu" : "opsiyonel"} tutulur.`}
                    </p>
                  </div>
                )}

                <div className={!config.showCreator ? "lg:col-span-2" : ""}>
                  <label className={labelClass}>
                    {config.yearsLabel}
                    {config.yearsRequired && <span className="ml-1 text-[var(--danger)]">*</span>}
                  </label>
                  <input
                    type="text"
                    value={years}
                    onChange={(event) => setYears(event.target.value)}
                    className={ic("years")}
                    placeholder={config.yearsPlaceholder}
                  />
                  <p className={helperTextClass}>
                    {years
                      ? `${config.yearsLabel} alanı kayda hazır.`
                      : `${config.yearsLabel} alanı ${config.yearsRequired ? "bu kategori için zorunlu." : "istersen boş bırakılabilir."}`}
                  </p>
                </div>
              </div>

              {isTravelCategory(category) && (
                <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--bg-raised)] p-3.5">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className={labelClass}>Konum</p>
                      <p className="-mt-1 text-[11px] leading-5 text-[var(--text-muted)]">
                        {guidance.locationHint}
                      </p>
                    </div>
                    {hasLocation && (
                      <a
                        href={buildOpenStreetMapLink(lat as number, lng as number)}
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
                    {hasLocation ? (
                      <div className="space-y-1.5">
                        <p className="font-medium text-[var(--text-secondary)]">
                          {locationLabel || title || "Konum seçildi"}
                        </p>
                        <p>
                          {formatCoordinate(lat as number)}, {formatCoordinate(lng as number)}
                        </p>
                      </div>
                    ) : (
                      <p>{guidance.locationHint}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className={cardClass}>
              <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--gold)]">
                    4. adım
                  </p>
                  <label className={`${labelClass} mb-0 mt-1`}>İçerik</label>
                  <p className="mt-1 text-[11px] leading-5 text-[var(--text-muted)]">
                    {activeTemplate ? activeTemplate.description : guidance.contentHint}
                  </p>
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
              <p className={helperTextClass}>
                {isTemplateActive
                  ? guidance.contentTemplateHint
                  : plainContent
                    ? guidance.contentHint
                    : "İlk paragrafı boş bırakma; neden kaydettiğini söyleyen tek bir cümle bile yeterli."}
              </p>
            </div>

          </div>

          <aside className="order-2 hidden min-w-0 space-y-4 xl:sticky xl:top-24 xl:block xl:self-start">
            {statusSidebarCard}
            {coverSidebarCard}
            {tagsSidebarCard}
          </aside>

          <div className="order-2 min-w-0 space-y-4 xl:hidden">
            {statusSidebarCard}
            {coverSidebarCard}
            {tagsSidebarCard}
          </div>
        </form>
      </div>

      <div className="bg-[var(--bg-base)]/95 fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-3 px-3.5 py-3 sm:px-5 lg:px-6">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
              Yeni Not · {categoryLabel}
            </p>
            {title ? (
              <p className="max-w-[180px] truncate text-sm text-[var(--text-secondary)] sm:max-w-xs">
                {title}
              </p>
            ) : (
              <p className="max-w-[220px] truncate text-sm italic text-[var(--text-muted)] sm:max-w-xs">
                {footerHint}
              </p>
            )}
          </div>

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
