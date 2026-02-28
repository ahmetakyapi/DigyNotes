"use client";

import { useRef, useState } from "react";
import { MagnifyingGlass, MapPin, X } from "@phosphor-icons/react";

interface NominatimAddress {
  city?: string;
  town?: string;
  village?: string;
  county?: string;
  state?: string;
  country?: string;
  country_code?: string;
}

interface NominatimExtratags {
  wikipedia?: string; // "tr:İstanbul" veya "en:Istanbul"
  wikidata?: string;
  image?: string;
}

export interface NominatimPlace {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  address?: NominatimAddress;
  extratags?: NominatimExtratags;
}

export interface PlaceResult extends NominatimPlace {
  thumbUrl?: string; // Wikipedia'dan gelen küçük resim
}

interface PlaceSearchProps {
  onSelect: (place: PlaceResult) => void;
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

    const url = `https://${lang}.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&format=json&pithumbsize=200&origin=*`;
    const res = await fetch(url);
    if (!res.ok) return undefined;
    const data = await res.json();
    const pages = data?.query?.pages ?? {};
    const page = Object.values(pages)[0] as { thumbnail?: { source?: string } };
    return page?.thumbnail?.source;
  } catch {
    return undefined;
  }
}

export default function PlaceSearch({ onSelect }: PlaceSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const skipNextRef = useRef(false);

  function handleChange(value: string) {
    setQuery(value);

    if (skipNextRef.current) {
      skipNextRef.current = false;
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 3) {
      setResults([]);
      setShowResults(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&limit=6&accept-language=tr&addressdetails=1&extratags=1`;
        const res = await fetch(url, {
          headers: { "Accept-Language": "tr" },
        });
        const data: NominatimPlace[] = await res.json();

        // Önce sonuçları göster (görsel olmadan)
        const initial: PlaceResult[] = data.map((p) => ({ ...p }));
        setResults(initial);
        setShowResults(true);

        // Wikipedia görsellerini paralelde getir
        Promise.all(
          data.map(async (place, idx) => {
            const wikiTag = place.extratags?.wikipedia;
            const fallbackTitle =
              place.address?.city ||
              place.address?.town ||
              place.address?.village ||
              place.display_name.split(",")[0].trim();

            const thumbUrl = await fetchWikipediaThumb(wikiTag, fallbackTitle);
            return { idx, thumbUrl };
          })
        ).then((imgs) => {
          setResults((prev) => {
            const updated = [...prev];
            imgs.forEach(({ idx, thumbUrl }) => {
              if (updated[idx] && thumbUrl) {
                updated[idx] = { ...updated[idx], thumbUrl };
              }
            });
            return updated;
          });
        });
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);
  }

  function handleSelect(place: PlaceResult) {
    skipNextRef.current = true;
    setResults([]);
    setShowResults(false);
    const placeName =
      place.address?.city ||
      place.address?.town ||
      place.address?.village ||
      place.display_name.split(",")[0].trim();
    setQuery(placeName);
    onSelect(place);
  }

  function handleClear() {
    setQuery("");
    setResults([]);
    setShowResults(false);
  }

  function getPlaceLabel(place: PlaceResult) {
    const parts = place.display_name.split(",");
    const main = parts[0]?.trim();
    const secondary = parts.slice(1, 3).join(",").trim();
    return { main, secondary };
  }

  return (
    <div className="space-y-3">
      {/* Arama kutusu */}
      <div className="relative">
        <div className="flex items-center gap-2 rounded border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2.5 transition-colors duration-200 focus-within:border-[#c4a24b]">
          <MagnifyingGlass size={16} className="shrink-0 text-[var(--text-muted)]" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={() => results.length > 0 && setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 150)}
            placeholder="Şehir, ülke veya yer adı ara..."
            className="flex-1 bg-transparent text-[16px] text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none sm:text-sm"
          />
          {loading && (
            <div className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border border-[#c4a24b] border-t-transparent" />
          )}
          {query && !loading && (
            <button
              type="button"
              onClick={handleClear}
              className="shrink-0 text-[var(--text-muted)] transition-colors duration-200 hover:text-[var(--text-secondary)]"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Sonuçlar dropdown */}
        {showResults && results.length > 0 && (
          <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-80 overflow-y-auto rounded border border-[var(--border)] bg-[var(--bg-card)] shadow-[var(--shadow-card)]">
            {results.map((place) => {
              const { main, secondary } = getPlaceLabel(place);
              return (
                <button
                  key={place.place_id}
                  type="button"
                  onMouseDown={() => handleSelect(place)}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors duration-150 hover:bg-[var(--bg-raised)] active:opacity-80"
                >
                  {/* Thumbnail */}
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded bg-[var(--bg-raised)]">
                    {place.thumbUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={place.thumbUrl} alt={main} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <MapPin size={18} weight="fill" className="text-[var(--text-muted)]" />
                      </div>
                    )}
                  </div>

                  {/* Metin */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                      {main}
                    </p>
                    {secondary && (
                      <p className="truncate text-xs text-[var(--text-muted)]">{secondary}</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {showResults && results.length === 0 && !loading && query.length >= 3 && (
          <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3">
            <p className="text-sm text-[var(--text-muted)]">Sonuç bulunamadı</p>
          </div>
        )}
      </div>
    </div>
  );
}
