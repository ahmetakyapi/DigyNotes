"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getSearchTabForCategory, SearchTabKey } from "@/lib/categories";

export interface MediaSearchResult {
  title: string;
  creator: string;
  years: string;
  image: string;
  excerpt: string;
  externalRating?: number | null;
  externalId?: string;
  latitude?: number | null;
  longitude?: number | null;
  locationLabel?: string;
  _tab?: SearchTab;
  _tmdbId?: number;
  _mediaType?: "movie" | "tv";
  _rawgId?: number;
}

interface TMDBRawResult {
  id: number;
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path: string | null;
  overview: string;
  vote_average?: number;
}

interface OpenLibraryRawResult {
  key: string;
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  cover_i?: number;
  first_sentence?: string | string[];
}

interface RawgGameResult {
  id: number;
  name: string;
  released: string | null;
  background_image: string | null;
  metacritic: number | null;
}

interface NominatimRawResult {
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
  };
  extratags?: {
    wikipedia?: string;
  };
}

export type SearchTab = SearchTabKey;

interface MediaSearchProps {
  category: string;
  onSelect: (result: MediaSearchResult) => void;
  onAction?: (result: MediaSearchResult) => void | Promise<void>;
  actionLabel?: string;
  /** Tab'ı kilitle ve tab bar'ı gizle */
  lockedTab?: SearchTab;
}

const TMDB_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
const RAWG_KEY = process.env.NEXT_PUBLIC_RAWG_API_KEY;

const TABS: { key: SearchTab; label: string }[] = [
  { key: "film", label: "Film" },
  { key: "dizi", label: "Dizi" },
  { key: "kitap", label: "Kitap" },
  { key: "oyun", label: "Oyun" },
  { key: "gezi", label: "Gezi" },
];

function getInitialTab(category: string): SearchTab {
  return getSearchTabForCategory(category) ?? "film";
}

async function fetchTMDBCredits(tmdbId: number, mediaType: "movie" | "tv"): Promise<string> {
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/${mediaType}/${tmdbId}/credits?api_key=${TMDB_KEY}&language=en-US`
    );
    const data = await res.json();
    if (mediaType === "movie") {
      const director = (data.crew as { job: string; name: string }[] | undefined)?.find(
        (c) => c.job === "Director"
      );
      return director?.name ?? "";
    }
    return (data.created_by as { name: string }[] | undefined)?.[0]?.name ?? "";
  } catch {
    return "";
  }
}

async function fetchRawgDeveloper(gameId: number): Promise<string> {
  if (!RAWG_KEY) return "";
  try {
    const res = await fetch(`https://api.rawg.io/api/games/${gameId}?key=${RAWG_KEY}`);
    const data = await res.json();
    return (data.developers as { name: string }[] | undefined)?.[0]?.name ?? "";
  } catch {
    return "";
  }
}

async function fetchWikipediaThumb(
  wikiTag?: string,
  fallbackTitle?: string
): Promise<string | undefined> {
  try {
    let lang = "en";
    let title = fallbackTitle ?? "";
    if (wikiTag) {
      const colonIdx = wikiTag.indexOf(":");
      if (colonIdx > -1) {
        lang = wikiTag.slice(0, colonIdx);
        title = wikiTag.slice(colonIdx + 1);
      } else {
        title = wikiTag;
      }
    }
    if (!title) return undefined;
    const res = await fetch(
      `https://${lang}.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&format=json&pithumbsize=200&origin=*`
    );
    if (!res.ok) return undefined;
    const data = await res.json();
    const pages = data?.query?.pages ?? {};
    const page = Object.values(pages)[0] as { thumbnail?: { source?: string } };
    return page?.thumbnail?.source;
  } catch {
    return undefined;
  }
}

function mapMovieResults(items: TMDBRawResult[]): MediaSearchResult[] {
  return items.slice(0, 5).map((item) => ({
    title: item.title ?? "",
    creator: "",
    years: item.release_date?.slice(0, 4) ?? "",
    image: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : "",
    excerpt: item.overview,
    externalRating:
      typeof item.vote_average === "number" && item.vote_average > 0
        ? Math.round(item.vote_average * 10) / 10
        : null,
    externalId: `tmdb:movie:${item.id}`,
    _tmdbId: item.id,
    _mediaType: "movie" as const,
  }));
}

function mapTVResults(items: TMDBRawResult[]): MediaSearchResult[] {
  return items.slice(0, 5).map((item) => ({
    title: item.name ?? "",
    creator: "",
    years: item.first_air_date?.slice(0, 4) ?? "",
    image: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : "",
    excerpt: item.overview,
    externalRating:
      typeof item.vote_average === "number" && item.vote_average > 0
        ? Math.round(item.vote_average * 10) / 10
        : null,
    externalId: `tmdb:tv:${item.id}`,
    _tmdbId: item.id,
    _mediaType: "tv" as const,
  }));
}

