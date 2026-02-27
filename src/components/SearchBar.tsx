"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MagnifyingGlass, X, UserCircle } from "@phosphor-icons/react";

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
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [userResults, setUserResults] = useState<UserResult[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

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

  const searchUsers = useCallback(async (q: string) => {
    if (!q) { setUserResults([]); return; }
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

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q.startsWith("@")) return;
    if (q) {
      router.push(`/notes?q=${encodeURIComponent(q)}`);
    } else {
      router.push("/notes");
    }
    setOpen(false);
    setUserResults([]);
  };

  const clear = () => {
    setQuery("");
    setUserResults([]);
    router.push("/notes");
    setOpen(false);
  };

  const selectUser = (username: string | null) => {
    if (!username) return;
    router.push(`/profile/${username}`);
    setQuery("");
    setUserResults([]);
    setOpen(false);
  };

  const isUserMode = query.startsWith("@");
  const isMobileFull = mobileMode === "full";

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className={
          isMobileFull
            ? "flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 text-[var(--text-secondary)] transition-colors duration-200 hover:text-[var(--gold)]"
            : "flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-secondary)] shadow-[0_6px_18px_rgba(3,8,20,0.24)] transition-colors duration-200 hover:text-[var(--gold)] sm:h-10 sm:w-10 sm:rounded-lg sm:border-transparent sm:bg-transparent sm:shadow-none"
        }
        title="Ara"
      >
        <MagnifyingGlass size={16} />
        {isMobileFull && (
          <span className="dn-display text-xs font-medium tracking-[0.01em]">Ara</span>
        )}
      </button>
    );
  }

  return (
    <div ref={containerRef} className="relative">
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
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          placeholder="Ara... veya @kullanıcı"
          className={`bg-transparent text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none ${
            isMobileFull ? "min-w-0 flex-1" : "w-[min(58vw,220px)] sm:w-52"
          }`}
          onKeyDown={(e) => e.key === "Escape" && (setOpen(false), setUserResults([]))}
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

      {/* User results dropdown */}
      {isUserMode && query.length > 1 && (userResults.length > 0 || loadingUsers) && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--bg-card)]">
          {loadingUsers && userResults.length === 0 ? (
            <div className="px-4 py-3 text-sm text-[var(--text-muted)]">Aranıyor...</div>
          ) : (
            userResults.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => selectUser(u.username)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors duration-200 hover:bg-[var(--bg-raised)] active:opacity-80"
              >
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--bg-raised)] text-xs font-bold text-[var(--gold)] border border-[var(--border)]">
                  {u.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={u.avatarUrl} alt={u.name} className="h-full w-full object-cover" />
                  ) : (
                    u.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[var(--text-primary)]">{u.name}</p>
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
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3">
          <p className="text-xs text-[var(--text-muted)]">Kullanıcı adı yazmaya başla...</p>
        </div>
      )}
    </div>
  );
}
