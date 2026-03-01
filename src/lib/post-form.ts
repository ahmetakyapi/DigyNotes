import { isTravelCategory } from "@/lib/categories";
import { categorySupportsSpoiler } from "@/lib/post-config";

export interface PostCategoryFormConfig {
  showCreator: boolean;
  creatorLabel: string;
  yearsLabel: string;
  yearsPlaceholder: string;
  yearsRequired: boolean;
  creatorRequired: boolean;
}

const POST_CATEGORY_FORM_CONFIG: Record<string, PostCategoryFormConfig> = {
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

export function getPostCategoryFormConfig(category: string): PostCategoryFormConfig {
  return POST_CATEGORY_FORM_CONFIG[category] ?? POST_CATEGORY_FORM_CONFIG.other;
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
