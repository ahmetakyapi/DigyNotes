"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Image from "next/image";
import "react-quill/dist/quill.snow.css";
import { Post } from "@/types";
import {
  FIXED_CATEGORIES,
  getCategoryLabel,
  isTravelCategory,
  normalizeCategory,
} from "@/lib/categories";
import StarRating from "@/components/StarRating";
import { getStatusOptions } from "@/components/StatusBadge";
import PlaceSearch, { PlaceResult } from "@/components/PlaceSearch";
import TagInput from "@/components/TagInput";
import { FormStatusMessage } from "@/components/FormStatusMessage";
import { PageHeader, Em, Dot } from "@/components/ui/PageHeader";
import { ArrowLeftIcon, ArrowUpRightIcon, CaretRightIcon } from "@phosphor-icons/react";
import toast from "react-hot-toast";
import { getClientErrorMessage, requestJson } from "@/lib/client-api";
import { customLoader } from "@/lib/image";
import { buildOpenStreetMapLink, formatCoordinate } from "@/lib/maps";
import { CATEGORY_EXAMPLE_TAGS, categorySupportsSpoiler } from "@/lib/post-config";
import {
  detectImagePosition,
  getPostCategoryFormConfig,
  syncPostCategoryDependentFields,
} from "@/lib/post-form";
import { stripHtml } from "@/lib/text";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

const inputBase =
  "w-full rounded-2xl border border-[var(--border)] bg-[var(--bg-raised)] px-4 py-2.5 text-[16px] sm:text-sm text-[var(--text-primary)] placeholder:text-[var(--text-faint)] transition-colors duration-200 ease-out-expo focus:outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/15 focus:bg-[var(--bg-card)]";
const labelClass =
  "mb-2 block text-[12.5px] text-[var(--text-muted)] font-medium";
const sectionClass =
  "rounded-[24px] border border-[var(--border)] bg-[var(--bg-card)] p-4 sm:p-5 xl:p-6";
const toggleCardClass =
  "flex cursor-pointer items-start gap-3 rounded-[18px] border border-[var(--border)] bg-[var(--bg-raised)] px-4 py-3 transition-colors duration-200 hover:border-accent/30";

function createEditSnapshot(input: {
  title: string;
  category: string;
  rating: number;
  status: string;
  hasSpoiler: boolean;
  lat: number | null;
  lng: number | null;
  image: string;
  content: string;
  creator: string;
  years: string;
  locationLabel: string;
  tags: string[];
  externalRating: number | null;
  imagePosition: string;
}) {
  return JSON.stringify(input);
}