async function searchMedia(query: string, tab: SearchTab): Promise<MediaSearchResult[]> {
  const encoded = encodeURIComponent(query);

  if (tab === "film") {
    const res = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${encoded}&language=tr-TR`
    );
    const data = await res.json();
    const trResults = (data.results as TMDBRawResult[]) ?? [];
    if (trResults.length > 0) return mapMovieResults(trResults);
    const enRes = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${encoded}&language=en-US`
    );
    const enData = await enRes.json();
    return mapMovieResults((enData.results as TMDBRawResult[]) ?? []);
  }

  if (tab === "dizi") {
    const res = await fetch(
      `https://api.themoviedb.org/3/search/tv?api_key=${TMDB_KEY}&query=${encoded}&language=tr-TR`
    );
    const data = await res.json();
    const trResults = (data.results as TMDBRawResult[]) ?? [];
    if (trResults.length > 0) return mapTVResults(trResults);
    const enRes = await fetch(
      `https://api.themoviedb.org/3/search/tv?api_key=${TMDB_KEY}&query=${encoded}&language=en-US`
    );
    const enData = await enRes.json();
    return mapTVResults((enData.results as TMDBRawResult[]) ?? []);
  }

  if (tab === "oyun") {
    if (!RAWG_KEY) return [];
    const res = await fetch(
      `https://api.rawg.io/api/games?key=${RAWG_KEY}&search=${encoded}&page_size=5`
    );
    const data = await res.json();
    return ((data.results as RawgGameResult[]) ?? []).map((item) => ({
      title: item.name,
      creator: "",
      years: item.released?.slice(0, 4) ?? "",
      image: item.background_image ?? "",
      excerpt: "",
      externalRating: item.metacritic ? Math.round((item.metacritic / 20) * 10) / 10 : null,
      externalId: `rawg:${item.id}`,
      _rawgId: item.id,
    }));
  }

  if (tab === "gezi") {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&limit=6&accept-language=tr&addressdetails=1&extratags=1`,
      { headers: { "Accept-Language": "tr" } }
    );
    const data: NominatimRawResult[] = await res.json();
    return Promise.all(
      data.map(async (place) => {
        const main =
          place.address?.city ||
          place.address?.town ||
          place.address?.village ||
          place.display_name.split(",")[0].trim();
        const secondary = place.display_name.split(",").slice(1, 3).join(", ").trim();
        const thumb = await fetchWikipediaThumb(place.extratags?.wikipedia, main);
        return {
          title: main,
          creator: "",
          years: "",
          image: thumb ?? "",
          excerpt: secondary,
          externalId: `nominatim:${place.display_name}`,
          latitude: Number.parseFloat(place.lat),
          longitude: Number.parseFloat(place.lon),
          locationLabel: place.display_name,
        };
      })
    );
  }

  // kitap
  const res = await fetch(
    `https://openlibrary.org/search.json?q=${encoded}&limit=5&fields=key,title,author_name,first_publish_year,cover_i,first_sentence`
  );
  const data = await res.json();
  return ((data.docs as OpenLibraryRawResult[]) ?? []).map((item) => ({
    title: item.title ?? "",
    creator: item.author_name?.[0] ?? "",
    years: item.first_publish_year ? String(item.first_publish_year) : "",
    image: item.cover_i ? `https://covers.openlibrary.org/b/id/${item.cover_i}-M.jpg` : "",
    excerpt: Array.isArray(item.first_sentence)
      ? (item.first_sentence[0]?.slice(0, 400) ?? "")
      : typeof item.first_sentence === "string"
        ? item.first_sentence.slice(0, 400)
        : "",
    externalId: `openlibrary:${item.key}`,
  }));
}

