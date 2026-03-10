"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { MagnifyingGlass, UsersThree } from "@phosphor-icons/react";
import UserCard from "@/components/UserCard";

interface PublicUser {
  id: string;
  name: string;
  username: string | null;
  bio: string | null;
  avatarUrl: string | null;
  lastSeenAt: string | null;
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
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <header className="mb-8 rounded-[32px] border border-[var(--border)] bg-[linear-gradient(180deg,rgba(18,26,45,0.88),rgba(10,16,30,0.72))] p-6 shadow-[var(--shadow-soft)] sm:p-7">
          <span className="bg-[#c4a24b]/8 inline-flex rounded-full border border-[#c4a24b]/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--gold)]">
            Keşfet
          </span>
          <h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-[-0.03em] text-[var(--text-primary)] sm:text-4xl">
            Topluluktaki Kişileri Keşfet
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)] sm:text-[15px]">
            Yeni profiller bul, arşivlerine göz at ve ilgi alanlarını keşfet.
          </p>

          <label className="relative mt-5 block w-full sm:max-w-md">
            <MagnifyingGlass
              size={16}
              weight="bold"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="İsim veya @ ile kullanıcı ara..."
              className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-base)] pl-10 pr-3 text-[16px] text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--gold)] sm:text-sm"
            />
          </label>
        </header>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-40 animate-pulse rounded-[26px] border border-[var(--border)] bg-[var(--bg-card)]"
              />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-[var(--border)] bg-[var(--bg-card)] px-6 py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#c4a24b]/10 text-[var(--gold)]">
              <UsersThree size={24} weight="duotone" />
            </div>
            <p className="text-sm text-[var(--text-secondary)]">
              {query ? "Kullanıcı bulunamadı." : "Henüz herkese açık profil yok."}
            </p>
            {query && (
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                Farklı bir isim ya da kullanıcı adı deneyebilirsin.
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {users.map((user) => (
                <UserCard key={user.id} user={user} />
              ))}
            </div>

            <div className="mt-4 text-xs text-[var(--text-muted)]">
              <span className="font-medium text-[var(--text-secondary)]">{users.length}</span>{" "}
              profil gösteriliyor
              {query.trim() && (
                <span className="text-[var(--text-faint)]"> · arama: {query}</span>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
