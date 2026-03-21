"use client";

import React from "react";
import Image from "next/image";
import StarRating from "@/components/StarRating";
import TagInput from "@/components/TagInput";
import { customLoader } from "@/lib/image";
import toast from "react-hot-toast";

const labelClass =
  "mb-1.5 block text-[10px] font-bold uppercase tracking-[0.13em] text-[var(--text-muted)]";
const cardClass = "rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 sm:p-5";
const helperTextClass = "mt-2 text-[11px] leading-5 text-[var(--text-muted)]";

/* ─────────────────────── Status Sidebar ─────────────────────── */

interface StatusSidebarProps {
  readonly title: string;
  readonly categoryLabel: string;
  readonly status: string;
  readonly rating: number;
  readonly externalRating: number | null;
  readonly hasSpoiler: boolean;
  readonly supportsSpoiler: boolean;
  readonly footerHint: string;
  readonly onRatingChange: (r: number) => void;
  readonly onSpoilerChange: (v: boolean) => void;
}

export function StatusSidebar({
  title,
  categoryLabel,
  status,
  rating,
  externalRating,
  hasSpoiler,
  supportsSpoiler,
  footerHint,
  onRatingChange,
  onSpoilerChange,
}: StatusSidebarProps) {
  return (
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
                onClick={() => onRatingChange(0)}
                className="text-[11px] text-[var(--text-muted)] transition-colors duration-150 hover:text-[var(--danger)]"
              >
                Sıfırla
              </button>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <StarRating rating={rating} interactive onRate={onRatingChange} size={26} />
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
              onChange={(event) => onSpoilerChange(event.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-[var(--border)] text-[#10b981] focus:ring-[#10b981]"
              aria-label="Spoiler uyarısı ekle"
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
}

/* ─────────────────────── Cover Sidebar ─────────────────────── */

interface CoverSidebarProps {
  readonly image: string;
  readonly imagePosition: string;
  readonly isLandscape: boolean;
  readonly inputClassName: string;
  readonly imageHint: string;
  readonly onImageChange: (v: string) => void;
}

export function CoverSidebar({
  image,
  imagePosition,
  isLandscape,
  inputClassName,
  imageHint,
  onImageChange,
}: CoverSidebarProps) {
  return (
    <div className={cardClass}>
      <label htmlFor="cover-image-input" className={labelClass}>
        Kapak Görseli
      </label>
      <input
        id="cover-image-input"
        type="url"
        value={image}
        onChange={(event) => onImageChange(event.target.value)}
        className={`${inputClassName} mt-0.5`}
        placeholder="https://..."
      />
      <p className={helperTextClass}>{imageHint}</p>

      {image ? (
        <CoverPreview image={image} imagePosition={imagePosition} isLandscape={isLandscape} />
      ) : (
        <p className="mt-3 text-[11px] leading-5 text-[var(--text-muted)]">
          Kapak şu an boş. Arama sonucu, yer seçimi ya da manuel URL ile dolabilir.
        </p>
      )}
    </div>
  );
}

function CoverPreview({
  image,
  imagePosition,
  isLandscape,
}: {
  readonly image: string;
  readonly imagePosition: string;
  readonly isLandscape: boolean;
}) {
  return (
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
  );
}

/* ─────────────────────── Tags Sidebar ─────────────────────── */

interface TagsSidebarProps {
  readonly tags: string[];
  readonly exampleTags: string[];
  readonly onTagsChange: (tags: string[]) => void;
}

export function TagsSidebar({ tags, exampleTags, onTagsChange }: TagsSidebarProps) {
  const handleAddPopularTag = (tagName: string) => {
    if (tags.length >= 10) {
      toast.error("En fazla 10 etiket ekleyebilirsiniz.");
      return;
    }
    if (tags.includes(tagName)) return;
    onTagsChange([...tags, tagName]);
  };

  return (
    <div className={cardClass}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className={labelClass}>Etiketler</p>
        <span className="rounded-full border border-[var(--border)] bg-[var(--bg-raised)] px-2.5 py-1 text-[10px] font-medium text-[var(--text-secondary)]">
          {tags.length}/10
        </span>
      </div>

      <TagInput value={tags} onChange={onTagsChange} />
      <p className={`${helperTextClass} mt-3`}>
        Etiketler notu daha sonra ararken ve kategori içinde daraltırken işini kolaylaştırır.
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
                  ? "border-[#10b981]/40 bg-[#10b981]/10 text-[#34d399]"
                  : "border-[var(--border)] bg-[var(--bg-raised)] text-[var(--text-secondary)] hover:border-[#10b981]/35 hover:text-[#34d399]"
              }`}
            >
              #{tagName}
            </button>
          );
        })}
      </div>
    </div>
  );
}
