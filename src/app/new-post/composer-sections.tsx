"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { CaretDownIcon, InfoIcon } from "@phosphor-icons/react";
import { MediaSearch } from "@/components/MediaSearch";
import PlaceSearch, { PlaceResult } from "@/components/PlaceSearch";
import {
  FIXED_CATEGORIES,
  getCategoryLabel,
  isTravelCategory,
  type SearchTabKey,
} from "@/lib/categories";
import { buildOpenStreetMapLink, formatCoordinate } from "@/lib/maps";
import type { PostComposerGuidance } from "@/lib/post-config";
import type { PostCategoryFormConfig } from "@/lib/post-form";
import { getTemplateSignature } from "@/lib/post-templates";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

const inputBase =
  "w-full rounded-xl border border-[var(--border)] bg-[var(--bg-raised)] px-3.5 py-2.5 text-[16px] sm:text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors duration-200 ease-out-expo focus:outline-none focus:border-[var(--text-primary)] focus:bg-[var(--bg-card)]";
const labelClass =
  "mb-2 block text-[12.5px] text-[var(--text-muted)] font-medium";
const cardClass = "rounded-[24px] border border-[var(--border)] bg-[var(--bg-card)] p-5 sm:p-6";
const helperTextClass = "mt-2 text-[11px] leading-5 text-[var(--text-muted)]";

/* LAYOUT: mono step index "01 — Label" with a short hairline, used atop every composer card */
function StepLabel({ index, label }: { readonly index: string; readonly label: string }) {
  return (
    <p className="flex items-center gap-2 text-[12.5px] text-[var(--text-muted)] font-medium">
      <span className="text-[var(--gold)]">{index}</span>
      <span className="h-px w-4 bg-[var(--border)]" />
      {label}
    </p>
  );
}

function flashClass(flashed: boolean) {
  return flashed ? "ring-2 ring-accent/40 border-accent/50" : "";
}

function ic(flashFields: Set<string>, field: string) {
  return `${inputBase} ${flashClass(flashFields.has(field))}`;
}

/* ─────────────────────── Category & Search Section ─────────────────────── */

interface MediaSelectResult {
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
}

interface CategorySearchSectionProps {
  readonly category: string;
  readonly supportsAutofill: boolean;
  readonly guidance: PostComposerGuidance;
  readonly lockedSearchTab: SearchTabKey | undefined;
  readonly autofillDone: boolean;
  readonly isTravelCat: boolean;
  readonly title: string;
  readonly flashFields: Set<string>;
  readonly completedStepCount: number;
  readonly nextActionText: string;
  readonly onCategoryChange: (cat: string) => void;
  readonly onMediaSelect: (result: MediaSelectResult) => void;
  readonly onTitleChange: (v: string) => void;
}

