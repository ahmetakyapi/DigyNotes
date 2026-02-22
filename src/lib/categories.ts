export const FIXED_CATEGORIES = ["Film", "Dizi", "Oyun", "Kitap", "Gezi", "Diğer"] as const;
export type FixedCategory = (typeof FIXED_CATEGORIES)[number];
