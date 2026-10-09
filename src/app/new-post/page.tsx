"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import "react-quill/dist/quill.snow.css";
import { getStatusOptions } from "@/components/StatusBadge";
import { FormStatusMessage } from "@/components/FormStatusMessage";
import { PageHeader, Em, Dot } from "@/components/ui/PageHeader";
import { ArrowLeftIcon } from "@phosphor-icons/react";
import { StatusSidebar, CoverSidebar, TagsSidebar } from "./composer-sidebar";
import { CategorySearchSection, FieldsSection, ContentSection } from "./composer-sections";
import toast from "react-hot-toast";
import {
  FIXED_CATEGORIES,
  getCategoryLabel,
  getCategoryFromSearchTab,
  getSearchTabForCategory,
  isTravelCategory,
  normalizeFixedCategory,
} from "@/lib/categories";
import type { PlaceResult } from "@/components/PlaceSearch";
import { ClientApiError, getClientErrorMessage, requestJson } from "@/lib/client-api";
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
import { useAutoSave } from "@/hooks/useAutoSave";

const inputBase =
  "w-full rounded-lg border border-[var(--border)] bg-[var(--bg-raised)] px-3.5 py-2.5 text-[16px] sm:text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-all duration-150 focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/15 focus:bg-[var(--bg-card)]";