export function MediaSearch({
  category,
  onSelect,
  onAction,
  actionLabel = "Listeye Ekle",
  lockedTab,
}: MediaSearchProps) {
  const [activeTab, setActiveTab] = useState<SearchTab>(() => lockedTab ?? getInitialTab(category));
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MediaSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const [isSelecting, setIsSelecting] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const skipNextSearchRef = useRef(false);

  const handleTabChange = (tab: SearchTab) => {
    setActiveTab(tab);
    setQuery("");
    setResults([]);
    setIsOpen(false);
    setHighlighted(-1);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  // lockedTab değişince tab'i güncelle
  useEffect(() => {
    if (lockedTab) {
      handleTabChange(lockedTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lockedTab]);

  // Kategori değişince (lockedTab yoksa) uygun tabı aç
  useEffect(() => {
    if (lockedTab) return;
    const newTab = getInitialTab(category);
    if (newTab !== activeTab) {
      handleTabChange(newTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    if (skipNextSearchRef.current) {
      skipNextSearchRef.current = false;
      return;
    }

    // Gezi için Nominatim: min 3 karakter
    if (activeTab === "gezi" && query.trim().length < 3) return;

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const found = await searchMedia(query, activeTab);
        setResults(found);
        setIsOpen(found.length > 0);
        setHighlighted(-1);
      } catch {
        setResults([]);
        setIsOpen(false);
      } finally {
        setIsLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query, activeTab]);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleSelect = useCallback(
    async (item: MediaSearchResult) => {
      setIsSelecting(true);
      setIsOpen(false);
      setResults([]);
      skipNextSearchRef.current = true;
      setQuery(item.title);

      let creator = item.creator;
      if (item._tmdbId && item._mediaType) {
        creator = await fetchTMDBCredits(item._tmdbId, item._mediaType);
      } else if (item._rawgId) {
        creator = await fetchRawgDeveloper(item._rawgId);
      }

      onSelect({ ...item, creator, _tab: activeTab });
      setIsSelecting(false);
    },
    [onSelect, activeTab]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && highlighted >= 0) {
      e.preventDefault();
      handleSelect(results[highlighted]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const placeholder =
    activeTab === "film"
      ? "Film adı ara..."
      : activeTab === "dizi"
        ? "Dizi adı ara..."
        : activeTab === "oyun"
          ? "Oyun adı ara..."
          : activeTab === "gezi"
            ? "Şehir, ülke veya yer adı ara..."
            : "Kitap adı ara...";

  // Dropdown'da thumbnail boyutu
  const imgClass =
    activeTab === "oyun" ? "h-10 w-16" : activeTab === "gezi" ? "h-10 w-10" : "h-12 w-8";

  // Dropdown'da alt bilgi (yıl ya da lokasyon)
  const subtitle = (item: MediaSearchResult) => (activeTab === "gezi" ? item.excerpt : item.years);
  const minCharacterCount = activeTab === "gezi" ? 3 : 2;
  const showHelperText = query.trim().length > 0 && query.trim().length < minCharacterCount;
  const showEmptyState =
    !isLoading && query.trim().length >= minCharacterCount && results.length === 0 && !isOpen;

  return (
    <div ref={containerRef}>
      {/* Tab bar — lockedTab varsa gizle */}
      {!lockedTab && (
        <div className="mb-3 flex flex-wrap items-center gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleTabChange(tab.key)}
              className={`rounded-md px-3 py-2 text-[13px] font-semibold transition-colors duration-150 ${
                activeTab === tab.key
                  ? "bg-[var(--gold)] text-[var(--text-on-accent)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2.5 pr-10 text-[16px] text-[var(--text-primary)] transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--gold)] focus:outline-none sm:text-sm"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
          {isLoading || isSelecting ? (
            <svg
              className="h-4 w-4 animate-spin text-[var(--gold)]"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          ) : (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z"
              />
            </svg>
          )}
        </div>

        {/* Dropdown */}
        {isOpen && results.length > 0 && (
          <div
            className="absolute z-50 mt-1 w-full overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--bg-card)] shadow-xl"
            style={{ maxHeight: "min(320px, 40vh)" }}
          >
            {results.map((item, i) => (
              <div
                key={i}
                onMouseEnter={() => setHighlighted(i)}
                className={`flex items-center gap-3 px-3 py-2.5 transition-colors ${
                  highlighted === i ? "bg-[var(--bg-raised)]" : "hover:bg-[var(--bg-raised)]"
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleSelect(item)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.image}
                      alt={item.title}
                      className={`flex-shrink-0 rounded object-cover ${imgClass}`}
                    />
                  ) : (
                    <div
                      className={`flex flex-shrink-0 items-center justify-center rounded bg-[var(--bg-raised)] ${imgClass}`}
                    >
                      <span className="text-xs text-[var(--text-muted)]">?</span>
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                      {item.title}
                    </p>
                    {subtitle(item) && (
                      <p className="truncate text-xs text-[var(--text-muted)]">{subtitle(item)}</p>
                    )}
                  </div>
                </button>
                {onAction && (
                  <button
                    type="button"
                    onClick={() => {
                      void onAction(item);
                    }}
                    className="bg-[#c4a24b]/8 hover:bg-[#c4a24b]/14 flex-shrink-0 rounded-lg border border-[#c4a24b]/25 px-3 py-1.5 text-[11px] font-semibold text-[var(--gold)] transition-colors"
                  >
                    {actionLabel}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showHelperText && (
        <p className="mt-2 text-[11px] leading-5 text-[var(--text-muted)]">
          {activeTab === "gezi"
            ? "Konum aramak için en az 3 karakter yaz."
            : "Sonuçları görmek için en az 2 karakter yaz."}
        </p>
      )}

      {showEmptyState && (
        <p className="mt-2 text-[11px] leading-5 text-[var(--text-muted)]">
          Uygun sonuç bulunamadı. Başka bir anahtar kelimeyle tekrar dene.
        </p>
      )}

      {/* Oyun API uyarısı */}
      {activeTab === "oyun" && !RAWG_KEY && (
        <p className="mt-2 text-[11px] text-[var(--text-secondary)]">
          Oyun araması için{" "}
          <code className="rounded bg-[var(--bg-raised)] px-1 text-[var(--gold)]">
            NEXT_PUBLIC_RAWG_API_KEY
          </code>{" "}
          ortam değişkeni gerekli.
        </p>
      )}
    </div>
  );
}
