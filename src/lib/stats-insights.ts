export interface LabeledCount {
  name: string;
  count: number;
}

export interface MonthlyCount {
  month: string;
  count: number;
}

export function getShareLabel(count: number, total: number) {
  if (total <= 0) return "%0";
  return `%${Math.round((count / total) * 100)}`;
}

export function getActiveMonthCount(monthlySeries: MonthlyCount[]) {
  return monthlySeries.filter((item) => item.count > 0).length;
}

export function getStrongestMonth(monthlySeries: MonthlyCount[]) {
  if (monthlySeries.length === 0) return null;
  return monthlySeries.reduce((best, item) => (item.count > best.count ? item : best));
}

export function getRecentMomentum(monthlySeries: MonthlyCount[]) {
  if (monthlySeries.length < 2) return null;

  const recent = monthlySeries[monthlySeries.length - 1];
  const previous = monthlySeries[monthlySeries.length - 2];

  if (recent.count === previous.count) {
    return {
      direction: "flat" as const,
      label: "Son ayda da bir önceki ay kadar not ekledin.",
    };
  }

  if (recent.count > previous.count) {
    return {
      direction: "up" as const,
      label: "Son ayda bir önceki aydan daha çok not ekledin.",
    };
  }

  return {
    direction: "down" as const,
    label: "Son ayda bir önceki aydan daha az not ekledin.",
  };
}

export function getTopItem(items: LabeledCount[]) {
  return items[0] ?? null;
}

export function getTopItemsLabel(items: LabeledCount[], max = 3) {
  return items
    .slice(0, max)
    .map((item) => item.name)
    .join(", ");
}

export function getSparseDataLabel(totalPosts: number, activeMonths: number) {
  if (totalPosts === 0) {
    return "Henüz veri yok.";
  }

  if (totalPosts < 3) {
    return "Birkaç not daha ekleyince burada daha çok şey göreceksin.";
  }

  if (activeMonths < 2) {
    return "Notlarının çoğu aynı aya ait. Farklı aylarda da ekledikçe tablo netleşir.";
  }

  return null;
}
