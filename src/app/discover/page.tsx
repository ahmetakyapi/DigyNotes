"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import UserCard from "@/components/UserCard";
import StarRating from "@/components/StarRating";
import { StatusBadge } from "@/components/StatusBadge";
import { Post } from "@/types";

const customLoader = ({ src }: { src: string }) => src;

interface PublicUser {
  id: string;
  name: string;
  username: string | null;
  bio: string | null;
  avatarUrl: string | null;
  postCount: number;
}

interface TrendingTag {
  id: string;
  name: string;
  count: number;
}

type DiscoverTab = "top" | "users";

export default function DiscoverPage() {
  const [activeTab, setActiveTab] = useState<DiscoverTab>("top");
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersFetched, setUsersFetched] = useState(false);
  const [trendingTags, setTrendingTags] = useState<TrendingTag[]>([]);
  const [topPosts, setTopPosts] = useState<Post[]>([]);
  const [topLoading, setTopLoading] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchUsers = useCallback(async (q: string) => {
    setUsersLoading(true);
    try {
      const url = q.trim() ? `/api/users/search?q=${encodeURIComponent(q)}` : "/api/users/search";
      const res = await fetch(url);
      const data = await res.json();
      setUsers(data);
      setUsersFetched(true);
    } catch {
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    setTopLoading(true);
    Promise.all([
      fetch("/api/tags?trending=true&limit=12")
        .then((r) => r.json())
        .catch(() => []),
      fetch("/api/public/posts?sort=rating&limit=6")
        .then((r) => r.json())
        .catch(() => []),
    ]).then(([tags, posts]) => {
      setTrendingTags(Array.isArray(tags) ? tags : []);
      setTopPosts(Array.isArray(posts) ? posts : []);
      setTopLoading(false);
    });
  }, []);

  // Fetch users only when tab is switched to "users" for the first time
  useEffect(() => {
    if (activeTab === "users" && !usersFetched) {
      fetchUsers("");
    }
  }, [activeTab, usersFetched, fetchUsers]);

  const handleSearch = (val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchUsers(val), 400);
  };

  return (
    <main className="min-h-screen py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        {/* Header */}
        <div className="mb-6 border-b border-[var(--border)] pb-5">
          <h1 className="mb-1 text-2xl font-bold text-[var(--text-primary)]">Topluluk</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Kullanıcıları ara, profillerini incele ve notlarını keşfet
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-8 flex gap-1 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-1">
          <button
            onClick={() => setActiveTab("top")}
            className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all ${
              activeTab === "top"
                ? "bg-[var(--gold)] text-[var(--text-on-accent)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            }`}
          >
            En Çok Beğenilenler
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all ${
              activeTab === "users"
                ? "bg-[var(--gold)] text-[var(--text-on-accent)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            }`}
          >
            Kullanıcılar
          </button>
        </div>

        {/* Tab: En Çok Beğenilenler */}
        {activeTab === "top" && (
          <>
            {topLoading ? (
              <div className="space-y-10">
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className="h-8 w-20 animate-pulse rounded-full border border-[var(--border)] bg-[var(--bg-card)]"
                    />
                  ))}
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className="h-52 animate-pulse rounded-xl border border-[var(--border)] bg-[var(--bg-card)]"
                    />
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* Trending Tags */}
                {trendingTags.length > 0 && (
                  <section className="mb-10">
                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                      Popüler Etiketler
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {trendingTags.map((tag) => (
                        <Link
                          key={tag.id}
                          href={`/tag/${encodeURIComponent(tag.name)}`}
                          className="flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--bg-card)] px-3 py-1.5 text-sm text-[var(--text-secondary)] transition-all hover:border-[#c4a24b]/50 hover:text-[var(--gold)]"
                        >
                          <span className="text-[var(--gold)]">#</span>
                          {tag.name}
                          <span className="rounded-sm bg-[var(--bg-raised)] px-1.5 py-0.5 text-[10px] text-[var(--text-muted)]">
                            {tag.count}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </section>
                )}

                {/* Top Posts */}
                {topPosts.length > 0 ? (
                  <section>
                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                      En Yüksek Puanlı Notlar
                    </h2>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {topPosts.map((post) => (
                        <TopPostCard key={post.id} post={post} />
                      ))}
                    </div>
                  </section>
                ) : (
                  trendingTags.length === 0 && (
                    <div className="py-16 text-center">
                      <p className="text-sm text-[var(--text-muted)]">
                        Henüz herkese açık içerik yok.
                      </p>
                    </div>
                  )
                )}
              </>
            )}
          </>
        )}

        {/* Tab: Kullanıcılar */}
        {activeTab === "users" && (
          <section>
            {/* Search */}
            <div className="relative mb-6">
              <svg
                className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]"
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
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] py-3 pl-11 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors focus:border-[var(--gold)] focus:outline-none"
              />
            </div>

            {/* Results */}
            {usersLoading ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="h-24 animate-pulse rounded-xl border border-[var(--border)] bg-[var(--bg-card)]"
                  />
                ))}
              </div>
            ) : users.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-sm text-[var(--text-muted)]">
                  {query ? "Kullanıcı bulunamadı." : "Henüz herkese açık profil yok."}
                </p>
              </div>
            ) : (
              <>
                <p className="mb-4 text-xs text-[var(--text-muted)]">{users.length} kullanıcı bulundu</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {users.map((user) => (
                    <UserCard key={user.id} user={user} />
                  ))}
                </div>
              </>
            )}
          </section>
        )}
      </div>
    </main>
  );
}

function TopPostCard({ post }: { post: Post }) {
  return (
    <Link
      href={`/posts/${post.id}`}
      className="group block overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-card)] transition-all hover:border-[#c4a24b]/30"
    >
      <div className="relative h-28 overflow-hidden">
        <Image
          loader={customLoader}
          src={post.image}
          alt={post.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          style={{ objectPosition: post.imagePosition ?? "center" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-card)] via-transparent to-transparent" />
        {post.status && (
          <div className="absolute bottom-1.5 left-2">
            <StatusBadge status={post.status} />
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="mb-0.5 line-clamp-1 text-xs font-semibold text-[var(--text-primary)] transition-colors group-hover:text-[var(--gold)]">
          {post.title}
        </p>
        {post.creator && <p className="mb-1 text-[10px] text-[var(--text-muted)]">{post.creator}</p>}
        {post.rating > 0 && <StarRating rating={post.rating} size={10} />}
        {post.user?.username && (
          <span
            role="link"
            tabIndex={0}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.location.href = `/profile/${post.user!.username}`;
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                e.stopPropagation();
                window.location.href = `/profile/${post.user!.username}`;
              }
            }}
            className="relative z-10 mt-1.5 block cursor-pointer text-[10px] text-[var(--text-muted)] transition-colors hover:text-[var(--gold)]"
          >
            @{post.user.username}
          </span>
        )}
      </div>
    </Link>
  );
}
