"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import TagBadge from "./TagBadge";

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

  const fetchSuggestions = useCallback(async (q: string) => {
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
  }, [value]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(input), 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [input, fetchSuggestions]);

  const addTag = (name: string) => {
    const normalized = name.toLowerCase().trim().replace(/\s+/g, "-");
    if (!normalized || value.includes(normalized) || value.length >= 10) return;
    if (!/^[a-z0-9\-]{1,30}$/.test(normalized)) return;
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
        className="flex flex-wrap gap-1.5 min-h-[42px] p-2 rounded-lg border border-[#2a2a2a] bg-[#0c0c0c] cursor-text focus-within:border-[#c9a84c]/50 transition-colors"
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
          <div className="relative flex-1 min-w-[120px]">
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
              placeholder={value.length === 0 ? "Etiket ekle (örn: sci-fi, drama)..." : ""}
              className="w-full bg-transparent text-[#f0ede8] text-sm outline-none placeholder:text-[#555555] py-0.5"
              maxLength={30}
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-[#161616] border border-[#2a2a2a] rounded-lg shadow-xl z-50 overflow-hidden">
                {suggestions.map((sug, i) => (
                  <button
                    key={sug.id}
                    type="button"
                    onMouseDown={() => addTag(sug.name)}
                    className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between transition-colors ${
                      i === activeIndex
                        ? "bg-[#c9a84c]/10 text-[#c9a84c]"
                        : "text-[#888888] hover:bg-[#1e1e1e] hover:text-[#f0ede8]"
                    }`}
                  >
                    <span>
                      <span className="text-[#c9a84c]/60">#</span>
                      {sug.name}
                    </span>
                    <span className="text-[#555555] text-xs">{sug.count}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <p className="text-xs text-[#555555]">
        Enter veya virgül ile ekle · Maks 10 etiket · {value.length}/10
      </p>
    </div>
  );
}
