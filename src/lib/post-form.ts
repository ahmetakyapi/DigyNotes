import { isTravelCategory } from "@/lib/categories";
import { categorySupportsSpoiler } from "@/lib/post-config";
import { stripHtml } from "@/lib/text";

export interface PostCategoryFormConfig {
  showCreator: boolean;
  creatorLabel: string;
  yearsLabel: string;
  yearsPlaceholder: string;
}

const POST_CATEGORY_FORM_CONFIG: Record<string, PostCategoryFormConfig> = {
  movies: {
    showCreator: true,
    creatorLabel: "Yönetmen",
    yearsLabel: "Yıl",
    yearsPlaceholder: "2024",
  },
  series: {
    showCreator: true,
    creatorLabel: "Yönetmen / Yapımcı",
    yearsLabel: "Yayın Yılları",
    yearsPlaceholder: "2020–2023",
  },
  game: {
    showCreator: true,
    creatorLabel: "Geliştirici",
    yearsLabel: "Yıl",
    yearsPlaceholder: "2024",
  },
  book: {
    showCreator: true,
    creatorLabel: "Yazar",
    yearsLabel: "Yıl",
    yearsPlaceholder: "2024",
  },
  travel: {
    showCreator: false,
    creatorLabel: "",
    yearsLabel: "Ziyaret Tarihi",
    yearsPlaceholder: "2024",
  },
  other: {
    showCreator: true,
    creatorLabel: "Kaynak / Kişi",
    yearsLabel: "Yıl",
    yearsPlaceholder: "2024",
  },
};

export function getPostCategoryFormConfig(category: string): PostCategoryFormConfig {
  return POST_CATEGORY_FORM_CONFIG[category] ?? POST_CATEGORY_FORM_CONFIG.other;
}

/* Only title, category and some content are required (owner, 2026-10-13): creator, years
   and the cover often stay empty when autofill misses them and can be filled in later.
   A note without a cover shows its category image (`getPostImageSrc`). */
export type RequiredPostField = "title" | "category" | "content";

const REQUIRED_FIELD_LABELS: Record<RequiredPostField, string> = {
  title: "başlık",
  category: "kategori",
  content: "not içeriği",
};

/** Quill HTML that holds text or at least an image. */
export function hasMeaningfulContent(html: string) {
  return Boolean(stripHtml(html)) || /<img\b/i.test(html);
}

/** Trimmed string or null — for optional text fields (creator, years) sent by the composer. */
export function optionalString(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

/** Required fields that are still empty, in on-screen order. */
export function getMissingPostFields(input: {
  title: string;
  category: string;
  hasContent: boolean;
}): RequiredPostField[] {
  const missing: RequiredPostField[] = [];
  if (!input.title.trim()) missing.push("title");
  if (!input.category.trim()) missing.push("category");
  if (!input.hasContent) missing.push("content");
  return missing;
}

/** "Başlık ve not içeriği gerekli." — names exactly what is missing. Empty when nothing is. */
export function formatMissingFieldsMessage(missing: readonly RequiredPostField[]) {
  if (missing.length === 0) return "";
  const labels = missing.map((field) => REQUIRED_FIELD_LABELS[field]);
  const joined =
    labels.length === 1
      ? labels[0]
      : `${labels.slice(0, -1).join(", ")} ve ${labels[labels.length - 1]}`;
  return `${joined.charAt(0).toLocaleUpperCase("tr-TR")}${joined.slice(1)} gerekli.`;
}

export interface PostCategoryDependentFields {
  creator: string;
  hasSpoiler: boolean;
  lat: number | null;
  lng: number | null;
  locationLabel: string;
}

export function syncPostCategoryDependentFields(
  category: string,
  fields: PostCategoryDependentFields
): PostCategoryDependentFields {
  const nextFields: PostCategoryDependentFields = {
    ...fields,
  };

  if (isTravelCategory(category)) {
    nextFields.creator = "";
  } else {
    nextFields.lat = null;
    nextFields.lng = null;
    nextFields.locationLabel = "";
  }

  if (!categorySupportsSpoiler(category)) {
    nextFields.hasSpoiler = false;
  }

  return nextFields;
}

export function detectImagePosition(
  url: string,
  cb: (position: string, isLandscape: boolean) => void
) {
  const img = new window.Image();
  img.onload = () => {
    const ratio = img.naturalWidth / img.naturalHeight;
    const isLandscape = ratio > 1.35;
    cb(isLandscape ? "center 25%" : "center", isLandscape);
  };
  img.onerror = () => cb("center", false);
  img.src = url;
}
