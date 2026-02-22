"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import UserCard from "@/components/UserCard";

interface PublicUser {
  id: string;
  name: string;
  username: string | null;
  bio: string | null;
  avatarUrl: string | null;
  postCount: number;
}

export default function DiscoverPage() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchUsers = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const url = q.trim() ? `/api/users/search?q=${encodeURIComponent(q)}` : "/api/users/search";
      const res = await fetch(url);
      const data = await res.json();
      setUsers(data);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers("");
  }, [fetchUsers]);

  const handleSearch = (val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchUsers(val), 400);
  };

  return (
    <main className="min-h-screen py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8 border-b border-[#2a2a2a] pb-5">
          <h1 className="mb-1 text-2xl font-bold text-[#f0ede8]">Topluluk</h1>
          <p className="text-sm text-[#555555]">
            Kullanıcıları ara, profillerini incele ve notlarını keşfet
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <svg
            className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#555555]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z"
            />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="İsim veya @kullanıcıadı ara..."
            className="w-full rounded-xl border border-[#2a2a2a] bg-[#161616] py-3 pl-11 pr-4 text-sm text-[#f0ede8] placeholder-[#555555] transition-colors focus:border-[#c9a84c]/50 focus:outline-none"
          />
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-24 animate-pulse rounded-xl border border-[#2a2a2a] bg-[#161616]"
              />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="py-20 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-[#2a2a2a] bg-[#161616]">
              <svg
                className="h-5 w-5 text-[#555555]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <p className="text-sm text-[#555555]">
              {query ? "Kullanıcı bulunamadı." : "Henüz herkese açık profil yok."}
            </p>
          </div>
        ) : (
          <>
            <p className="mb-4 text-xs text-[#555555]">{users.length} kullanıcı bulundu</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {users.map((user) => (
                <UserCard key={user.id} user={user} />
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
