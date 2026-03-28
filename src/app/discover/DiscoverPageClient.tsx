"use client";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Link from "next/link";
import { MagnifyingGlassIcon, UsersThreeIcon } from "@phosphor-icons/react";
import UserCard from "@/components/UserCard";
import StarRating from "@/components/StarRating";
import { getCategoryLabel } from "@/lib/categories";
import type { Post } from "@/types";

interface PublicUser {
  id: string;
  name: string;
  username: string | null;
  bio: string | null;
  avatarUrl: string | null;
  lastSeenAt: string | null;
  postCount: number;
}

export default function DiscoverPageClient() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [trendingPosts, setTrendingPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const USERS_PER_PAGE = 6;

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
    // Trending postları da çek
    fetch("/api/public/posts?sort=rating&limit=6&paginate=0")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setTrendingPosts(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [fetchUsers]);

  const handleSearch = (val: string) => {
    setQuery(val);
    setCurrentPage(1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchUsers(val), 400);
  };

  const totalPages = Math.ceil(users.length / USERS_PER_PAGE);
  const paginatedUsers = useMemo(
    () => users.slice((currentPage - 1) * USERS_PER_PAGE, currentPage * USERS_PER_PAGE),
    [users, currentPage]
  );

  return (
    <main className="min-h-screen py-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <header className="mb-6">
          <div className="flex items-baseline justify-between gap-4">
            <div className="flex items-baseline gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                Keşfet
              </h1>
              <p className="hidden text-sm text-[var(--text-muted)] sm:block">
                Profiller, arşivler ve ilgi alanları
              </p>
            </div>
            {!loading && users.length > 0 && (
              <span className="text-xs text-[var(--text-muted)]">
                {users.length} profil
              </span>
            )}
          </div>
          <div className="mt-3 h-px w-full bg-[var(--border)]" />

          <label className="relative mt-4 block w-full sm:max-w-sm">
            <MagnifyingGlassIcon
              size={14}
              weight="bold"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="İsim veya @ ile kullanıcı ara..."
              className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] pl-9 pr-3 text-[16px] text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-colors focus:border-[#10b981]/40 focus:ring-1 focus:ring-[#10b981]/10 sm:text-sm"
            />
          </label>
        </header>

        {/* ── Kullanıcılar ── */}
        {loading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-40 animate-pulse rounded-xl border border-[var(--border)] bg-[var(--bg-card)]"
              />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg-card)] px-6 py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#10b981]/10 text-[var(--gold)]">
              <UsersThreeIcon size={24} weight="duotone" />
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
              {paginatedUsers.map((user) => (
                <UserCard key={user.id} user={user} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-1.5 text-xs text-[var(--text-secondary)] transition-colors duration-200 hover:border-[#10b981]/30 hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-30"
                >
                  ‹
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors duration-200 ${
                      page === currentPage
                        ? "bg-[#10b981] text-white"
                        : "border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:border-[#10b981]/30 hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-1.5 text-xs text-[var(--text-secondary)] transition-colors duration-200 hover:border-[#10b981]/30 hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-30"
                >
                  ›
                </button>
              </div>
            )}

            <div className="mt-4 text-center text-xs text-[var(--text-muted)]">
              <span className="font-medium text-[var(--text-secondary)]">{users.length}</span>{" "}
              profil
              {query.trim() && <span className="text-[var(--text-faint)]"> · arama: {query}</span>}
            </div>
          </>
        )}

        {/* ── Separator ── */}
        {trendingPosts.length > 0 && !query.trim() && (
          <div className="my-10 flex items-center gap-4">
            <div className="h-px flex-1 bg-[var(--border)]" />
            <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-[var(--text-muted)]">
              Popüler Notlar
            </span>
            <div className="h-px flex-1 bg-[var(--border)]" />
          </div>
        )}

        {/* ── Popüler Notlar ── */}
        {trendingPosts.length > 0 && !query.trim() && (
          <section>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {trendingPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/posts/${post.id}`}
                  className="group flex gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-3.5 transition-all duration-200 hover:border-[#10b981]/30"
                >
                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex items-center gap-1.5">
                      <span className="rounded-sm border border-[#10b981]/25 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--gold)]">
                        {getCategoryLabel(post.category)}
                      </span>
                      {post.user?.username && (
                        <span className="text-[10px] text-[var(--text-muted)]">@{post.user.username}</span>
                      )}
                    </div>
                    <h3 className="mb-1 line-clamp-1 text-sm font-medium text-[var(--text-primary)] transition-colors group-hover:text-[var(--gold)]">
                      {post.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      <StarRating rating={post.rating} size={11} />
                      {post.rating > 0 && (
                        <span className="text-[10px] text-[var(--text-muted)]">{post.rating}/5</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
