"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { CheckIcon } from "@phosphor-icons/react";
import TagBadge from "./TagBadge";
import { CATEGORY_EXAMPLE_TAGS } from "@/lib/post-config";
import { normalizeFixedCategory } from "@/lib/categories";
import {
  TAG_LIMIT,
  addTagsToList,
  cleanTagName,
  describeTagAddResult,
  hasTagSeparator,
  parseTagInput,
  splitTagInput,
} from "@/lib/tag-input";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  disabled?: boolean;
  /** Fixed category slug; drives the "Bu Kategoride Popüler" suggestions. */
  category?: string;
  /**
   * Text typed but not yet turned into a tag. The composer keeps it and commits it on save
   * (`mergePendingTagText`), so a tag typed without Enter is never lost.
   */
  onPendingChange?: (text: string) => void;
}

interface TagSuggestion {
  id: string;
  name: string;
  count: number;
}

const GROUP_SIZE = 8;
const OPTION_LIMIT = 8;
const MESSAGE_MS = 3500;

async function fetchTagList(url: string, signal?: AbortSignal): Promise<TagSuggestion[]> {
  try {
    const res = await fetch(url, { signal });
    if (!res.ok || !(res.headers.get("content-type") ?? "").includes("json")) return [];
    const data: unknown = await res.json();
    if (!Array.isArray(data)) return [];
    return data.filter(
      (item): item is TagSuggestion =>
        typeof item === "object" && item !== null && typeof item.name === "string"
    );
  } catch {
    return [];
  }
}

/* LAYOUT: chip field (added tags + text input) · combobox listbox under the input while
   typing · when the field is focused and empty, inline suggestion chips in two groups
   ("Sık Kullandıkların", "Bu Kategoride Popüler") · one helper/status line at the bottom. */