function flashClass(flashed: boolean) {
  return flashed ? "ring-2 ring-accent/40 border-accent/50" : "";
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
  const draftRestoredRef = useRef(false);
  const { updateDraft, loadDraft, clearDraft, lastSavedAt, saveDraft } = useAutoSave();

  // Taslak yükle (ilk açılışta)
  useEffect(() => {
    if (draftRestoredRef.current) return;
    const hasPrefill = Boolean(searchParams.get("title") || searchParams.get("category"));
    if (hasPrefill) return;

    const draft = loadDraft();
    if (!draft) return;

    draftRestoredRef.current = true;
    setTitle(draft.title);
    setCategory(draft.category);
    setRating(draft.rating);
    setStatus(draft.status);
    setImage(draft.image);
    setContent(draft.content);
    setCreator(draft.creator);
    setYears(draft.years);
    setHasSpoiler(draft.hasSpoiler);
    setLat(draft.lat);
    setLng(draft.lng);
    setLocationLabel(draft.locationLabel);
    setTags(draft.tags);
    setExternalRating(draft.externalRating);
    setImagePosition(draft.imagePosition);
    toast.success("Yarım kalan taslağın geri yüklendi");
  }, [loadDraft, searchParams]);

  // Her değişiklikte taslağı güncelle
  useEffect(() => {
    updateDraft({
      title,
      category,
      rating,
      status,
      image,
      content,
      creator,
      years,
      hasSpoiler,
      lat,
      lng,
      locationLabel,
      tags,
      externalRating,
      imagePosition,
    });
  }, [
    title,
    category,
    rating,
    status,
    image,
    content,
    creator,
    years,
    hasSpoiler,
    lat,
    lng,
    locationLabel,
    tags,
    externalRating,
    imagePosition,
    updateDraft,
  ]);

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
  const footerHint = (() => {
    if (title) {
      const ratingStr = rating > 0 ? ` · ${rating}/5` : "";
      return `${status}${ratingStr}`;
    }
    if (supportsAutofill) return "Önce ara ya da başlığı kendin yaz.";
    return guidance.manualHint;
  })();
  const flowSteps = [
    {
      step: "1",
      label: "Kategori",
      detail: `${categoryLabel} seçili`,
      complete: true,
    },
    {
      step: "2",
      label: supportsAutofill ? guidance.searchTitle : "Başlıkla Başla",
      detail: supportsAutofill ? guidance.searchHint : guidance.manualHint,
      complete: supportsAutofill ? autofillDone || hasLocation : Boolean(title || creator || image),
    },
    {
      step: "3",
      label: "Başlık",
      detail: title || guidance.titleHint,
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
      const message = "Zorunlu alanları doldur.";
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
      clearDraft();
      toast.success("Not kaydedildi");
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
    ? "Başlığı ve Durumu Kontrol Et"
    : (nextPendingStep?.label ?? "Şimdi Yazmaya Geç");

  const sidebarCards = (
    <>
      <StatusSidebar
        title={title}
        categoryLabel={categoryLabel}
        status={status}
        rating={rating}
        externalRating={externalRating}
        hasSpoiler={hasSpoiler}
        supportsSpoiler={supportsSpoiler}
        footerHint={footerHint}
        onRatingChange={setRating}
        onSpoilerChange={setHasSpoiler}
      />
      <CoverSidebar
        image={image}
        imagePosition={imagePosition}
        isLandscape={isLandscape}
        inputClassName={ic("image")}
        imageHint={guidance.imageHint}
        onImageChange={setImage}
      />
      <TagsSidebar tags={tags} exampleTags={exampleTags} onTagsChange={setTags} />
    </>
  );

  return (
    <main className="min-h-[calc(100dvh-3.75rem)] pb-32 sm:pb-32">
      <div className="mx-auto max-w-[1280px] px-3.5 sm:px-5 lg:px-6">
        {/* LAYOUT: shared editorial masthead — draft/autofill badges + back link in the action slot */}
        <PageHeader
          index="+"
          eyebrow="Yeni Not"
          className="pt-6 sm:pt-8"
          title={
            <>
              Yeni <Em>Not</Em> Ekle
              <Dot />
            </>
          }
          description={`${categoryLabel} notu ekliyorsun. Önce ara, bilgiler kendiliğinden dolsun; sonra düşüncelerini yaz.`}
          actions={
            <>
              {autofillDone && (
                <span className="dn-mono hidden items-center gap-1.5 rounded-full border border-accent-2/30 bg-accent-2/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-[var(--accent-2)] sm:inline-flex">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-2)]" /> Otomatik
                  Dolduruldu
                </span>
              )}
              <span className="dn-mono inline-flex items-center rounded-full border border-accent/25 bg-accent/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-[var(--gold)]">
                Taslak
              </span>
              <button
                type="button"
                onClick={() => router.back()}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[var(--border)] px-3.5 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors duration-200 ease-out-expo hover:border-[var(--text-primary)] hover:text-[var(--text-primary)] active:scale-95"
              >
                <ArrowLeftIcon size={12} weight="bold" />
                Geri
              </button>
            </>
          }
        />

        {submitError && (
          <div className="mb-5">
            <FormStatusMessage message={submitError} />
          </div>
        )}

        <form className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="order-1 min-w-0 space-y-4">
            <CategorySearchSection
              category={category}
              supportsAutofill={supportsAutofill}
              guidance={guidance}
              lockedSearchTab={lockedSearchTab}
              autofillDone={autofillDone}
              isTravelCat={isTravelCategory(category)}
              title={title}
              flashFields={flashFields}
              completedStepCount={completedStepCount}
              nextActionText={nextActionText}
              onCategoryChange={handleCategoryChange}
              onMediaSelect={handleMediaSelect}
              onTitleChange={setTitle}
            />

            <FieldsSection
              supportsAutofill={supportsAutofill}
              title={title}
              status={status}
              creator={creator}
              years={years}
              category={category}
              config={config}
              guidance={guidance}
              statusOptions={statusOptions}
              flashFields={flashFields}
              lat={lat}
              lng={lng}
              locationLabel={locationLabel}
              hasLocation={hasLocation}
              onTitleChange={setTitle}
              onStatusChange={setStatus}
              onCreatorChange={setCreator}
              onYearsChange={setYears}
              onPlaceSelect={handlePlaceSelect}
            />

            <ContentSection
              content={content}
              plainContent={plainContent}
              activeTemplate={activeTemplate}
              isTemplateActive={isTemplateActive}
              category={category}
              guidance={guidance}
              onContentChange={setContent}
              onApplyTemplate={applyTemplate}
            />
          </div>

          <aside className="order-2 hidden min-w-0 space-y-4 lg:sticky lg:top-24 lg:block lg:self-start">
            {sidebarCards}
          </aside>

          <details className="group order-2 min-w-0 lg:hidden">
            <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3 text-sm font-medium text-[var(--text-secondary)] transition-colors duration-200 hover:text-[var(--text-primary)] [&::-webkit-details-marker]:hidden">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="transition-transform duration-200 group-open:rotate-90"
                strokeLinecap="round"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
              Puan, Kapak ve Etiketler
              {rating > 0 && <span className="ml-auto text-xs text-[var(--gold)]">{rating}/5</span>}
            </summary>
            <div className="mt-3 space-y-4">{sidebarCards}</div>
          </details>
        </form>
      </div>

      {/* LAYOUT: floating glass pill action bar — context left, draft/cancel/save right */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-3 pb-3 sm:px-5 sm:pb-5">
        <div className="pointer-events-auto mx-auto flex max-w-[1080px] items-center justify-between gap-3 rounded-full border border-[var(--border)] bg-[var(--header-glass)] py-2 pl-5 pr-2 shadow-[var(--shadow-soft)] backdrop-blur-xl">
          <div className="min-w-0">
            <p className="dn-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
              <span className="text-[var(--gold)]">(+)</span> Yeni Not · {categoryLabel}
            </p>
            {title ? (
              <p className="max-w-[110px] truncate text-sm text-[var(--text-secondary)] sm:max-w-xs">
                {title}
              </p>
            ) : (
              <p className="max-w-[110px] truncate text-sm italic text-[var(--text-muted)] sm:max-w-xs">
                {footerHint}
              </p>
            )}
          </div>

          <div className="flex flex-shrink-0 items-center gap-1 sm:gap-1.5">
            {lastSavedAt && (
              <span className="dn-mono mr-1 hidden text-[10px] uppercase tracking-[0.14em] text-[var(--text-faint)] md:inline">
                Taslak kaydedildi
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                saveDraft();
                toast.success("Taslak kaydedildi");
              }}
              className="cursor-pointer rounded-full px-2.5 py-2 text-sm text-[var(--text-muted)] transition-colors duration-200 ease-out-expo hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)] active:scale-95 sm:px-3.5"
            >
              <span className="sm:hidden">Taslak</span>
              <span className="hidden sm:inline">Taslak Kaydet</span>
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="cursor-pointer rounded-full px-2.5 py-2 text-sm text-[var(--text-muted)] transition-colors duration-200 ease-out-expo hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)] active:scale-95 sm:px-3.5"
            >
              İptal
            </button>
            <button
              type="button"
              onClick={doSubmit}
              disabled={isSubmitting}
              className="flex cursor-pointer items-center gap-2 rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-[var(--text-on-accent)] transition-all duration-200 ease-out-expo hover:bg-accent-dark active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 sm:px-5"
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
