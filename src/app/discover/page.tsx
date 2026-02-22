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
      const url = q.trim()
        ? `/api/users/search?q=${encodeURIComponent(q)}`
        : "/api/users/search";
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="mb-8 pb-5 border-b border-[#2a2a2a]">
          <h1 className="text-2xl font-bold text-[#f0ede8] mb-1">Topluluk</h1>
          <p className="text-sm text-[#555555]">
            Kullanıcıları ara, profillerini incele ve notlarını keşfet
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555555]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="İsim veya @kullanıcıadı ara..."
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-[#161616] border border-[#2a2a2a] text-[#f0ede8] placeholder-[#555555] text-sm focus:outline-none focus:border-[#c9a84c]/50 transition-colors"
          />
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="rounded-xl bg-[#161616] border border-[#2a2a2a] h-24 animate-pulse" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 rounded-full bg-[#161616] border border-[#2a2a2a] flex items-center justify-center mx-auto mb-4">
              <svg className="w-5 h-5 text-[#555555]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <p className="text-[#555555] text-sm">
              {query ? "Kullanıcı bulunamadı." : "Henüz herkese açık profil yok."}
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs text-[#555555] mb-4">{users.length} kullanıcı bulundu</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
