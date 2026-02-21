"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface MediaResult {
  title: string;
  creator: string;
  years: string;
  image: string;
  excerpt: string;
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
}

interface OpenLibraryRawResult {
  key: string;
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  cover_i?: number;
  first_sentence?: string | string[];
}

type SearchTab = "film" | "dizi" | "kitap";

interface MediaSearchProps {
  category: string;
  onSelect: (result: MediaResult) => void;
}

const TMDB_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;

const TABS: { key: SearchTab; label: string }[] = [
  { key: "film", label: "Film" },
  { key: "dizi", label: "Dizi" },
  { key: "kitap", label: "Kitap" },
];

function getInitialTab(category: string): SearchTab {
  const cat = category.toLowerCase();
  if (cat === "dizi") return "dizi";
  if (cat === "kitap") return "kitap";
  return "film";
}

async function fetchTMDBCredits(tmdbId: number, mediaType: "movie" | "tv"): Promise<string> {
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/${mediaType}/${tmdbId}/credits?api_key=${TMDB_KEY}&language=tr-TR`
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

async function searchMedia(
  query: string,
  tab: SearchTab
): Promise<(MediaResult & { _tmdbId?: number; _mediaType?: "movie" | "tv" })[]> {
  if (tab === "film") {
    const res = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(query)}&language=tr-TR`
    );
    const data = await res.json();
    return ((data.results as TMDBRawResult[]) ?? []).slice(0, 5).map((item) => ({
      title: item.title ?? "",
      creator: "",
      years: item.release_date?.slice(0, 4) ?? "",
      image: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : "",
      excerpt: item.overview,
      _tmdbId: item.id,
      _mediaType: "movie" as const,
    }));
  }

  if (tab === "dizi") {
    const res = await fetch(
      `https://api.themoviedb.org/3/search/tv?api_key=${TMDB_KEY}&query=${encodeURIComponent(query)}&language=tr-TR`
    );
    const data = await res.json();
    return ((data.results as TMDBRawResult[]) ?? []).slice(0, 5).map((item) => ({
      title: item.name ?? "",
      creator: "",
      years: item.first_air_date?.slice(0, 4) ?? "",
      image: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : "",
      excerpt: item.overview,
      _tmdbId: item.id,
      _mediaType: "tv" as const,
    }));
  }

  // kitap
  const res = await fetch(
    `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=5&fields=key,title,author_name,first_publish_year,cover_i,first_sentence`
  );
  const data = await res.json();
  return ((data.docs as OpenLibraryRawResult[]) ?? []).map((item) => ({
    title: item.title ?? "",
    creator: item.author_name?.[0] ?? "",
    years: item.first_publish_year ? String(item.first_publish_year) : "",
    image: item.cover_i
      ? `https://covers.openlibrary.org/b/id/${item.cover_i}-M.jpg`
      : "",
    excerpt: Array.isArray(item.first_sentence)
      ? item.first_sentence[0]?.slice(0, 400) ?? ""
      : typeof item.first_sentence === "string"
      ? item.first_sentence.slice(0, 400)
      : "",
  }));
}

export function MediaSearch({ category, onSelect }: MediaSearchProps) {
  const [activeTab, setActiveTab] = useState<SearchTab>(() => getInitialTab(category));
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<(MediaResult & { _tmdbId?: number; _mediaType?: "movie" | "tv" })[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const [isSelecting, setIsSelecting] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Tab değişince arama sıfırla
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
    async (item: MediaResult & { _tmdbId?: number; _mediaType?: "movie" | "tv" }) => {
      setIsSelecting(true);
      setIsOpen(false);
      setQuery(item.title);

      let creator = item.creator;
      if (item._tmdbId && item._mediaType) {
        creator = await fetchTMDBCredits(item._tmdbId, item._mediaType);
      }

      onSelect({ ...item, creator, _tab: activeTab });
      setIsSelecting(false);
    },
    [onSelect]
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
      : "Kitap adı ara...";

  return (
    <div ref={containerRef}>
      {/* Tab bar */}
      <div className="flex items-center gap-1 mb-3">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => handleTabChange(tab.key)}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
              activeTab === tab.key
                ? "bg-[#c9a84c] text-[#0f1117]"
                : "text-[#555555] hover:text-[#f0ede8] hover:bg-[#1e1e1e]"
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
          className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-2.5 pr-10 text-sm text-[#f0ede8] placeholder-[#555555] focus:outline-none focus:border-[#c9a84c] transition-colors"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555555]">
          {isLoading || isSelecting ? (
            <svg className="animate-spin h-4 w-4 text-[#c9a84c]" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          ) : (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
            </svg>
          )}
        </div>

        {/* Dropdown */}
        {isOpen && results.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-[#161616] border border-[#2a2a2a] rounded-xl shadow-2xl overflow-hidden">
            {results.map((item, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setHighlighted(i)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                  highlighted === i ? "bg-[#1e1e1e]" : "hover:bg-[#1a1a1a]"
                }`}
              >
                {item.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-8 h-12 object-cover rounded flex-shrink-0 bg-[#2a2a2a]"
                  />
                ) : (
                  <div className="w-8 h-12 rounded flex-shrink-0 bg-[#2a2a2a] flex items-center justify-center">
                    <span className="text-[#555555] text-xs">?</span>
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#f0ede8] truncate">{item.title}</p>
                  {item.years && (
                    <p className="text-xs text-[#555555]">{item.years}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
