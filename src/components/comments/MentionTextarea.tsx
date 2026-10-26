"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type RefObject } from "react";
import { AvatarImage } from "@/components/AvatarImage";
import { getActiveMention, insertMention } from "@/lib/mentions";
import type { CommentUser } from "./types";

type Suggestion = CommentUser & { username: string };

interface MentionTextareaProps {
  postId: string;
  value: string;
  onChange: (value: string) => void;
  /** Cmd/Ctrl+Enter. */
  onSubmit: () => void;
  placeholder: string;
  ariaLabel: string;
  rows?: number;
  maxLength?: number;
  className?: string;
  textareaRef?: RefObject<HTMLTextAreaElement | null>;
}

/* Suggestions per query, shared by every box on the page (composer and replies). */
const suggestionCache = new Map<string, Suggestion[]>();

/**
 * Textarea with `@` suggestions: typing `@` + letters opens a list of people (this
 * conversation first, then people the viewer follows); ↑ ↓ move, Enter/Tab picks, Esc
 * closes, a click picks. Picking inserts `@username `.
 */
export function MentionTextarea({
  postId,
  value,
  onChange,
  onSubmit,
  placeholder,
  ariaLabel,
  rows = 3,
  maxLength = 1000,
  className = "",
  textareaRef,
}: MentionTextareaProps) {
  const ownRef = useRef<HTMLTextAreaElement>(null);
  const ref = textareaRef ?? ownRef;
  const listId = useId();
  const [active, setActive] = useState<{ query: string; start: number } | null>(null);
  const [dismissedAt, setDismissedAt] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const query = active?.query ?? null;

  useEffect(() => {
    if (query === null) {
      setSuggestions([]);
      return;
    }

    const key = `${postId}:${query.toLocaleLowerCase("tr")}`;
    const cached = suggestionCache.get(key);
    if (cached) {
      setSuggestions(cached);
      setActiveIndex(0);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      fetch(`/api/posts/${postId}/mentions?q=${encodeURIComponent(query)}`, {
        signal: controller.signal,
      })
        .then((response) => (response.ok ? response.json() : { users: [] }))
        .then((data: { users?: CommentUser[] }) => {
          const users = (Array.isArray(data.users) ? data.users : []).filter(
            (user): user is Suggestion => Boolean(user.username)
          );
          suggestionCache.set(key, users);
          setSuggestions(users);
          setActiveIndex(0);
        })
        .catch(() => {});
    }, 120);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [postId, query]);

  const open = active !== null && dismissedAt !== active.start && suggestions.length > 0;

  const syncActive = (text: string, caret: number | null) => {
    const next = caret === null ? null : getActiveMention(text, caret);
    setActive((prev) => (prev?.query === next?.query && prev?.start === next?.start ? prev : next));
    if (!next) setDismissedAt(null);
  };

  const pick = (user: Suggestion) => {
    const element = ref.current;
    if (!active || !element) return;

    const result = insertMention(value, active.start, element.selectionStart, user.username);
    onChange(result.text);
    setActive(null);
    window.requestAnimationFrame(() => {
      element.focus();
      element.setSelectionRange(result.caret, result.caret);
    });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.nativeEvent.isComposing) return;

    if (open) {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const step = event.key === "ArrowDown" ? 1 : -1;
        setActiveIndex((index) => (index + step + suggestions.length) % suggestions.length);
        return;
      }
      if ((event.key === "Enter" && !event.metaKey && !event.ctrlKey) || event.key === "Tab") {
        event.preventDefault();
        pick(suggestions[Math.min(activeIndex, suggestions.length - 1)]);
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        setDismissedAt(active.start);
        return;
      }
    }

    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="relative">
      <textarea
        ref={ref}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          syncActive(event.target.value, event.target.selectionStart);
        }}
        onKeyDown={handleKeyDown}
        onKeyUp={(event) => {
          if (
            event.key === "ArrowLeft" ||
            event.key === "ArrowRight" ||
            event.key === "Home" ||
            event.key === "End"
          ) {
            syncActive(event.currentTarget.value, event.currentTarget.selectionStart);
          }
        }}
        onClick={(event) =>
          syncActive(event.currentTarget.value, event.currentTarget.selectionStart)
        }
        onBlur={() => setActive(null)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        aria-autocomplete="list"
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open ? `${listId}-${activeIndex}` : undefined}
        rows={rows}
        maxLength={maxLength}
        className={className}
      />

      {open && (
        /* LAYOUT: Popover under the field · avatar, name, @username per row. */
        <ul
          id={listId}
          role="listbox"
          aria-label="Kişi önerileri"
          className="absolute inset-x-0 top-full z-30 mt-1.5 max-h-72 overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-1.5 shadow-[0_18px_40px_-18px_rgb(var(--ink-rgb)/0.55)]"
        >
          {suggestions.map((user, index) => (
            <li
              key={user.id}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              onMouseDown={(event) => {
                event.preventDefault();
                pick(user);
              }}
              onMouseEnter={() => setActiveIndex(index)}
              className={`flex cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2 transition-colors ${
                index === activeIndex ? "bg-accent/10" : "hover:bg-[var(--bg-raised)]"
              }`}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent/10 ring-1 ring-accent/20">
                <AvatarImage
                  src={user.avatarUrl}
                  alt={user.name}
                  name={user.name}
                  size={28}
                  className="h-full w-full object-cover"
                  textClassName="text-[11px] font-bold text-accent"
                />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold text-[var(--text-primary)]">
                  {user.name}
                </span>
                <span className="block truncate text-[12px] font-medium text-[var(--text-muted)]">
                  @{user.username}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