export default function TagInput({
  value,
  onChange,
  disabled,
  category,
  onPendingChange,
}: TagInputProps) {
  const baseId = useId();
  const inputId = `${baseId}-input`;
  const listboxId = `${baseId}-listbox`;
  const helperId = `${baseId}-helper`;
  const optionId = (index: number) => `${baseId}-option-${index}`;

  const [input, setInput] = useState("");
  const [remote, setRemote] = useState<TagSuggestion[]>([]);
  const [listOpen, setListOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [focused, setFocused] = useState(false);
  const [message, setMessage] = useState("");
  const [mine, setMine] = useState<TagSuggestion[] | null>(null);
  const [popular, setPopular] = useState<Record<string, TagSuggestion[]>>({});

  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestedRef = useRef<Set<string>>(new Set());

  const fixedCategory = normalizeFixedCategory(category) ?? "";
  const isFull = value.length >= TAG_LIMIT;

  const flash = useCallback((text: string) => {
    setMessage(text);
    if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
    if (text) messageTimerRef.current = setTimeout(() => setMessage(""), MESSAGE_MS);
  }, []);

  useEffect(
    () => () => {
      if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
    },
    []
  );

  useEffect(() => {
    onPendingChange?.(input);
  }, [input, onPendingChange]);

  // Suggestion chips load on first focus (per instance — never shared across accounts).
  useEffect(() => {
    if (!focused || disabled) return;
    if (!requestedRef.current.has("mine")) {
      requestedRef.current.add("mine");
      void fetchTagList(`/api/tags?mine=1&limit=${GROUP_SIZE + 4}`).then(setMine);
    }
    if (fixedCategory && !requestedRef.current.has(`category:${fixedCategory}`)) {
      requestedRef.current.add(`category:${fixedCategory}`);
      void fetchTagList(
        `/api/tags?category=${encodeURIComponent(fixedCategory)}&limit=${GROUP_SIZE + 4}`
      ).then((tags) => setPopular((prev) => ({ ...prev, [fixedCategory]: tags })));
    }
  }, [focused, disabled, fixedCategory]);

  const query = cleanTagName(input);

  // Typing: ask the server for matching tags (debounced, stale requests aborted).
  useEffect(() => {
    if (!query) {
      setRemote([]);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      void fetchTagList(
        `/api/tags?q=${encodeURIComponent(query)}&limit=10`,
        controller.signal
      ).then((tags) => {
        if (!controller.signal.aborted) setRemote(tags);
      });
    }, 220);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const mineNames = useMemo(() => (mine ?? []).map((tag) => tag.name).slice(0, GROUP_SIZE), [mine]);
  const popularNames = useMemo(() => {
    if (!fixedCategory) return [];
    const examples = CATEGORY_EXAMPLE_TAGS[fixedCategory as keyof typeof CATEGORY_EXAMPLE_TAGS];
    const names = [...(popular[fixedCategory] ?? []).map((tag) => tag.name), ...(examples ?? [])];
    const seen = new Set(mineNames);
    return names
      .filter((name) => {
        if (seen.has(name)) return false;
        seen.add(name);
        return true;
      })
      .slice(0, GROUP_SIZE);
  }, [fixedCategory, popular, mineNames]);

  const options = useMemo(() => {
    if (!query) return [];
    const taken = new Set(value);
    const out: { name: string; count: number | null }[] = [];
    const push = (name: string, count: number | null) => {
      if (taken.has(name) || out.length >= OPTION_LIMIT) return;
      taken.add(name);
      out.push({ name, count });
    };
    (mine ?? []).filter((tag) => tag.name.startsWith(query)).forEach((t) => push(t.name, t.count));
    popularNames.filter((name) => name.startsWith(query)).forEach((name) => push(name, null));
    remote.forEach((tag) => push(tag.name, tag.count));
    return out;
  }, [query, value, mine, popularNames, remote]);

  const showList = listOpen && focused && options.length > 0;
  const chipsLoading = mine === null;
  const showChips =
    focused &&
    !disabled &&
    !input.trim() &&
    (chipsLoading || mineNames.length > 0 || popularNames.length > 0);

  const addMany = (candidates: string[], { keepInput = false } = {}) => {
    if (candidates.length === 0) return;
    const result = addTagsToList(value, candidates);
    if (result.added.length > 0) onChange(result.tags);
    flash(describeTagAddResult(result));
    if (!keepInput) setInput("");
    setActiveIndex(-1);
  };

  const commitText = (text: string) => {
    if (!text.trim()) return;
    const tags = parseTagInput(text);
    if (tags.length === 0) {
      flash("Bu etikette kullanılabilir bir karakter yok.");
      setInput("");
      return;
    }
    addMany(tags);
  };

  const pickOption = (name: string) => {
    addMany([name]);
    setListOpen(false);
    inputRef.current?.focus();
  };

  const toggleChip = (name: string) => {
    if (value.includes(name)) {
      onChange(value.filter((tag) => tag !== name));
      return;
    }
    addMany([name], { keepInput: true });
  };

  const removeTag = (name: string) => {
    onChange(value.filter((tag) => tag !== name));
    flash(`#${name} kaldırıldı.`);
  };

  const handleChange = (raw: string) => {
    const next = raw.slice(0, 300);
    if (hasTagSeparator(next)) {
      // "a, b; c" (typed or from an Android keyboard): commit every finished part.
      const parts = splitTagInput(next);
      const rest = parts.pop() ?? "";
      addMany(parts.map(cleanTagName).filter(Boolean), { keepInput: true });
      setInput(rest.trimStart());
    } else {
      setInput(next);
    }
    setListOpen(true);
    setActiveIndex(-1);
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData("text");
    if (!hasTagSeparator(pasted) && !/[\r\n]/.test(pasted)) return;
    event.preventDefault();
    commitText(`${input}${pasted}`);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const active = showList && activeIndex >= 0 ? options[activeIndex] : undefined;

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      if (options.length === 0) return;
      event.preventDefault();
      setListOpen(true);
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((index) => {
        const next = index + step;
        if (next < -1) return options.length - 1;
        if (next >= options.length) return -1;
        return next;
      });
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (active) pickOption(active.name);
      else commitText(input);
    } else if (event.key === "Tab" && active) {
      event.preventDefault();
      pickOption(active.name);
    } else if (event.key === "," || event.key === ";") {
      event.preventDefault();
      commitText(input);
    } else if (event.key === "Escape") {
      if (showList) {
        event.preventDefault();
        setListOpen(false);
        setActiveIndex(-1);
      }
    } else if (event.key === "Backspace" && !input && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  const handleWrapperBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    if (wrapperRef.current?.contains(event.relatedTarget as Node | null)) return;
    setFocused(false);
    setListOpen(false);
    setActiveIndex(-1);
  };

  const preview = query && query !== input.trim().replace(/^#+/, "") ? query : "";
  const helperText =
    message ||
    (preview
      ? `#${preview} olarak eklenecek.`
      : isFull
        ? `En fazla ${TAG_LIMIT} etiket ekleyebilirsin.`
        : "Enter, Tab ya da virgülle ekle; boşluklar tireye dönüşür.");

  const chipClass = (selected: boolean) =>
    `inline-flex cursor-pointer items-center gap-1 rounded-full border px-2.5 py-1 text-[12px] font-medium transition-colors duration-200 ease-out-expo focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-40 ${
      selected
        ? "border-accent/40 bg-accent/10 text-[var(--gold)]"
        : "border-[var(--border)] bg-[var(--bg-raised)] text-[var(--text-secondary)] hover:border-accent/35 hover:text-[var(--text-primary)]"
    }`;

  const renderGroup = (label: string, names: string[]) =>
    names.length > 0 && (
      <div role="group" aria-label={label}>
        <p className="mb-1.5 text-[12px] font-medium text-[var(--text-muted)]">{label}</p>
        <div className="flex flex-wrap gap-1.5">
          {names.map((name) => {
            const selected = value.includes(name);
            return (
              <button
                key={name}
                type="button"
                aria-pressed={selected}
                disabled={!selected && isFull}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => toggleChip(name)}
                className={chipClass(selected)}
              >
                {selected && <CheckIcon size={11} weight="bold" aria-hidden />}#{name}
              </button>
            );
          })}
        </div>
      </div>
    );

  return (
    <div
      ref={wrapperRef}
      className="space-y-2"
      onFocus={() => setFocused(true)}
      onBlur={handleWrapperBlur}
    >
      <div
        className="flex min-h-[46px] cursor-text flex-wrap items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-2 transition-colors focus-within:border-accent/50"
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((name) => (
          <TagBadge
            key={name}
            tag={{ id: name, name }}
            onRemove={disabled ? undefined : removeTag}
          />
        ))}
        {!disabled && (
          <div className="relative min-w-[120px] flex-1">
            <input
              ref={inputRef}
              id={inputId}
              type="text"
              role="combobox"
              aria-label="Etiket ekle"
              aria-autocomplete="list"
              aria-expanded={showList}
              aria-controls={listboxId}
              aria-activedescendant={
                showList && activeIndex >= 0 ? optionId(activeIndex) : undefined
              }
              aria-describedby={helperId}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              enterKeyHint="done"
              value={input}
              onChange={(event) => handleChange(event.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              onBlur={() => commitText(input)}
              placeholder={
                isFull
                  ? "Etiket sınırına ulaştın"
                  : value.length === 0
                    ? "Etiket yaz (örn. bilim kurgu, #festival)"
                    : "Bir etiket daha…"
              }
              className="w-full bg-transparent py-0.5 text-[16px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] sm:text-sm"
            />
            <ul
              id={listboxId}
              role="listbox"
              aria-label="Etiket önerileri"
              hidden={!showList}
              className="absolute left-0 top-full z-50 mt-1 w-full min-w-[200px] overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--bg-card)] py-1 shadow-xl sm:w-60"
            >
              {showList &&
                options.map((option, index) => (
                  <li
                    key={option.name}
                    id={optionId(index)}
                    role="option"
                    aria-selected={index === activeIndex}
                    onMouseDown={(event) => event.preventDefault()}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => pickOption(option.name)}
                    className={`flex cursor-pointer items-center justify-between gap-3 px-3 py-2.5 text-sm transition-colors ${
                      index === activeIndex
                        ? "bg-accent/10 text-[var(--gold)]"
                        : "text-[var(--text-secondary)]"
                    }`}
                  >
                    <span className="truncate">
                      <span className="text-accent/60">#</span>
                      {option.name}
                    </span>
                    {option.count !== null && option.count > 0 && (
                      <span className="dn-mono shrink-0 text-[12px] text-[var(--text-muted)]">
                        {option.count}
                      </span>
                    )}
                  </li>
                ))}
            </ul>
          </div>
        )}
      </div>

      {showChips && (
        <div className="space-y-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-raised)] p-3">
          {chipsLoading && mineNames.length === 0 && popularNames.length === 0 ? (
            <p className="text-[12px] font-medium text-[var(--text-muted)]">Öneriler yükleniyor…</p>
          ) : (
            <>
              {renderGroup("Sık Kullandıkların", mineNames)}
              {renderGroup("Bu Kategoride Popüler", popularNames)}
            </>
          )}
        </div>
      )}

      <p
        id={helperId}
        role="status"
        aria-live="polite"
        className={`text-[12px] font-medium ${
          message ? "text-[var(--text-secondary)]" : "text-[var(--text-muted)]"
        }`}
      >
        {helperText}
      </p>
    </div>
  );
}
