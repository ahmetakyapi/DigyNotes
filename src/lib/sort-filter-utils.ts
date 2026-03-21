/**
 * SortFilter pure utility fonksiyonları.
 * JSX içermeyen bu dosya Node.js test runner ile doğrudan test edilebilir.
 */

export type SortOption = "newest" | "oldest" | "rating_desc" | "rating_asc" | "az" | "za";

export interface SortFilterState {
  sort: SortOption;
  minRating: number;
  maxRating: number;
  yearFrom: string;
  yearTo: string;
  statuses: string[];
}

function parseYear(value: string) {
  const numeric = parseInt(value.trim(), 10);
  return Number.isFinite(numeric) ? numeric : null;
}

export function extractYearRange(input?: string | null) {
  if (!input) return null;

  const matches = input.match(/\b(19|20)\d{2}\b/g);
  if (!matches || matches.length === 0) return null;

  const years = matches.map((item) => parseInt(item, 10)).filter(Number.isFinite);
  if (years.length === 0) return null;

  return {
    from: Math.min(...years),
    to: Math.max(...years),
  };
}

export function createSortFilterState(sort: SortOption = "newest"): SortFilterState {
  return {
    sort,
    minRating: 0,
    maxRating: 0,
    yearFrom: "",
    yearTo: "",
    statuses: [],
  };
}

export function hasActiveSortFilters(
  state: SortFilterState,
  defaultValue: SortFilterState = createSortFilterState()
) {
  return (
    state.sort !== defaultValue.sort ||
    state.minRating !== defaultValue.minRating ||
    state.maxRating !== defaultValue.maxRating ||
    state.yearFrom.trim() !== defaultValue.yearFrom.trim() ||
    state.yearTo.trim() !== defaultValue.yearTo.trim() ||
    state.statuses.length !== defaultValue.statuses.length ||
    state.statuses.some((status) => !defaultValue.statuses.includes(status))
  );
}

export function matchesAdvancedFilters<
  T extends { rating: number; status?: string | null; years?: string | null; date?: string | null },
>(post: T, state: SortFilterState) {
  if (post.rating < state.minRating) return false;
  if (state.maxRating > 0 && post.rating > state.maxRating) return false;

  if (state.statuses.length > 0) {
    if (!post.status || !state.statuses.includes(post.status)) {
      return false;
    }
  }

  const yearFrom = parseYear(state.yearFrom);
  const yearTo = parseYear(state.yearTo);

  if (yearFrom !== null || yearTo !== null) {
    const range = extractYearRange(post.years) ?? extractYearRange(post.date);
    if (!range) return false;
    if (yearFrom !== null && range.to < yearFrom) return false;
    if (yearTo !== null && range.from > yearTo) return false;
  }

  return true;
}

export function applySortFilter<T extends { rating: number; title: string; createdAt: string }>(
  posts: T[],
  state: SortFilterState
): T[] {
  const filtered = [...posts];

  switch (state.sort) {
    case "newest":
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      break;
    case "oldest":
      filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      break;
    case "rating_desc":
      filtered.sort((a, b) => b.rating - a.rating);
      break;
    case "rating_asc":
      filtered.sort((a, b) => a.rating - b.rating);
      break;
    case "az":
      filtered.sort((a, b) => a.title.localeCompare(b.title, "tr"));
      break;
    case "za":
      filtered.sort((a, b) => b.title.localeCompare(a.title, "tr"));
      break;
  }
  return filtered;
}
