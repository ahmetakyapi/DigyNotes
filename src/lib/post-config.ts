import { FixedCategory, isOtherCategory, isTravelCategory } from "@/lib/categories";

export const CATEGORY_EXAMPLE_TAGS: Record<FixedCategory, string[]> = {
  movies: ["drama", "bilim-kurgu", "festival", "aksiyon", "senaryo"],
  series: ["mini-dizi", "drama", "suç", "fantastik", "kurgu"],
  game: ["indie", "soulslike", "co-op", "hikâye-odaklı", "pixel-art"],
  book: ["bilim-kurgu", "fantastik", "kurgu-dışı", "felsefe", "şiir"],
  travel: ["gezi", "müze", "rota", "kahve-durağı", "doğa"],
  other: ["ilham-verici", "üretkenlik", "deneme", "favori", "arşiv"],
};

export function categorySupportsSpoiler(category: string) {
  return !isTravelCategory(category) && !isOtherCategory(category);
}
