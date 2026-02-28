"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import TagBadge from "./TagBadge";

function normalizeTag(raw: string): string {
  return raw.toLocaleLowerCase("tr-TR").trim().replace(/\s+/g, "-");
}

function isValidTag(tag: string) {
  return /^[a-z0-9çğıöşüâîû-]{1,30}$/.test(tag);
}

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  disabled?: boolean;
}

interface TagSuggestion {
  id: string;
  name: string;
  count: number;
}

export default function TagInput({ value, onChange, disabled }: TagInputProps) {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<TagSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchSuggestions = useCallback(
    async (q: string) => {
      if (!q.trim()) {
        setSuggestions([]);
        return;
      }
      try {
        const res = await fetch(`/api/tags?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setSuggestions(data.filter((t: TagSuggestion) => !value.includes(t.name)));
      } catch {
        setSuggestions([]);
      }
    },
    [value]
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(input), 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [input, fetchSuggestions]);

  const addTag = (name: string) => {
    const normalized = normalizeTag(name);
    if (!normalized || value.includes(normalized) || value.length >= 10) return;
    if (!isValidTag(normalized)) return;
    onChange([...value, normalized]);
    setInput("");
    setSuggestions([]);
    setShowSuggestions(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  const removeTag = (name: string) => {
    onChange(value.filter((t) => t !== name));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        addTag(suggestions[activeIndex].name);
      } else if (input.trim()) {
        addTag(input.trim());
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setActiveIndex(-1);
    } else if (e.key === "Backspace" && !input && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  return (
    <div className="space-y-2">
      <div
        className="flex min-h-[46px] cursor-text flex-wrap gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-2 transition-colors focus-within:border-[#c4a24b]/50"
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((name) => (
          <TagBadge
            key={name}
            tag={{ id: name, name }}
            onRemove={disabled ? undefined : removeTag}
          />
        ))}
        {!disabled && value.length < 10 && (
          <div className="relative min-w-[120px] flex-1">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setShowSuggestions(true);
                setActiveIndex(-1);
              }}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              placeholder={
                value.length === 0 ? "Etiket ekle (örn: bilim-kurgu, şehir-kaçamağı)..." : ""
              }
              className="w-full bg-transparent py-0.5 text-[16px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] sm:text-sm"
              maxLength={30}
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 top-full z-50 mt-1 w-full overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--bg-card)] shadow-xl sm:w-56">
                {suggestions.map((sug, i) => (
                  <button
                    key={sug.id}
                    type="button"
                    onMouseDown={() => addTag(sug.name)}
                    className={`flex w-full items-center justify-between px-3 py-3 text-left text-sm transition-colors ${
                      i === activeIndex
                        ? "bg-[#c4a24b]/10 text-[var(--gold)]"
                        : "text-[var(--text-secondary)] hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    <span>
                      <span className="text-[#c4a24b]/60">#</span>
                      {sug.name}
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">{sug.count}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <p className="text-[11px] text-[var(--text-muted)]">
        Enter veya virgül ile ekle · Maks 10 etiket · {value.length}/10
      </p>
    </div>
  );
}