export function CategorySearchSection({
  category,
  supportsAutofill,
  guidance,
  lockedSearchTab,
  autofillDone,
  isTravelCat,
  title,
  flashFields,
  completedStepCount,
  nextActionText,
  onCategoryChange,
  onMediaSelect,
  onTitleChange,
}: CategorySearchSectionProps) {
  const [guidanceOpen, setGuidanceOpen] = useState(false);

  const searchHint = (() => {
    if (autofillDone) return "Bilgiler doldu. Aşağıda başlığı ve durumu kontrol etmen yeterli.";
    if (isTravelCat) return "Yeri seçersen notun haritada da görünür.";
    return "Arama işini hızlandırır ama şart değil; istersen bir şey seçmeden de devam edebilirsin.";
  })();

  return (
    <section className={`${cardClass} overflow-hidden`}>
      <div className="flex flex-col gap-4">
        <StepLabel index="01" label="Kategori ve Arama" />
        {/* ── Compact guidance bar (collapsed by default) ── */}
        <div>
          <button
            type="button"
            onClick={() => setGuidanceOpen((prev) => !prev)}
            className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-full px-1 py-1 text-left transition-colors duration-200 ease-out-expo hover:bg-[var(--bg-raised)]"
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <InfoIcon size={16} weight="bold" className="shrink-0 text-[var(--gold)]" />
              <span className="truncate text-base font-semibold tracking-[-0.01em] text-[var(--text-primary)]">
                {supportsAutofill ? guidance.searchTitle : "Başlıkla Başla"}
              </span>
              <span className="dn-mono shrink-0 rounded-full border border-[var(--border)] bg-[var(--bg-raised)] px-2 py-0.5 text-[12px] text-[var(--text-muted)]">
                {completedStepCount}/4
              </span>
              <span className="hidden shrink-0 rounded-full border border-accent/25 bg-accent/10 px-2.5 py-0.5 text-[12px] font-medium text-[var(--gold)] sm:inline">
                {nextActionText}
              </span>
            </div>
            <CaretDownIcon
              size={14}
              weight="bold"
              className={`shrink-0 text-[var(--text-muted)] transition-transform duration-200 ${guidanceOpen ? "rotate-180" : ""}`}
            />
          </button>

          {guidanceOpen && (
            <div className="mt-3 border-l-2 border-accent/60 pl-4 text-sm leading-6 text-[var(--text-secondary)]">
              {supportsAutofill
                ? "Önce kategoriyi seç ve ara. Bir sonucu seçince bilgiler dolar; sonra aşağıda başlığı ve durumu kontrol et."
                : guidance.manualHint}
            </div>
          )}
        </div>

        {/* ── Category + Search / Title input ── */}
        <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
          <div className="rounded-[18px] border border-[var(--border)] bg-[var(--bg-base)] p-4">
            <label htmlFor="np-category" className={labelClass}>
              Kategori
            </label>
            <select
              id="np-category"
              value={category}
              onChange={(event) => onCategoryChange(event.target.value)}
              className={ic(flashFields, "category")}
            >
              {FIXED_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {getCategoryLabel(cat)}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-[18px] border border-[var(--border)] bg-[var(--bg-base)] p-4">
            {supportsAutofill ? (
              <>
                <MediaSearch
                  category={category}
                  lockedTab={lockedSearchTab}
                  onSelect={onMediaSelect}
                />
                <p className="mt-3 text-[11px] leading-5 text-[var(--text-muted)]">{searchHint}</p>
              </>
            ) : (
              <>
                <input
                  type="text"
                  value={title}
                  onChange={(event) => onTitleChange(event.target.value)}
                  className={ic(flashFields, "title")}
                  placeholder={guidance.titlePlaceholder}
                />
                <p className={helperTextClass}>
                  {title
                    ? "Başlık tamam. Şimdi aşağıdaki alanları doldurabilirsin."
                    : guidance.titleHint}
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────── Fields Section (Step 3) ─────────────────────── */

interface FieldsSectionProps {
  readonly supportsAutofill: boolean;
  readonly title: string;
  readonly status: string;
  readonly creator: string;
  readonly years: string;
  readonly category: string;
  readonly config: PostCategoryFormConfig;
  readonly guidance: PostComposerGuidance;
  readonly statusOptions: string[];
  readonly flashFields: Set<string>;
  readonly lat: number | null;
  readonly lng: number | null;
  readonly locationLabel: string;
  readonly hasLocation: boolean;
  readonly onTitleChange: (v: string) => void;
  readonly onStatusChange: (v: string) => void;
  readonly onCreatorChange: (v: string) => void;
  readonly onYearsChange: (v: string) => void;
  readonly onPlaceSelect: (place: PlaceResult) => void;
}

export function FieldsSection({
  supportsAutofill,
  title,
  status,
  creator,
  years,
  category,
  config,
  guidance,
  statusOptions,
  flashFields,
  lat,
  lng,
  locationLabel,
  hasLocation,
  onTitleChange,
  onStatusChange,
  onCreatorChange,
  onYearsChange,
  onPlaceSelect,
}: FieldsSectionProps) {
  const creatorHelperText = (() => {
    if (creator) return `${config.creatorLabel} bilgisi notunda görünecek.`;
    return config.creatorRequired
      ? `${config.creatorLabel} bilgisi zorunlu.`
      : `${config.creatorLabel} bilgisi isteğe bağlı.`;
  })();

  const yearsHelperText = (() => {
    if (years) return `${config.yearsLabel} bilgisi notunda görünecek.`;
    return config.yearsRequired
      ? `${config.yearsLabel} bilgisi zorunlu.`
      : `${config.yearsLabel} bilgisi isteğe bağlı, boş bırakabilirsin.`;
  })();

  return (
    <div className={cardClass}>
      <div className="flex flex-col gap-2">
        <StepLabel index="02" label="Bilgiler" />
        <h3 className="text-xl font-bold tracking-[-0.02em] text-[var(--text-primary)]">
          {supportsAutofill ? "Başlığı ve Durumu Kontrol Et" : "Durumu ve Diğer Bilgileri Gir"}
        </h3>
      </div>

      {supportsAutofill && (
        <div className="mt-4">
          <label htmlFor="np-title" className={labelClass}>
            Başlık
          </label>
          <input
            id="np-title"
            type="text"
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            className={ic(flashFields, "title")}
            placeholder={guidance.titlePlaceholder}
          />
          <p className={helperTextClass}>
            {title ? "İstersen başlığı kendi zevkine göre değiştirebilirsin." : guidance.titleHint}
          </p>
        </div>
      )}

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,0.8fr)_1fr_1fr]">
        <div>
          <label htmlFor="np-status" className={labelClass}>
            Durum
          </label>
          <select
            id="np-status"
            value={status}
            onChange={(event) => onStatusChange(event.target.value)}
            className={ic(flashFields, "status")}
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
            <label htmlFor="np-creator" className={labelClass}>
              {config.creatorLabel}
              {config.creatorRequired && <span className="ml-1 text-[var(--danger)]">*</span>}
            </label>
            <input
              id="np-creator"
              type="text"
              value={creator}
              onChange={(event) => onCreatorChange(event.target.value)}
              className={ic(flashFields, "creator")}
              placeholder="—"
            />
            <p className={helperTextClass}>{creatorHelperText}</p>
          </div>
        )}

        <div className={config.showCreator ? "" : "lg:col-span-2"}>
          <label htmlFor="np-years" className={labelClass}>
            {config.yearsLabel}
            {config.yearsRequired && <span className="ml-1 text-[var(--danger)]">*</span>}
          </label>
          <input
            id="np-years"
            type="text"
            value={years}
            onChange={(event) => onYearsChange(event.target.value)}
            className={ic(flashFields, "years")}
            placeholder={config.yearsPlaceholder}
          />
          <p className={helperTextClass}>{yearsHelperText}</p>
        </div>
      </div>

      {isTravelCategory(category) && (
        <LocationBlock
          guidance={guidance}
          lat={lat}
          lng={lng}
          locationLabel={locationLabel}
          title={title}
          hasLocation={hasLocation}
          onPlaceSelect={onPlaceSelect}
        />
      )}
    </div>
  );
}

/* ── Location sub-block ── */

function LocationBlock({
  guidance,
  lat,
  lng,
  locationLabel,
  title,
  hasLocation,
  onPlaceSelect,
}: {
  readonly guidance: PostComposerGuidance;
  readonly lat: number | null;
  readonly lng: number | null;
  readonly locationLabel: string;
  readonly title: string;
  readonly hasLocation: boolean;
  readonly onPlaceSelect: (place: PlaceResult) => void;
}) {
  return (
    <div className="mt-5 rounded-[18px] border border-[var(--border)] bg-[var(--bg-raised)] p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className={labelClass}>Konum</p>
          <p className="-mt-1 text-[11px] leading-5 text-[var(--text-muted)]">
            {guidance.locationHint}
          </p>
        </div>
        {hasLocation && lat != null && lng != null && (
          <a
            href={buildOpenStreetMapLink(lat, lng)}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-[var(--border)] bg-[var(--bg-card)] px-3.5 py-1.5 text-[11px] font-medium text-[var(--text-secondary)] transition-colors duration-200 ease-out-expo hover:border-[var(--text-primary)] hover:text-[var(--text-primary)]"
          >
            Haritada Aç
          </a>
        )}
      </div>
      <PlaceSearch onSelect={onPlaceSelect} />
      <div className="mt-3 rounded-xl border border-dashed border-[var(--border)] px-3 py-2.5 text-xs text-[var(--text-muted)]">
        {hasLocation && lat != null && lng != null ? (
          <div className="space-y-1.5">
            <p className="font-medium text-[var(--text-secondary)]">
              {locationLabel || title || "Konum seçildi"}
            </p>
            <p>
              {formatCoordinate(lat)}, {formatCoordinate(lng)}
            </p>
          </div>
        ) : (
          <p>{guidance.locationHint}</p>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────── Content Section (Step 4) ─────────────────────── */

interface ContentSectionProps {
  readonly content: string;
  readonly plainContent: string;
  readonly activeTemplate: { html: string; description: string } | null;
  readonly isTemplateActive: boolean;
  readonly category: string;
  readonly guidance: PostComposerGuidance;
  readonly onContentChange: (v: string) => void;
  readonly onApplyTemplate: (cat: string, opts?: { force?: boolean }) => void;
}

export function ContentSection({
  content,
  plainContent,
  activeTemplate,
  isTemplateActive,
  category,
  guidance,
  onContentChange,
  onApplyTemplate,
}: ContentSectionProps) {
  const contentHelperText = (() => {
    if (isTemplateActive) return guidance.contentTemplateHint;
    if (plainContent) return guidance.contentHint;
    return "Neden not aldığını anlatan tek bir cümle bile yeterli.";
  })();

  return (
    <div className={cardClass}>
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <StepLabel index="03" label="İçerik" />
          <label
            htmlFor="np-content"
            className="text-xl font-bold tracking-[-0.02em] text-[var(--text-primary)]"
          >
            Kendi Sözlerinle Yaz
          </label>
          <p className="text-[11px] leading-5 text-[var(--text-muted)]">
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
                !globalThis.confirm(
                  "Yazdıkların şablonla değiştirilecek. Devam etmek istiyor musun?"
                )
              ) {
                return;
              }
              onApplyTemplate(category, { force: true });
            }}
            className={`inline-flex shrink-0 cursor-pointer items-center self-start rounded-full border px-3.5 py-1.5 text-[11px] font-medium transition-colors duration-200 ease-out-expo active:scale-95 ${
              isTemplateActive
                ? "border-accent/35 bg-accent/10 text-[var(--gold)]"
                : "border-[var(--border)] bg-[var(--bg-raised)] text-[var(--text-secondary)] hover:border-accent/30 hover:text-[var(--text-primary)]"
            }`}
          >
            {isTemplateActive ? "Şablon Kullanılıyor" : "Şablonu Kullan"}
          </button>
        )}
      </div>
      <div className="dn-compose-editor mt-1 overflow-hidden rounded-[18px] border border-[var(--border)]">
        <ReactQuill id="np-content" theme="snow" value={content} onChange={onContentChange} />
      </div>
      <p className={helperTextClass}>{contentHelperText}</p>
    </div>
  );
}
