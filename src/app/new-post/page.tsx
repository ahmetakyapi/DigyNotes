"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import "react-quill/dist/quill.snow.css";
import { getStatusOptions } from "@/components/StatusBadge";
import { FormStatusMessage } from "@/components/FormStatusMessage";
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

const inputBase =
  "w-full rounded-lg border border-[var(--border)] bg-[var(--bg-raised)] px-3.5 py-2.5 text-[16px] sm:text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-all duration-150 focus:outline-none focus:border-[#10b981]/60 focus:ring-1 focus:ring-[#10b981]/15 focus:bg-[var(--bg-card)]";

function flashClass(flashed: boolean) {
  return flashed ? "ring-2 ring-[#10b981]/40 border-[#10b981]/50" : "";
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
    if (supportsAutofill) return "Önce arama yap ya da başlığı elle netleştir.";
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
      label: supportsAutofill ? guidance.searchTitle : "Manuel başlangıç",
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
    : (nextPendingStep?.label ?? "İçeriğe geç");

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
      <TagsSidebar
        tags={tags}
        exampleTags={exampleTags}
        onTagsChange={setTags}
      />
    </>
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
                <span className="h-1.5 w-1.5 rounded-full bg-[#2bbf6a]" />{" "}
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

          <aside className="order-2 hidden min-w-0 space-y-4 xl:sticky xl:top-24 xl:block xl:self-start">
            {sidebarCards}
          </aside>

          <div className="order-2 min-w-0 space-y-4 xl:hidden">
            {sidebarCards}
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
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#10b981] via-[#059669] to-[#047857] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(16,185,129,0.3)] transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
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
