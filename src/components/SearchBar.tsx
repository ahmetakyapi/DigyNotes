"use client";
import React, { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FaSearch, FaTimes } from "react-icons/fa";

export function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q) {
      router.push(`/notes?q=${encodeURIComponent(q)}`);
    } else {
      router.push("/notes");
    }
    setOpen(false);
  };

  const clear = () => {
    setQuery("");
    router.push("/notes");
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex h-10 w-10 items-center justify-center rounded-md text-[#8892b0] transition-colors hover:text-[#c9a84c]"
        title="Ara"
      >
        <FaSearch size={14} />
      </button>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="flex items-center gap-2 rounded-lg border border-[#2a2a2a] bg-[#161616] px-3 py-1.5"
    >
      <FaSearch size={12} className="flex-shrink-0 text-[#555555]" />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Başlık veya yazar ara..."
        className="w-20 bg-transparent text-sm text-[#f0ede8] placeholder-[#555555] outline-none sm:w-44"
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
      />
      {query && (
        <button
          type="button"
          onClick={clear}
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded text-[#555555] transition-colors hover:text-[#888]"
        >
          <FaTimes size={11} />
        </button>
      )}
    </form>
  );
}
