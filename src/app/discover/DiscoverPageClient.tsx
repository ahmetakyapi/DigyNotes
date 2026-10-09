"use client";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  CaretLeftIcon,
  CaretRightIcon,
  MagnifyingGlassIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react";
import UserCard from "@/components/UserCard";
import StarRating from "@/components/StarRating";
import { ResilientImage } from "@/components/ResilientImage";
import { StatusBadge } from "@/components/StatusBadge";
import { getCategoryLabel } from "@/lib/categories";
import { formatDisplayTitle } from "@/lib/display-text";
import { getPostImageSrc } from "@/lib/post-image";
import type { Post } from "@/types";
import { PageHeader, Em, Dot } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";

const EASE = [0.16, 1, 0.3, 1] as const;

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
  const reduce = useReducedMotion();
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

  const showTrending = trendingPosts.length > 0 && !query.trim();
  const headerStats =
    !loading && users.length > 0 ? [{ value: users.length, label: "Profil" }] : undefined;

  return (
    <main className="min-h-screen pb-12 pt-8 sm:pt-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* LAYOUT: Editorial masthead (index 09) → pill search → user grid + pagination → popular notes grid. */}
        <PageHeader
          index="09"
          eyebrow="Kişiler"
          title={
            <>
              <Em>Keşfet</Em>
              <Dot />
            </>
          }
          description="Benzer zevklere sahip kişileri bul ve takip et."
          stats={headerStats}
        />

        <label className="relative mb-6 block w-full sm:max-w-sm">
          <MagnifyingGlassIcon
            size={14}
            weight="bold"
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="İsim ya da kullanıcı adıyla ara..."
            className="h-11 w-full rounded-full border border-[var(--border)] bg-[var(--bg-card)] pl-10 pr-4 text-[16px] text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-colors duration-200 hover:border-[var(--text-faint)] focus:border-accent/40 focus:ring-1 focus:ring-accent/10 sm:text-sm"
          />
        </label>

        {/* ── Kullanıcılar ── */}
        {loading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-40 animate-pulse rounded-[24px] border border-[var(--border)] bg-[var(--bg-card)]"
              />
            ))}
          </div>
        ) : users.length === 0 ? (
          query ? (
            <EmptyState
              compact
              icon={<MagnifyingGlassIcon size={22} weight="duotone" />}
              title={
                <>
                  Kullanıcı <Em>Bulunamadı</Em>
                </>
              }
              description="Farklı bir isim ya da kullanıcı adı deneyebilirsin."
              primary={{ label: "Aramayı Temizle", onClick: () => handleSearch("") }}
            />
          ) : (
            <EmptyState
              icon={<UsersThreeIcon size={22} weight="duotone" />}
              title={
                <>
                  Henüz <Em>Herkese Açık</Em> Profil Yok
                </>
              }
              description="Notlarını herkese açan kişiler olduğunda burada görünecek."
              primary={{ label: "Notlarıma Dön", href: "/notes" }}
            />
          )
        ) : (
          <>
            {/* LAYOUT: 1/2/3-column grid of user cards, staggered entrance per page. */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {paginatedUsers.map((user, i) => (
                <motion.div
                  key={user.id}
                  className="h-full [&>*]:h-full"
                  initial={reduce ? false : { opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, ease: EASE, delay: Math.min(i, 8) * 0.05 }}
                >
                  <UserCard user={user} />
                </motion.div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-1.5">
                <button
                  type="button"
                  aria-label="Önceki sayfa"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-secondary)] transition-colors duration-200 hover:border-[var(--text-faint)] hover:text-[var(--text-primary)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <CaretLeftIcon size={14} weight="bold" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`dn-mono flex h-9 min-w-9 cursor-pointer items-center justify-center rounded-full px-3 text-[11px] transition-colors duration-200 active:scale-95 ${
                      page === currentPage
                        ? "bg-accent text-[var(--text-on-accent)]"
                        : "border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:border-[var(--text-faint)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {String(page).padStart(2, "0")}
                  </button>
                ))}
                <button
                  type="button"
                  aria-label="Sonraki sayfa"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-secondary)] transition-colors duration-200 hover:border-[var(--text-faint)] hover:text-[var(--text-primary)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <CaretRightIcon size={14} weight="bold" />
                </button>
              </div>
            )}

            <div className="mt-4 text-center text-[12px] font-medium text-[var(--text-muted)]">
              <span className="text-[var(--text-secondary)]">{users.length}</span> profil
              {query.trim() && <span className="text-[var(--text-faint)]"> · arama: {query}</span>}
            </div>
          </>
        )}

        {/* LAYOUT: Section break — mono index label between hairlines. */}
        {showTrending && (
          <div className="mb-6 mt-14 flex items-center gap-4">
            <span className="dn-eyebrow flex items-center gap-2">Popüler Notlar</span>
            <div className="h-px flex-1 bg-[var(--border)]" />
          </div>
        )}

        {/* ── Popüler Notlar ── */}
        {showTrending && (
          <section>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {trendingPosts.map((post, i) => {
                const displayTitle = formatDisplayTitle(post.title);
                return (
                  <motion.div
                    key={post.id}
                    className="h-full"
                    initial={reduce ? false : { opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: EASE, delay: Math.min(i, 8) * 0.05 }}
                  >
                    <Link
                      href={`/posts/${post.id}`}
                      className="group block h-full overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--bg-card)] transition-colors duration-300 ease-out-expo hover:border-[var(--text-faint)]"
                    >
                      <div className="relative h-40 overflow-hidden bg-[var(--bg-raised)]">
                        <ResilientImage
                          src={getPostImageSrc(post.image, post.category)}
                          alt={displayTitle}
                          fill
                          className="object-cover transition-transform duration-[1200ms] ease-out-expo group-hover:scale-[1.06]"
                          style={{ objectPosition: post.imagePosition ?? "center" }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[rgb(var(--ink-rgb)/0.85)] via-transparent to-transparent" />
                        <div className="absolute left-3 top-3 flex items-center gap-2">
                          <span className="rounded-full border border-accent/20 bg-ink/70 px-2.5 py-1 text-[12px] font-medium text-[var(--gold)]">
                            {getCategoryLabel(post.category)}
                          </span>
                          {post.status && <StatusBadge status={post.status} />}
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="mb-2 line-clamp-1 text-lg font-bold tracking-[-0.02em] text-[var(--text-primary)] transition-colors duration-200 group-hover:text-[var(--gold)]">
                          {displayTitle}
                        </h3>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <StarRating rating={post.rating} size={11} />
                            {post.rating > 0 && (
                              <span className="dn-mono text-[12px] text-[var(--text-muted)]">
                                {post.rating}/5
                              </span>
                            )}
                          </div>
                          {post.user?.username && (
                            <span className="truncate text-[12px] font-medium text-[var(--text-muted)]">
                              @{post.user.username}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
