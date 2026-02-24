"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface MediaResult {
  title: string;
  creator: string;
  years: string;
  image: string;
  excerpt: string;
  externalRating?: number | null;
  _tab?: SearchTab;
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

type SearchTab = "film" | "dizi" | "kitap" | "oyun";

interface MediaSearchProps {
  category: string;
  onSelect: (result: MediaResult) => void;
}

const TMDB_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
const RAWG_KEY = process.env.NEXT_PUBLIC_RAWG_API_KEY;

const TABS: { key: SearchTab; label: string }[] = [
  { key: "film", label: "Film" },
  { key: "dizi", label: "Dizi" },
  { key: "kitap", label: "Kitap" },
  { key: "oyun", label: "Oyun" },
];

function getInitialTab(category: string): SearchTab {
  const cat = category.toLowerCase();
  if (cat === "dizi") return "dizi";
  if (cat === "kitap") return "kitap";
  if (cat === "oyun") return "oyun";
  return "film";
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

function mapMovieResults(
  items: TMDBRawResult[]
): (MediaResult & { _tmdbId?: number; _mediaType?: "movie" | "tv" })[] {
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
    _tmdbId: item.id,
    _mediaType: "movie" as const,
  }));
}

function mapTVResults(
  items: TMDBRawResult[]
): (MediaResult & { _tmdbId?: number; _mediaType?: "movie" | "tv" })[] {
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
    _tmdbId: item.id,
    _mediaType: "tv" as const,
  }));
}

async function searchMedia(
  query: string,
  tab: SearchTab
): Promise<(MediaResult & { _tmdbId?: number; _mediaType?: "movie" | "tv"; _rawgId?: number })[]> {
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
      _rawgId: item.id,
    }));
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
  }));
}

export function MediaSearch({ category, onSelect }: MediaSearchProps) {
  const [activeTab, setActiveTab] = useState<SearchTab>(() => getInitialTab(category));
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<
    (MediaResult & { _tmdbId?: number; _mediaType?: "movie" | "tv"; _rawgId?: number })[]
  >([]);
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
    async (
      item: MediaResult & { _tmdbId?: number; _mediaType?: "movie" | "tv"; _rawgId?: number }
    ) => {
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
          : "Kitap adı ara...";

  return (
    <div ref={containerRef}>
      {/* Tab bar */}
      <div className="mb-3 flex items-center gap-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => handleTabChange(tab.key)}
            className={`rounded-md px-3 py-1.5 text-[13px] font-semibold transition-colors ${
              activeTab === tab.key
                ? "bg-[#c9a84c] text-[#0f1117]"
                : "text-[#6070a0] hover:bg-[#1a1e2e] hover:text-[#c0c8e8]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

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
          className="w-full rounded-lg border border-[#1a1e2e] bg-[#0d0f1a] px-4 py-2.5 pr-10 text-sm text-[#f0ede8] placeholder-[#555555] transition-colors focus:border-[#c9a84c] focus:outline-none"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555555]">
          {isLoading || isSelecting ? (
            <svg className="h-4 w-4 animate-spin text-[#c9a84c]" viewBox="0 0 24 24" fill="none">
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
          <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-[#1a1e2e] bg-[#0d0f1a] shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
            {results.map((item, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setHighlighted(i)}
                className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                  highlighted === i ? "bg-[#131828]" : "hover:bg-[#111525]"
                }`}
              >
                {item.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.image}
                    alt={item.title}
                    className={`flex-shrink-0 rounded bg-[#1a1e2e] object-cover ${
                      activeTab === "oyun" ? "h-10 w-16" : "h-12 w-8"
                    }`}
                  />
                ) : (
                  <div
                    className={`flex flex-shrink-0 items-center justify-center rounded bg-[#1a1e2e] ${
                      activeTab === "oyun" ? "h-10 w-16" : "h-12 w-8"
                    }`}
                  >
                    <span className="text-xs text-[#555555]">?</span>
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[#f0ede8]">{item.title}</p>
                  {item.years && <p className="text-xs text-[#555555]">{item.years}</p>}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Oyun API uyarısı */}
      {activeTab === "oyun" && !RAWG_KEY && (
        <p className="mt-2 text-[11px] text-[#6070a0]">
          Oyun araması için{" "}
          <code className="rounded bg-[#1a1e2e] px-1 text-[#c9a84c]">NEXT_PUBLIC_RAWG_API_KEY</code>{" "}
          env değişkeni gerekli.
        </p>
      )}
    </div>
  );
}
