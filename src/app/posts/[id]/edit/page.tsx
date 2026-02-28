"use client";
import React, { useEffect, useState } from "react";
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
import toast from "react-hot-toast";
import { ClientApiError, getClientErrorMessage, requestJson } from "@/lib/client-api";
import { buildOpenStreetMapLink, formatCoordinate } from "@/lib/maps";
import { CATEGORY_EXAMPLE_TAGS, categorySupportsSpoiler } from "@/lib/post-config";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });
const customLoader = ({ src }: { src: string }) => src;

const inputBase =
  "w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-all focus:outline-none focus:border-[var(--gold)] focus:ring-1 focus:ring-[#c4a24b]/20";
const labelClass =
  "block text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)] mb-2";
const sectionClass =
  "rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-3.5 sm:p-4 xl:p-5";

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
    yearsPlaceholder: "2020-2023",
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

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, "").trim();
}

export default function EditPostPage({ params }: { params: { id: string } }) {
  const router = useRouter();
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
  const config = CATEGORY_CONFIG[category] ?? CATEGORY_CONFIG["other"];

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
        setTitle(post.title);
        setCategory(normalizedCategory);
        setOriginalCategory(normalizedCategory);
        setRating(post.rating ?? 0);
        setStatus(post.status ?? getStatusOptions(normalizedCategory)[0]);
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
    markDirty();
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
    markDirty();
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
      setIsDirty(false);
      toast.success("Değişiklikler kaydedildi!");
      router.push(`/posts/${params.id}`);
    } catch (error) {
      const message = getClientErrorMessage(error, "Değişiklikler kaydedilemedi.");
      setSubmitError(message);
      toast.error(message);

      if (error instanceof ClientApiError && error.status === 401) {
        router.push("/login");
      }
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
          <div className="mb-8 h-8 w-48 animate-pulse rounded-lg bg-[var(--bg-raised)]" />
          <div className="grid gap-3.5 xl:grid-cols-[minmax(0,1.42fr)_minmax(320px,0.95fr)]">
            <div className="space-y-3.5 sm:space-y-4">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5"
                >
                  <div className="h-3 w-24 animate-pulse rounded bg-[var(--bg-raised)]" />
                  <div className="h-10 animate-pulse rounded-lg bg-[var(--bg-raised)]" />
                  <div className="h-36 animate-pulse rounded-lg bg-[var(--bg-raised)]" />
                </div>
              ))}
            </div>
            <div className="space-y-3.5 sm:space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5"
                >
                  <div className="h-3 w-20 animate-pulse rounded bg-[var(--bg-raised)]" />
                  <div className="h-8 animate-pulse rounded-lg bg-[var(--bg-raised)]" />
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
              className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2 text-sm font-semibold text-[var(--text-secondary)]"
            >
              Geri dön
            </button>
            <button
              type="button"
              onClick={() => router.push("/notes")}
              className="rounded-lg bg-[var(--gold)] px-4 py-2 text-sm font-semibold text-[var(--text-on-accent)]"
            >
              Notlara git
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100dvh-3.75rem)] py-4 pb-36 sm:py-6 sm:pb-32 lg:pb-28 lg:pt-8">
      <div className="mx-auto max-w-[1280px] px-3.5 sm:px-5 lg:px-6">
        {/* Page header */}
        <div className="mb-5 border-b border-[var(--border)] pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-[var(--text-primary)]">Yazıyı Düzenle</h1>
                <span className="inline-flex items-center rounded-full border border-[#c4a24b]/25 bg-[#c4a24b]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--gold)]">
                  Düzenleniyor
                </span>
                {isDirty && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-[#e53e3e]/25 bg-[#e53e3e]/10 px-2 py-0.5 text-[10px] font-semibold text-[#e53e3e]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#e53e3e]" />
                    Kaydedilmedi
                  </span>
                )}
              </div>
              {title && (
                <p className="max-w-xs truncate text-sm text-[var(--text-muted)]">{title}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => router.push(`/category/${encodeURIComponent(originalCategory)}`)}
              className="flex-shrink-0 whitespace-nowrap text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--gold)]"
            >
              ← {originalCategory ? getCategoryLabel(originalCategory) : "Geri"}
            </button>
          </div>
        </div>

        {submitError && (
          <div className="mb-4">
            <FormStatusMessage message={submitError} />
          </div>
        )}

        <form className="grid items-start gap-3.5 xl:grid-cols-[minmax(0,1.42fr)_minmax(320px,0.95fr)]">
          {/* ── Sol kolon: meta + etiketler + içerik ── */}
          <div className="min-w-0 space-y-3.5 sm:space-y-4">
            <div className={sectionClass}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className={labelClass}>Başlık</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      markDirty();
                    }}
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
                    onChange={(e) => {
                      setStatus(e.target.value);
                      markDirty();
                    }}
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
                      {config.creatorRequired && <span className="ml-1 text-[#e53e3e]">*</span>}
                    </label>
                    <input
                      type="text"
                      value={creator}
                      onChange={(e) => {
                        setCreator(e.target.value);
                        markDirty();
                      }}
                      className={inputClass}
                      placeholder="—"
                      required={config.creatorRequired}
                    />
                  </div>
                )}
                <div className={config.showCreator ? "" : "sm:col-span-2"}>
                  <label className={labelClass}>
                    {config.yearsLabel}
                    {config.yearsRequired && <span className="ml-1 text-[#e53e3e]">*</span>}
                  </label>
                  <input
                    type="text"
                    value={years}
                    onChange={(e) => {
                      setYears(e.target.value);
                      markDirty();
                    }}
                    className={inputClass}
                    placeholder={config.yearsPlaceholder}
                    required={config.yearsRequired}
                  />
                </div>
                {isTravelCategory(category) && (
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-raised)] p-3.5 sm:col-span-2">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className={labelClass}>Konum</p>
                        <p className="-mt-1 text-[11px] leading-5 text-[var(--text-muted)]">
                          Harita görünümü için konumu güncelle.
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
                        <p>Bu gezi notunda henüz kayıtlı bir konum yok.</p>
                      )}
                    </div>
                  </div>
                )}
                <div className="sm:col-span-2">
                  <label className={labelClass}>Etiketler</label>
                  <div className="mb-2.5 flex flex-wrap gap-1.5">
                    {exampleTags.map((tagName) => {
                      const isAdded = tags.includes(tagName);
                      return (
                        <button
                          key={tagName}
                          type="button"
                          onClick={() => {
                            if (isAdded || tags.length >= 10) return;
                            setTags((prev) => [...prev, tagName]);
                            markDirty();
                          }}
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
                  <TagInput
                    value={tags}
                    onChange={(t) => {
                      setTags(t);
                      markDirty();
                    }}
                  />
                </div>
              </div>
            </div>

            <div className={sectionClass}>
              <label className={labelClass}>İçerik</label>
              <div className="dn-compose-editor overflow-hidden rounded-lg border border-[var(--border)]">
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

          {/* ── Sağ kolon: özet, kapak, puan, etiketler ── */}
          <aside className="min-w-0 space-y-3.5 sm:space-y-4">
            <div className={sectionClass}>
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                Düzenleme Özeti
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
                <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-raised)] px-2.5 py-2">
                  <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                    Kategori
                  </p>
                  <p className="mt-0.5 truncate text-sm font-semibold text-[var(--text-primary)]">
                    {category ? getCategoryLabel(category) : "-"}
                  </p>
                </div>
                <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-raised)] px-2.5 py-2">
                  <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                    Durum
                  </p>
                  <p className="mt-0.5 truncate text-sm font-semibold text-[var(--text-primary)]">
                    {status || "-"}
                  </p>
                </div>
                <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-raised)] px-2.5 py-2">
                  <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                    Puan
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-[var(--text-primary)]">
                    {rating > 0 ? `${rating} / 5` : "Yok"}
                  </p>
                </div>
              </div>
            </div>

            <div className={sectionClass}>
              <label className={labelClass}>Kapak Görseli URL</label>
              <input
                type="url"
                value={image}
                onChange={(e) => {
                  setImage(e.target.value);
                  markDirty();
                }}
                className={inputClass}
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
              <label className={labelClass}>Puan</label>
              <div className="mt-1 flex flex-wrap items-center gap-3">
                <StarRating
                  rating={rating}
                  interactive
                  onRate={(r) => {
                    setRating(r);
                    markDirty();
                  }}
                  size={24}
                />
                <span className="text-sm text-[var(--text-secondary)]">
                  {rating > 0 ? `${rating} / 5` : "Henüz puanlanmadı"}
                </span>
                {rating > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setRating(0);
                      markDirty();
                    }}
                    className="text-xs text-[var(--text-muted)] transition-colors hover:text-[#e53e3e]"
                  >
                    Sıfırla
                  </button>
                )}
              </div>
            </div>

            {supportsSpoiler && (
              <div className={sectionClass}>
                <p className={labelClass}>Yayın Ayarları</p>
                <label className="hover:border-[var(--gold)]/30 flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-raised)] px-3.5 py-3 transition-colors">
                  <input
                    type="checkbox"
                    checked={hasSpoiler}
                    onChange={(e) => {
                      setHasSpoiler(e.target.checked);
                      markDirty();
                    }}
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

      {/* ─── Sticky Save Bar ─── */}
      <div className="bg-[var(--bg-base)]/95 fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-2.5 px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5 lg:px-6">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
              Düzenleniyor
            </p>
            {title ? (
              <p className="max-w-[200px] truncate text-sm text-[var(--text-secondary)] sm:max-w-xs">
                {title}
              </p>
            ) : (
              <p className="text-sm italic text-[var(--text-muted)]">—</p>
            )}
          </div>
          <div className="flex w-full flex-shrink-0 items-center gap-2 sm:w-auto">
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
        <div className="sm:hidden" style={{ height: "env(safe-area-inset-bottom, 0px)" }} />
      </div>
    </main>
  );
}