export default function EditPostPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement | null>(null);
  const initialSnapshotRef = useRef("");
  const [loading, setLoading] = useState(true);
  const [originalCategory, setOriginalCategory] = useState("");

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [rating, setRating] = useState(0);
  const [status, setStatus] = useState("");
  const [hasSpoiler, setHasSpoiler] = useState(false);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [image, setImage] = useState("");
  const [content, setContent] = useState("");
  const [creator, setCreator] = useState("");
  const [years, setYears] = useState("");
  const [locationLabel, setLocationLabel] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [externalRating, setExternalRating] = useState<number | null>(null);
  const [imagePosition, setImagePosition] = useState("center");
  const [isLandscape, setIsLandscape] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const config = getPostCategoryFormConfig(category);
  const currentSnapshot = createEditSnapshot({
    title,
    category,
    rating,
    status,
    hasSpoiler,
    lat,
    lng,
    image,
    content,
    creator,
    years,
    locationLabel,
    tags,
    externalRating,
    imagePosition,
  });

  useEffect(() => {
    let cancelled = false;

    const loadPost = async () => {
      setLoading(true);
      setLoadError("");

      try {
        const post = await requestJson<Post>(
          `/api/posts/${params.id}`,
          undefined,
          "İçerik yüklenemedi."
        );

        if (cancelled) return;

        const normalizedCategory = normalizeCategory(post.category);
        const nextStatus = post.status ?? getStatusOptions(normalizedCategory)[0];
        const nextSnapshot = createEditSnapshot({
          title: post.title,
          category: normalizedCategory,
          rating: post.rating ?? 0,
          status: nextStatus,
          hasSpoiler: Boolean(post.hasSpoiler) && categorySupportsSpoiler(normalizedCategory),
          lat: post.lat ?? null,
          lng: post.lng ?? null,
          image: post.image,
          content: post.content,
          creator: post.creator ?? "",
          years: post.years ?? "",
          locationLabel: post.title,
          tags: (post.tags ?? []).map((tag) => tag.name),
          externalRating: post.externalRating ?? null,
          imagePosition: post.imagePosition ?? "center",
        });

        setTitle(post.title);
        setCategory(normalizedCategory);
        setOriginalCategory(normalizedCategory);
        setRating(post.rating ?? 0);
        setStatus(nextStatus);
        setHasSpoiler(Boolean(post.hasSpoiler) && categorySupportsSpoiler(normalizedCategory));
        setLat(post.lat ?? null);
        setLng(post.lng ?? null);
        setImage(post.image);
        setContent(post.content);
        setCreator(post.creator ?? "");
        setYears(post.years ?? "");
        setLocationLabel(post.title);
        setImagePosition(post.imagePosition ?? "center");
        setTags((post.tags ?? []).map((t) => t.name));
        setExternalRating(post.externalRating ?? null);
        initialSnapshotRef.current = nextSnapshot;
        setIsDirty(false);
      } catch (error) {
        if (!cancelled) {
          setLoadError(getClientErrorMessage(error, "İçerik yüklenemedi."));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadPost();

    return () => {
      cancelled = true;
    };
  }, [params.id]);

  useEffect(() => {
    if (loading || !initialSnapshotRef.current) return;
    setIsDirty(initialSnapshotRef.current !== currentSnapshot);
  }, [currentSnapshot, loading]);

  const confirmDiscardChanges = useCallback(() => {
    if (!isDirty || isSubmitting) return true;

    return window.confirm(
      "Kaydetmediğin değişiklikler var. Çıkarsan bunlar kaybolacak. Yine de çıkmak istiyor musun?"
    );
  }, [isDirty, isSubmitting]);

  const navigateWithDirtyCheck = useCallback(
    (navigate: () => void) => {
      if (!confirmDiscardChanges()) return;
      navigate();
    },
    [confirmDiscardChanges]
  );

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty && !isSubmitting) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty, isSubmitting]);

  // Auto-detect image position based on aspect ratio
  useEffect(() => {
    if (!image) return;
    const timer = setTimeout(() => {
      detectImagePosition(image, (pos, landscape) => {
        setImagePosition(pos);
        setIsLandscape(landscape);
      });
    }, 600);
    return () => clearTimeout(timer);
  }, [image]);

  useEffect(() => {
    if (!isDirty || isSubmitting) return;

    const handleClickCapture = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target as HTMLElement | null;
      const link = target?.closest("a[href]") as HTMLAnchorElement | null;
      if (!link) return;
      if (link.target && link.target !== "_self") return;

      const href = link.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
        return;
      }

      const nextUrl = new URL(link.href, window.location.href);
      const currentUrl = new URL(window.location.href);
      if (nextUrl.origin !== currentUrl.origin) return;
      if (nextUrl.pathname === currentUrl.pathname && nextUrl.search === currentUrl.search) return;

      if (!confirmDiscardChanges()) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    const handleSubmitCapture = (event: Event) => {
      const submittedForm = event.target as HTMLFormElement | null;
      if (!submittedForm || submittedForm === formRef.current) return;

      if (!confirmDiscardChanges()) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    const handlePopState = () => {
      if (confirmDiscardChanges()) return;
      window.history.pushState(null, "", window.location.href);
    };

    document.addEventListener("click", handleClickCapture, true);
    document.addEventListener("submit", handleSubmitCapture, true);
    window.addEventListener("popstate", handlePopState);

    return () => {
      document.removeEventListener("click", handleClickCapture, true);
      document.removeEventListener("submit", handleSubmitCapture, true);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [confirmDiscardChanges, isDirty, isSubmitting]);

  const handleCategoryChange = (cat: string) => {
    const nextFields = syncPostCategoryDependentFields(cat, {
      creator,
      hasSpoiler,
      lat,
      lng,
      locationLabel,
    });

    setCategory(cat);
    setStatus(getStatusOptions(cat)[0]);
    setHasSpoiler(nextFields.hasSpoiler);
    setCreator(nextFields.creator);
    setLat(nextFields.lat);
    setLng(nextFields.lng);
    setLocationLabel(nextFields.locationLabel);
  };

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

  const supportsSpoiler = categorySupportsSpoiler(category);
  const exampleTags = CATEGORY_EXAMPLE_TAGS[category as keyof typeof CATEGORY_EXAMPLE_TAGS] ?? [];

  const doSubmit = async () => {
    const plainContent = stripHtml(content);
    const requiredFields: string[] = [title, category, image, plainContent];
    if (config.creatorRequired) requiredFields.push(creator);
    if (config.yearsRequired) requiredFields.push(years);
    if (requiredFields.some((f) => !f.trim())) {
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
        `/api/posts/${params.id}`,
        {
          method: "PUT",
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
        "Değişiklikler kaydedilemedi."
      );
      initialSnapshotRef.current = currentSnapshot;
      setIsDirty(false);
      toast.success("Değişiklikler kaydedildi");
      navigateWithDirtyCheck(() => router.push(`/posts/${params.id}`));
    } catch (error) {
      const message = getClientErrorMessage(error, "Değişiklikler kaydedilemedi.");
      setSubmitError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = inputBase;
  const statusOptions = getStatusOptions(category);

  if (loading) {
    return (
      <div className="min-h-[calc(100dvh-3.75rem)] py-4 sm:py-6 lg:py-8">
        <div className="mx-auto max-w-[1280px] space-y-3.5 px-3.5 sm:space-y-4 sm:px-5 lg:px-6">
          <div className="mb-8 h-10 w-56 animate-pulse rounded-full bg-[var(--bg-raised)]" />
          <div className="grid gap-3.5 xl:grid-cols-[minmax(0,1.42fr)_minmax(320px,0.95fr)]">
            <div className="space-y-3.5 sm:space-y-4">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="space-y-3 rounded-[24px] border border-[var(--border)] bg-[var(--bg-card)] p-5"
                >
                  <div className="h-3 w-24 animate-pulse rounded-full bg-[var(--bg-raised)]" />
                  <div className="h-10 animate-pulse rounded-2xl bg-[var(--bg-raised)]" />
                  <div className="h-36 animate-pulse rounded-2xl bg-[var(--bg-raised)]" />
                </div>
              ))}
            </div>
            <div className="space-y-3.5 sm:space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="space-y-3 rounded-[24px] border border-[var(--border)] bg-[var(--bg-card)] p-5"
                >
                  <div className="h-3 w-20 animate-pulse rounded-full bg-[var(--bg-raised)]" />
                  <div className="h-8 animate-pulse rounded-2xl bg-[var(--bg-raised)]" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <main className="min-h-[calc(100dvh-3.75rem)] py-8">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <FormStatusMessage message={loadError} />
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex h-11 cursor-pointer items-center rounded-full border border-[var(--border)] px-5 text-sm font-medium text-[var(--text-secondary)] transition-colors duration-200 hover:border-[var(--text-muted)] hover:text-[var(--text-primary)] active:scale-95"
            >
              Geri Dön
            </button>
            <button
              type="button"
              onClick={() => router.push("/notes")}
              className="inline-flex h-11 cursor-pointer items-center rounded-full bg-[var(--gold)] px-5 text-sm font-semibold text-[var(--text-on-accent)] transition-all duration-300 ease-out-expo hover:-translate-y-0.5 hover:bg-[var(--gold-light)] active:scale-95"
            >
              Notlarıma Git
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100dvh-3.75rem)] py-4 pb-36 sm:py-6 sm:pb-32 lg:pb-28 lg:pt-8">
      <div className="mx-auto max-w-[1280px] px-3.5 sm:px-5 lg:px-6">
        {/* LAYOUT: shared editorial masthead — status badges + back link live in the action slot */}
        <PageHeader
          index="✎"
          eyebrow="Not"
          title={
            <>
              Notu <Em>Düzenle</Em>
              <Dot />
            </>
          }
          description={title ? <span className="line-clamp-1">{title}</span> : undefined}
          actions={
            <>
              <span className="hidden items-center rounded-full border border-accent/25 bg-accent/10 px-2.5 py-1 text-[12px] text-[var(--gold)] sm:inline-flex font-medium">
                Düzenleniyor
              </span>
              {isDirty && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-danger/25 bg-danger/10 px-2.5 py-1 text-[12px] text-danger font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--danger)]" />
                  Kaydedilmedi
                </span>
              )}
              <button
                type="button"
                onClick={() =>
                  navigateWithDirtyCheck(() =>
                    router.push(`/category/${encodeURIComponent(originalCategory)}`)
                  )
                }
                className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full border border-[var(--border)] px-3.5 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors duration-200 ease-out-expo hover:border-[var(--text-primary)] hover:text-[var(--text-primary)] active:scale-95"
              >
                <ArrowLeftIcon size={12} weight="bold" />
                {originalCategory ? getCategoryLabel(originalCategory) : "Geri"}
              </button>
            </>
          }
        />

        {submitError && (
          <div className="mb-4">
            <FormStatusMessage message={submitError} />
          </div>
        )}

        <form
          ref={formRef}
          className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.42fr)_minmax(300px,0.9fr)] lg:gap-5"
        >
          {/* ── Sol kolon: meta + etiketler + içerik ── */}
          <div className="min-w-0 space-y-4 lg:space-y-5">
            <div className={sectionClass}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className={labelClass}>Başlık</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <label className={labelClass}>Kategori</label>
                  <select
                    value={category}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className={inputClass}
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
                    className={inputClass}
                  >
                    {statusOptions.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                {config.showCreator && (
                  <div>
                    <label className={labelClass}>
                      {config.creatorLabel}
                      {config.creatorRequired && <span className="ml-1 text-danger">*</span>}
                    </label>
                    <input
                      type="text"
                      value={creator}
                      onChange={(e) => setCreator(e.target.value)}
                      className={inputClass}
                      placeholder="—"
                      required={config.creatorRequired}
                    />
                  </div>
                )}
                <div className={config.showCreator ? "" : "sm:col-span-2"}>
                  <label className={labelClass}>
                    {config.yearsLabel}
                    {config.yearsRequired && <span className="ml-1 text-danger">*</span>}
                  </label>
                  <input
                    type="text"
                    value={years}
                    onChange={(e) => setYears(e.target.value)}
                    className={inputClass}
                    placeholder={config.yearsPlaceholder}
                    required={config.yearsRequired}
                  />
                </div>
                {isTravelCategory(category) && (
                  <div className="rounded-[20px] border border-[var(--border)] bg-[var(--bg-raised)] p-4 sm:col-span-2">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className={labelClass}>Konum</p>
                        <p className="-mt-1 text-[12px] leading-5 text-[var(--text-muted)]">
                          Notunun haritada doğru yerde görünmesi için konumu seç.
                        </p>
                      </div>
                      {typeof lat === "number" && typeof lng === "number" && (
                        <a
                          href={buildOpenStreetMapLink(lat, lng)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--bg-card)] px-3.5 py-1.5 text-[11.5px] font-medium text-[var(--text-secondary)] transition-colors duration-200 hover:border-accent/40 hover:text-[var(--text-primary)] active:scale-95"
                        >
                          Haritada Aç
                          <ArrowUpRightIcon size={11} weight="bold" />
                        </a>
                      )}
                    </div>
                    <PlaceSearch onSelect={handlePlaceSelect} />
                    <div className="mt-3 rounded-2xl border border-dashed border-[var(--border)] px-4 py-3 text-xs text-[var(--text-muted)]">
                      {typeof lat === "number" && typeof lng === "number" ? (
                        <div className="space-y-1.5">
                          <p className="font-medium text-[var(--text-secondary)]">
                            {locationLabel || title || "Konum seçildi"}
                          </p>
                          <p className="dn-mono text-[11px] tracking-[0.04em]">
                            {formatCoordinate(lat)}, {formatCoordinate(lng)}
                          </p>
                        </div>
                      ) : (
                        <p>Bu gezi notunda henüz kayıtlı bir konum yok.</p>
                      )}
                    </div>
                  </div>
                )}
                <div className="sm:col-span-2">
                  <label className={labelClass}>Etiketler</label>
                  <div className="mb-3 flex flex-wrap gap-1.5">
                    {exampleTags.map((tagName) => {
                      const isAdded = tags.includes(tagName);
                      return (
                        <button
                          key={tagName}
                          type="button"
                          onClick={() => {
                            if (isAdded || tags.length >= 10) return;
                            setTags((prev) => [...prev, tagName]);
                          }}
                          disabled={isAdded || tags.length >= 10}
                          className={`cursor-pointer rounded-full border px-2.5 py-1 text-[11.5px] font-medium transition-colors duration-200 ease-out-expo active:scale-95 disabled:cursor-default disabled:opacity-40 ${
                            isAdded
                              ? "border-accent/40 bg-accent/10 text-accent"
                              : "border-[var(--border)] text-[var(--text-secondary)] hover:border-accent/40 hover:text-accent"
                          }`}
                        >
                          #{tagName}
                        </button>
                      );
                    })}
                  </div>
                  <TagInput value={tags} onChange={setTags} />
                </div>
              </div>
            </div>

            <div className={sectionClass}>
              <label className={labelClass}>İçerik</label>
              <div className="dn-compose-editor overflow-hidden rounded-2xl border border-[var(--border)]">
                <ReactQuill theme="snow" value={content} onChange={setContent} />
              </div>
            </div>
          </div>

          {/* ── Sağ kolon: özet, kapak, puan — lg+ sidebar, mobilde collapsible ── */}
          <aside className="hidden min-w-0 space-y-4 lg:block lg:space-y-5">
            <div className={sectionClass}>
              <p className={labelClass}>
                <span className="text-[var(--gold)]">(✎)</span> Düzenleme Özeti
              </p>
              <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-[18px] border border-[var(--border)] bg-[var(--border)]">
                <div className="min-w-0 bg-[var(--bg-raised)] px-3 py-3">
                  <dt className="text-[11px] text-[var(--text-muted)] font-medium">
                    Kategori
                  </dt>
                  <dd className="mt-1 truncate text-sm font-semibold text-[var(--text-primary)]">
                    {category ? getCategoryLabel(category) : "-"}
                  </dd>
                </div>
                <div className="min-w-0 bg-[var(--bg-raised)] px-3 py-3">
                  <dt className="text-[11px] text-[var(--text-muted)] font-medium">
                    Durum
                  </dt>
                  <dd className="mt-1 truncate text-sm font-semibold text-[var(--text-primary)]">
                    {status || "-"}
                  </dd>
                </div>
                <div className="min-w-0 bg-[var(--bg-raised)] px-3 py-3">
                  <dt className="text-[11px] text-[var(--text-muted)] font-medium">
                    Puan
                  </dt>
                  <dd className="dn-display mt-0.5 text-xl italic leading-tight text-[var(--text-primary)]">
                    {rating > 0 ? `${rating} / 5` : "Yok"}
                  </dd>
                </div>
              </dl>
            </div>

            <div className={sectionClass}>
              <label className={labelClass}>Kapak Görseli URL</label>
              <input
                type="url"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                className={inputClass}
              />
              {image && (
                <div className="mt-3 overflow-hidden rounded-[20px] border border-[var(--border-subtle)] bg-[var(--media-panel-bg)] shadow-[var(--shadow-soft)]">
                  <div className="relative h-36 w-full sm:h-48 lg:h-52 xl:h-56">
                    <Image
                      loader={customLoader}
                      src={image}
                      alt=""
                      fill
                      aria-hidden
                      className="scale-105 object-cover opacity-55 blur-2xl"
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
                              filter: "drop-shadow(0 16px 24px rgb(var(--ink-rgb) / 0.35))",
                            }
                      }
                    />
                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          "linear-gradient(180deg, var(--media-overlay-soft) 0%, var(--media-overlay-mid) 60%, var(--media-overlay-strong) 100%)",
                      }}
                    />
                    <span className="absolute left-3 top-3 rounded-full border border-accent/30 bg-[var(--bg-overlay)] px-2.5 py-1 text-[11px] text-[var(--gold)] backdrop-blur-md font-medium">
                      Kapak Önizleme
                    </span>
                    <span className="absolute bottom-3 right-3 rounded-full border border-[var(--media-control-border)] bg-[var(--media-control-bg)] px-2.5 py-1 text-[11px] text-[var(--media-control-text)] backdrop-blur-sm font-medium">
                      {isLandscape ? "Yatay Görsel" : "Dikey Görsel"}
                    </span>
                  </div>
                  <div className="border-t border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-3">
                    <p className="text-[12px] text-[var(--text-secondary)]">
                      {isLandscape
                        ? "Yatay görsel, üst kısmı gösteriliyor."
                        : "Dikey görsel, ortası gösteriliyor."}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className={sectionClass}>
              <label className={labelClass}>Puan</label>
              <div className="mt-1 flex flex-wrap items-center gap-3">
                <StarRating rating={rating} interactive onRate={setRating} size={24} />
                <span className="text-[12.5px] text-[var(--text-secondary)] font-medium">
                  {rating > 0 ? `${rating} / 5` : "Henüz puanlanmadı"}
                </span>
                {rating > 0 && (
                  <button
                    type="button"
                    onClick={() => setRating(0)}
                    className="cursor-pointer rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--text-muted)] transition-colors duration-200 hover:border-danger/30 hover:text-danger active:scale-95"
                  >
                    Sıfırla
                  </button>
                )}
              </div>
            </div>

            {supportsSpoiler && (
              <div className={sectionClass}>
                <p className={labelClass}>Yayın Ayarları</p>
                <label className={toggleCardClass}>
                  <input
                    type="checkbox"
                    checked={hasSpoiler}
                    onChange={(e) => setHasSpoiler(e.target.checked)}
                    className="mt-0.5 h-4 w-4 cursor-pointer rounded border-[var(--border)] accent-accent"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-[var(--text-primary)]">
                      Spoiler Uyarısı Ekle
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-[var(--text-muted)]">
                      Okuyanlar notu açmadan önce bir uyarı görür.
                    </span>
                  </span>
                </label>
              </div>
            )}
          </aside>

          {/* ── Mobil sidebar: collapsible ── */}
          <details className="group min-w-0 lg:hidden">
            <summary className="flex cursor-pointer list-none items-center gap-2.5 rounded-full border border-[var(--border)] bg-[var(--bg-card)] px-5 py-3 text-sm font-medium text-[var(--text-secondary)] transition-colors duration-200 hover:text-[var(--text-primary)] [&::-webkit-details-marker]:hidden">
              <CaretRightIcon
                size={14}
                weight="bold"
                className="transition-transform duration-300 ease-out-expo group-open:rotate-90"
              />
              Kapak, Puan ve Ayarlar
              {rating > 0 && (
                <span className="ml-auto text-[12.5px] text-[var(--gold)] font-medium">
                  {rating}/5
                </span>
              )}
            </summary>
            <div className="mt-3 space-y-4">
              <div className={sectionClass}>
                <label className={labelClass}>Kapak Görseli URL</label>
                <input
                  type="url"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className={inputBase}
                />
              </div>
              <div className={sectionClass}>
                <label className={labelClass}>Puan</label>
                <div className="mt-1 flex flex-wrap items-center gap-3">
                  <StarRating rating={rating} interactive onRate={setRating} size={24} />
                  <span className="text-[12.5px] text-[var(--text-secondary)] font-medium">
                    {rating > 0 ? `${rating} / 5` : "Henüz puanlanmadı"}
                  </span>
                  {rating > 0 && (
                    <button
                      type="button"
                      onClick={() => setRating(0)}
                      className="cursor-pointer rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--text-muted)] transition-colors duration-200 hover:border-danger/30 hover:text-danger active:scale-95"
                    >
                      Sıfırla
                    </button>
                  )}
                </div>
              </div>
              {supportsSpoiler && (
                <div className={sectionClass}>
                  <label className={toggleCardClass}>
                    <input
                      type="checkbox"
                      checked={hasSpoiler}
                      onChange={(e) => setHasSpoiler(e.target.checked)}
                      className="mt-0.5 h-4 w-4 cursor-pointer rounded border-[var(--border)] accent-accent"
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-[var(--text-primary)]">
                        Spoiler Uyarısı Ekle
                      </span>
                    </span>
                  </label>
                </div>
              )}
            </div>
          </details>
        </form>
      </div>

      {/* LAYOUT: floating glass pill action bar (matches /new-post) — context left, cancel/save right */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-3 pb-3 sm:px-5 sm:pb-5">
        <div className="pointer-events-auto mx-auto flex max-w-[1080px] items-center justify-between gap-3 rounded-full border border-[var(--border)] bg-[var(--header-glass)] py-2 pl-5 pr-2 shadow-[var(--shadow-soft)] backdrop-blur-xl">
          <div className="min-w-0">
            <p className="dn-eyebrow flex items-center gap-1.5">
              <span className="text-[var(--gold)]">(✎)</span> Düzenleniyor
              {isDirty && (
                <span className="inline-flex items-center gap-1 text-danger">
                  · <span className="h-1.5 w-1.5 rounded-full bg-danger" />
                  <span className="hidden sm:inline">Kaydedilmedi</span>
                </span>
              )}
            </p>
            {title ? (
              <p className="max-w-[130px] truncate text-sm text-[var(--text-secondary)] sm:max-w-xs">
                {title}
              </p>
            ) : (
              <p className="text-sm italic text-[var(--text-muted)]">—</p>
            )}
          </div>
          <div className="flex flex-shrink-0 items-center gap-1 sm:gap-1.5">
            <button
              type="button"
              onClick={() => navigateWithDirtyCheck(() => router.back())}
              className="cursor-pointer rounded-full px-3 py-2 text-sm text-[var(--text-muted)] transition-colors duration-200 ease-out-expo hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)] active:scale-95 sm:px-3.5"
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
                <>
                  {isDirty && (
                    <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--text-on-accent)] opacity-60" />
                  )}
                  <span className="sm:hidden">Kaydet</span>
                  <span className="hidden sm:inline">Değişiklikleri Kaydet</span>
                </>
              )}
            </button>
          </div>
        </div>
        <div className="sm:hidden" style={{ height: "env(safe-area-inset-bottom, 0px)" }} />
      </div>
    </main>
  );
}
