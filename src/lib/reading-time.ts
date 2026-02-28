/**
 * HTML içeriğinden tahmini okuma süresini hesaplar.
 * Ortalama okuma hızı: 200 kelime/dakika (Türkçe)
 */
export function estimateReadingTime(htmlContent: string): number {
  if (!htmlContent) return 0;

  // HTML etiketlerini temizle
  const plainText = htmlContent
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const wordCount = plainText.split(/\s+/).filter(Boolean).length;

  // 200 kelime/dakika — minimum 1 dakika
  return Math.max(1, Math.ceil(wordCount / 200));
}

/**
 * Okuma süresini Türkçe formatla gösterir.
 */
export function formatReadingTime(minutes: number): string {
  if (minutes <= 0) return "";
  if (minutes === 1) return "1 dk okuma";
  return `${minutes} dk okuma`;
}
