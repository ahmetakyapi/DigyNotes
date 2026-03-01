export type OrganizationSurfaceKey = "bookmarks" | "watchlist" | "collections";

export interface OrganizationSurfaceDefinition {
  key: OrganizationSurfaceKey;
  label: string;
  shortLabel: string;
  description: string;
  href: string;
  cta: string;
}

export const ORGANIZATION_SURFACES: Record<
  OrganizationSurfaceKey,
  OrganizationSurfaceDefinition
> = {
  bookmarks: {
    key: "bookmarks",
    label: "Kaydettiklerim",
    shortLabel: "Hızlı kayıt",
    description:
      "Bir nota hızlıca geri dönmek istediğinde kullan. Geçici değildir, ama gruplama da yapmaz.",
    href: "/notes?tab=kaydedilenler",
    cta: "Kaydettiklerime git",
  },
  watchlist: {
    key: "watchlist",
    label: "İstek Listesi",
    shortLabel: "Sonra bak",
    description:
      "Henüz nota dönüştürmediğin film, dizi, kitap, oyun ve gezi fikirlerini burada beklet.",
    href: "/watchlist",
    cta: "İstek listesine git",
  },
  collections: {
    key: "collections",
    label: "Koleksiyonlar",
    shortLabel: "Uzun vadeli grup",
    description:
      "Tamamlanmış notlarını tema, dönem ya da duygu ekseninde bir araya getirip sergile.",
    href: "/collections",
    cta: "Koleksiyonlara git",
  },
};
