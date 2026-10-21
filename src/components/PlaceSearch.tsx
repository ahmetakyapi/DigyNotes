"use client";

import { useEffect, useRef, useState } from "react";
import { MagnifyingGlassIcon, MapPinIcon, XIcon } from "@phosphor-icons/react";
import { fetchWikipediaThumb } from "@/lib/wikipedia";

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

// Nominatim kullanım politikası: uygulama başına en fazla saniyede bir istek
const SEARCH_DEBOUNCE_MS = 1000;

export default function PlaceSearch({ onSelect }: PlaceSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  // Her arama, seçim ve temizleme sırayı artırır; eski yanıtlar ve görseller yok sayılır
  const requestSequenceRef = useRef(0);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    []
  );

  function cancelPendingSearch() {
    requestSequenceRef.current += 1;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setLoading(false);
    setError(false);
  }

  function handleChange(value: string) {
    setQuery(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    const requestId = ++requestSequenceRef.current;
    setError(false);

    if (value.trim().length < 3) {
      setResults([]);
      setShowResults(false);
      setLoading(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&limit=6&accept-language=tr&addressdetails=1&extratags=1`;
        const res = await fetch(url, {
          headers: { "Accept-Language": "tr" },
        });
        if (!res.ok) throw new Error(String(res.status));
        const data: NominatimPlace[] = await res.json();
        if (requestSequenceRef.current !== requestId) return;

        // Önce sonuçları göster (görsel olmadan)
        const initial: PlaceResult[] = data.map((p) => ({ ...p }));
        setResults(initial);
        setShowResults(true);

        // Wikipedia görsellerini paralelde getir; place_id ile eşle
        void Promise.all(
          data.map(async (place) => {
            const wikiTag = place.extratags?.wikipedia;
            const fallbackTitle =
              place.address?.city ||
              place.address?.town ||
              place.address?.village ||
              place.display_name.split(",")[0].trim();

            const thumbUrl = await fetchWikipediaThumb(wikiTag, fallbackTitle);
            return { id: place.place_id, thumbUrl };
          })
        ).then((imgs) => {
          if (requestSequenceRef.current !== requestId) return;
          const thumbsById = new Map(imgs.map(({ id, thumbUrl }) => [id, thumbUrl] as const));
          setResults((prev) =>
            prev.map((place) => {
              const thumbUrl = thumbsById.get(place.place_id);
              return thumbUrl ? { ...place, thumbUrl } : place;
            })
          );
        });
      } catch {
        if (requestSequenceRef.current !== requestId) return;
        setResults([]);
        setError(true);
        setShowResults(true);
      } finally {
        if (requestSequenceRef.current === requestId) setLoading(false);
      }
    }, SEARCH_DEBOUNCE_MS);
  }

  function handleSelect(place: PlaceResult) {
    cancelPendingSearch();
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
    cancelPendingSearch();
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
      <div
        ref={wrapperRef}
        className="relative"
        onBlur={(e) => {
          // Odak bileşenin dışına çıkınca kapat (Tab ile sonuçlara geçmek açık tutar)
          if (!wrapperRef.current?.contains(e.relatedTarget as Node | null)) {
            setShowResults(false);
          }
        }}
      >
        <div className="flex items-center gap-2 rounded border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2.5 transition-colors duration-200 focus-within:border-accent">
          <MagnifyingGlassIcon size={16} className="shrink-0 text-[var(--text-muted)]" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={() => results.length > 0 && setShowResults(true)}
            aria-label="Konum ara"
            placeholder="Şehir, ülke veya yer adı ara..."
            className="flex-1 bg-transparent text-[16px] text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none sm:text-sm"
          />
          {loading && (
            <div className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border border-accent border-t-transparent" />
          )}
          {query && !loading && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Aramayı temizle"
              className="shrink-0 cursor-pointer rounded-full text-[var(--text-muted)] transition-colors duration-200 hover:text-[var(--text-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              <XIcon size={14} />
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
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(place)}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors duration-150 hover:bg-[var(--bg-raised)] focus-visible:bg-[var(--bg-raised)] focus-visible:outline-none active:opacity-80"
                >
                  {/* Thumbnail */}
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded bg-[var(--bg-raised)]">
                    {place.thumbUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={place.thumbUrl} alt={main} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <MapPinIcon size={18} weight="fill" className="text-[var(--text-muted)]" />
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
            <p className="text-sm text-[var(--text-muted)]">
              {error
                ? "Konum araması şu an yanıt vermiyor, biraz sonra tekrar dene."
                : "Sonuç bulunamadı"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
