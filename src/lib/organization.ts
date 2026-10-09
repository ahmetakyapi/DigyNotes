export type OrganizationSurfaceKey = "bookmarks" | "watchlist" | "collections";

export interface OrganizationSurfaceDefinition {
  key: OrganizationSurfaceKey;
  label: string;
  shortLabel: string;
  description: string;
  href: string;
  cta: string;
}

export const ORGANIZATION_SURFACES: Record<OrganizationSurfaceKey, OrganizationSurfaceDefinition> =
  {
    bookmarks: {
      key: "bookmarks",
      label: "Kaydettiklerim",
      shortLabel: "Sonra tekrar bak",
      description: "Tekrar bakmak istediğin notları kaydet, hepsini tek yerde bul.",
      href: "/notes?tab=kaydedilenler",
      cta: "Kaydettiklerime Git",
    },
    watchlist: {
      key: "watchlist",
      label: "İstek Listesi",
      shortLabel: "İzle, oku, git",
      description:
        "Henüz izlemediğin, okumadığın ya da gitmediğin şeyleri sonra hatırlamak için buraya ekle.",
      href: "/watchlist",
      cta: "İstek Listesine Git",
    },
    collections: {
      key: "collections",
      label: "Koleksiyonlar",
      shortLabel: "Notları grupla",
      description:
        "Notlarını konuya, döneme ya da ruh haline göre grupla; istersen profilinde göster.",
      href: "/collections",
      cta: "Koleksiyonlara Git",
    },
  };
