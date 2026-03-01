"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { MagnifyingGlass, X, ArrowLeft, UserCircle } from "@phosphor-icons/react";
import { AvatarImage } from "@/components/AvatarImage";

interface UserResult {
  id: string;
  name: string;
  username: string | null;
  avatarUrl: string | null;
}

interface SearchBarProps {
  mobileMode?: "compact" | "full";
}

export function SearchBar({ mobileMode = "compact" }: SearchBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [userResults, setUserResults] = useState<UserResult[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) {
      // Slight delay so the overlay renders first
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    setQuery(searchParams.get("q") ?? "");
  }, [searchParams]);

  // Open search when keyboard shortcut triggers focus on search input
  useEffect(() => {
    const handleFocusIn = () => {
      if (!open) setOpen(true);
    };
    const input = inputRef.current;
    input?.addEventListener("focus", handleFocusIn);
    return () => input?.removeEventListener("focus", handleFocusIn);
  }, [open]);

  // Desktop: close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setUserResults([]);
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Lock body scroll on mobile when overlay is open
  useEffect(() => {
    if (!open) return;
    const isMobile = window.matchMedia("(max-width: 639px)").matches;
    if (!isMobile) return;

    // Save scroll position and lock body — prevents layout shift
    const scrollY = window.scrollY;
    const { style } = document.documentElement;
    style.setProperty("--scroll-lock-top", `-${scrollY}px`);
    document.documentElement.classList.add("dn-scroll-locked");

    return () => {
      document.documentElement.classList.remove("dn-scroll-locked");
      style.removeProperty("--scroll-lock-top");
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const searchUsers = useCallback(async (q: string) => {
    if (!q) {
      setUserResults([]);
      return;
    }
    setLoadingUsers(true);
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setUserResults(Array.isArray(data) ? data.slice(0, 6) : []);
      }
    } catch {
      setUserResults([]);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);

    if (val.startsWith("@")) {
      const userQuery = val.slice(1).trim();
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => searchUsers(userQuery), 300);
    } else {
      setUserResults([]);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    }
  };

  const closeSearch = () => {
    setOpen(false);
    setUserResults([]);
  };

  const buildNotesHref = useCallback(
    (q: string) => {
      const params =
        pathname === "/notes"
          ? new URLSearchParams(searchParams.toString())
          : new URLSearchParams();

      if (q.trim()) {
        params.set("q", q.trim());
      } else {
        params.delete("q");
      }

      const nextQuery = params.toString();
      return nextQuery ? `/notes?${nextQuery}` : "/notes";
    },
    [pathname, searchParams]
  );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q.startsWith("@")) {
      const username = q.slice(1).trim().replace(/^@+/, "");
      if (username) {
        router.push(`/profile/${encodeURIComponent(username)}`);
      }
      closeSearch();
      return;
    }
    if (q) {
      router.push(buildNotesHref(q));
    } else {
      router.push(buildNotesHref(""));
    }
    closeSearch();
  };

  const clear = () => {
    setQuery("");
    setUserResults([]);
    router.push(buildNotesHref(""));
    closeSearch();
  };

  const selectUser = (username: string | null) => {
    if (!username) return;
    router.push(`/profile/${encodeURIComponent(username)}`);
    setQuery("");
    setUserResults([]);
    closeSearch();
  };

  const isUserMode = query.startsWith("@");
  const isMobileFull = mobileMode === "full";

  /* ── Trigger button (closed state) ── */
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className={
          isMobileFull
            ? "flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 text-[var(--text-secondary)] transition-colors duration-200 hover:text-[var(--gold)]"
            : "flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-secondary)] shadow-[0_6px_18px_rgba(3,8,20,0.24)] transition-colors duration-200 hover:text-[var(--gold)] sm:h-10 sm:w-auto sm:rounded-lg sm:border-[var(--border)] sm:bg-[var(--bg-card)] sm:px-3 sm:shadow-[var(--shadow-soft)]"
        }
        title="Ara"
      >
        <MagnifyingGlass size={16} />
        {isMobileFull && <span className="text-xs font-medium">Ara</span>}
      </button>
    );
  }

  /* ── Shared results content ── */
  const resultsContent = (
    <>
      {/* User results */}
      {isUserMode && query.length > 1 && (
        <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--bg-card)] sm:absolute sm:left-0 sm:right-0 sm:top-full sm:z-50 sm:mt-1">
          {loadingUsers ? (
            <div className="px-4 py-3 text-sm text-[var(--text-muted)]">Aranıyor...</div>
          ) : userResults.length === 0 ? (
            <div className="px-4 py-3 text-sm text-[var(--text-muted)]">
              Kullanıcı bulunamadı. Enter ile profile gitmeyi deneyebilirsin.
            </div>
          ) : (
            userResults.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => selectUser(u.username)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors duration-200 hover:bg-[var(--bg-raised)] active:opacity-80"
              >
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--border)] bg-[var(--bg-raised)] text-xs font-bold text-[var(--gold)]">
                  <AvatarImage
                    src={u.avatarUrl}
                    alt={u.name}
                    name={u.name}
                    size={28}
                    className="h-full w-full object-cover"
                    textClassName="text-xs font-bold text-[var(--gold)]"
                  />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                    {u.name}
                  </p>
                  {u.username && (
                    <p className="truncate text-xs text-[var(--text-muted)]">@{u.username}</p>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {/* Hint when @ typed but no username yet */}
      {query === "@" && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3 sm:absolute sm:left-0 sm:right-0 sm:top-full sm:z-50 sm:mt-1">
          <p className="text-xs text-[var(--text-muted)]">Kullanıcı adı yazmaya başla...</p>
        </div>
      )}
    </>
  );

  /* ── Mobile: fullscreen overlay (YouTube-style) ── */
  /* ── Desktop: inline input (as before) ── */
  return (
    <>
      {/* ▸ Mobile fullscreen overlay */}
      <div
        className="fixed inset-0 z-[60] flex flex-col bg-[var(--bg-base)] sm:hidden"
        style={{ height: "100dvh" }}
      >
        {/* Top bar */}
        <div
          className="flex items-center gap-2 border-b border-[var(--border)] bg-[var(--bg-header)] px-3 pb-3 pt-4"
          style={{ paddingTop: "max(1rem, env(safe-area-inset-top, 1rem))" }}
        >
          <button
            type="button"
            onClick={closeSearch}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
          >
            <ArrowLeft size={20} weight="bold" />
          </button>
          <form
            onSubmit={submit}
            className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2.5"
          >
            {isUserMode ? (
              <UserCircle size={14} className="flex-shrink-0 text-[var(--gold)]" weight="bold" />
            ) : (
              <MagnifyingGlass size={14} className="flex-shrink-0 text-[var(--text-muted)]" />
            )}
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleChange}
              placeholder="Ara... veya @kullanıcı"
              data-search-input="true"
              className="min-w-0 flex-1 bg-transparent text-[16px] leading-tight text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none sm:text-sm"
              onKeyDown={(e) => e.key === "Escape" && closeSearch()}
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setUserResults([]);
                }}
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded text-[var(--text-muted)] transition-colors hover:text-[var(--text-secondary)]"
              >
                <X size={12} />
              </button>
            )}
          </form>
        </div>

        {/* Results area */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-3">
          {!query.trim() && (
            <div className="py-12 text-center">
              <MagnifyingGlass size={32} className="mx-auto mb-3 text-[var(--text-faint)]" />
              <p className="text-sm text-[var(--text-muted)]">Not başlığı veya @kullanıcı ara</p>
            </div>
          )}
          {resultsContent}
        </div>
      </div>

      {/* ▸ Desktop inline (unchanged behaviour) */}
      <div ref={containerRef} className="relative hidden sm:block">
        <form
          onSubmit={submit}
          className={`flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-1.5 shadow-[var(--shadow-soft)] ${
            isMobileFull ? "w-full" : ""
          }`}
        >
          {isUserMode ? (
            <UserCircle size={13} className="flex-shrink-0 text-[var(--gold)]" weight="bold" />
          ) : (
            <MagnifyingGlass size={13} className="flex-shrink-0 text-[var(--text-muted)]" />
          )}
          <input
            type="text"
            value={query}
            onChange={handleChange}
            placeholder="Ara... veya @kullanıcı"
            data-search-input="true"
            className={`bg-transparent text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none ${
              isMobileFull ? "min-w-0 flex-1" : "w-52"
            }`}
            onKeyDown={(e) => e.key === "Escape" && closeSearch()}
          />
          {query && (
            <button
              type="button"
              onClick={clear}
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded text-[var(--text-muted)] transition-colors duration-200 hover:text-[var(--text-secondary)]"
            >
              <X size={11} />
            </button>
          )}
        </form>

        {resultsContent}
      </div>
    </>
  );
}
