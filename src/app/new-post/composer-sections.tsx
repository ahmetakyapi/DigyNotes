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
  "w-full rounded-lg border border-[var(--border)] bg-[var(--bg-raised)] px-3.5 py-2.5 text-[16px] sm:text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-all duration-150 focus:outline-none focus:border-[#10b981]/60 focus:ring-1 focus:ring-[#10b981]/15 focus:bg-[var(--bg-card)]";
const labelClass =
  "mb-1.5 block text-[10px] font-bold uppercase tracking-[0.13em] text-[var(--text-muted)]";
const cardClass = "rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 sm:p-5";
const helperTextClass = "mt-2 text-[11px] leading-5 text-[var(--text-muted)]";

function flashClass(flashed: boolean) {
  return flashed ? "ring-2 ring-[#10b981]/40 border-[#10b981]/50" : "";
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
    if (autofillDone)
      return "Temel alanlar doldu. Aşağıda sadece başlığı ve durumu gözden geçirmen yeterli.";
    if (isTravelCat)
      return "Doğru yeri seçtiğinde koordinatlar görünür ve gezi notu haritayla bağ kurar.";
    return "Arama başlangıcı hızlandırır; istersen sonucu seçmeden de devam edebilirsin.";
  })();

  return (
    <section
      className={`${cardClass} overflow-hidden`}
      style={{
        background:
          "radial-gradient(circle at top left, rgba(16,185,129,0.12), transparent 34%), var(--bg-card)",
      }}
    >
      <div className="flex flex-col gap-4">
        {/* ── Compact guidance bar (collapsed by default) ── */}
        <div>
          <button
            type="button"
            onClick={() => setGuidanceOpen((prev) => !prev)}
            className="hover:bg-[var(--bg-raised)]/60 flex w-full items-center justify-between gap-3 rounded-lg px-1 py-1 text-left transition-colors"
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <InfoIcon size={16} weight="bold" className="shrink-0 text-[var(--gold)]" />
              <span className="truncate text-sm font-semibold text-[var(--text-primary)]">
                {supportsAutofill ? guidance.searchTitle : "Başlıkla başla"}
              </span>
              <span className="shrink-0 rounded-full border border-[var(--border)] bg-[var(--bg-raised)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-muted)]">
                {completedStepCount}/4
              </span>
              <span className="border-[var(--gold)]/24 bg-[var(--gold)]/10 shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium text-[var(--gold)]">
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
            <div className="mt-2 rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3.5 py-3 text-sm leading-6 text-[var(--text-secondary)]">
              {supportsAutofill
                ? "Kategori seç, arama sonucunu al ve sonra alt alandaki başlık ile durum bilgilerini tamamla."
                : guidance.manualHint}
            </div>
          )}
        </div>

        {/* ── Category + Search / Title input ── */}
        <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-base)] p-3.5">
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

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-base)] p-3.5 sm:p-4">
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
                    ? "Başlık hazır. Aşağıda durum ve diğer alanları tamamlayabilirsin."
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
    if (creator) return `${config.creatorLabel} bilgisi görünür durumda kalır.`;
    const req = config.creatorRequired ? "zorunlu" : "opsiyonel";
    return `${config.creatorLabel} alanı bu kategori için ${req} tutulur.`;
  })();

  const yearsHelperText = (() => {
    if (years) return `${config.yearsLabel} alanı kayda hazır.`;
    const req = config.yearsRequired ? "bu kategori için zorunlu." : "istersen boş bırakılabilir.";
    return `${config.yearsLabel} alanı ${req}`;
  })();

  return (
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
            {title
              ? "Başlık görünür durumda. İstersen tonu daha kişisel hale getirebilirsin."
              : guidance.titleHint}
          </p>
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,0.8fr)_1fr_1fr]">
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
    <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--bg-raised)] p-3.5">
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
            className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-1.5 text-[11px] font-medium text-[var(--text-secondary)] transition-colors hover:border-[#10b981]/35 hover:text-[var(--text-primary)]"
          >
            Haritada aç
          </a>
        )}
      </div>
      <PlaceSearch onSelect={onPlaceSelect} />
      <div className="mt-3 rounded-lg border border-dashed border-[var(--border)] px-3 py-2.5 text-xs text-[var(--text-muted)]">
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
    return "İlk paragrafı boş bırakma; neden kaydettiğini söyleyen tek bir cümle bile yeterli.";
  })();

  return (
    <div className={cardClass}>
      <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--gold)]">
            4. adım
          </p>
          <label htmlFor="np-content" className={`${labelClass} mb-0 mt-1`}>
            İçerik
          </label>
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
                !globalThis.confirm(
                  "Mevcut içerik değişecek. Kategori şablonunu yeniden uygulamak istiyor musun?"
                )
              ) {
                return;
              }
              onApplyTemplate(category, { force: true });
            }}
            className={`inline-flex items-center rounded-lg border px-3 py-1.5 text-[11px] font-medium transition-colors ${
              isTemplateActive
                ? "border-[#10b981]/35 bg-[#10b981]/10 text-[var(--gold)]"
                : "border-[var(--border)] bg-[var(--bg-raised)] text-[var(--text-secondary)] hover:border-[#10b981]/30 hover:text-[var(--text-primary)]"
            }`}
          >
            {isTemplateActive ? "Şablon aktif" : "Şablonu uygula"}
          </button>
        )}
      </div>
      <div className="dn-compose-editor mt-1 overflow-hidden rounded-lg border border-[var(--border)]">
        <ReactQuill id="np-content" theme="snow" value={content} onChange={onContentChange} />
      </div>
      <p className={helperTextClass}>{contentHelperText}</p>
    </div>
  );
}
