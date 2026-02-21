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
        className="flex items-center justify-center w-8 h-8 rounded-md text-[#8892b0] hover:text-[#c9a84c] transition-colors"
        title="Ara"
      >
        <FaSearch size={14} />
      </button>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="flex items-center gap-2 bg-[#161616] border border-[#2a2a2a] rounded-lg px-3 py-1.5"
    >
      <FaSearch size={12} className="text-[#555555] flex-shrink-0" />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Başlık veya yazar ara..."
        className="bg-transparent text-sm text-[#f0ede8] placeholder-[#555555] outline-none w-20 sm:w-44"
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
      />
      {query && (
        <button type="button" onClick={clear} className="text-[#555555] hover:text-[#888] transition-colors">
          <FaTimes size={11} />
        </button>
      )}
    </form>
  );
}
