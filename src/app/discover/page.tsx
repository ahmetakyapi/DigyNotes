"use client";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import {
  Compass,
  Hash,
  MagnifyingGlass,
  Sparkle,
  TrendUp,
  UsersThree,
} from "@phosphor-icons/react";
import { getCategoryLabel } from "@/lib/categories";
import { formatDisplayTitle } from "@/lib/display-text";
import UserCard from "@/components/UserCard";
import StarRating from "@/components/StarRating";
import { StatusBadge } from "@/components/StatusBadge";
import {
  SortFilterBar,
  SortFilterState,
  applySortFilter,
  createSortFilterState,
  hasActiveSortFilters,
  matchesAdvancedFilters,
} from "@/components/SortFilterBar";
import { getPostImageSrc } from "@/lib/post-image";
import { Post } from "@/types";
import { ResilientImage } from "@/components/ResilientImage";

interface PublicUser {
  id: string;
  name: string;
  username: string | null;
  bio: string | null;
  avatarUrl: string | null;
  lastSeenAt: string | null;
  postCount: number;
}

interface TrendingTag {
  id: string;
  name: string;
  count: number;
}

interface PaginatedPublicPostsResponse {
  items: Post[];
  nextCursor: string | null;
}

type DiscoverTab = "top" | "users";

export default function DiscoverPage() {
  const defaultTopFilters = useMemo(() => createSortFilterState("rating_desc"), []);
  const [activeTab, setActiveTab] = useState<DiscoverTab>("top");
  const [query, setQuery] = useState("");
  const [topQuery, setTopQuery] = useState("");
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersFetched, setUsersFetched] = useState(false);
  const [trendingTags, setTrendingTags] = useState<TrendingTag[]>([]);
  const [topPosts, setTopPosts] = useState<Post[]>([]);
  const [topLoading, setTopLoading] = useState(true);
  const [topCursor, setTopCursor] = useState<string | null>(null);
  const [loadingMoreTop, setLoadingMoreTop] = useState(false);
  const [topFilters, setTopFilters] = useState<SortFilterState>(defaultTopFilters);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const fetchTopPosts = useCallback(async (cursor?: string | null) => {
    const params = new URLSearchParams({
      sort: "rating",
      limit: "6",
      paginate: "1",
    });

    if (cursor) {
      params.set("cursor", cursor);
    }

    const res = await fetch(`/api/public/posts?${params.toString()}`);
    if (!res.ok) {
      throw new Error("Top posts fetch failed");
    }

    const data = (await res.json()) as PaginatedPublicPostsResponse;
    return {
      items: Array.isArray(data.items) ? data.items : [],
      nextCursor: typeof data.nextCursor === "string" ? data.nextCursor : null,
    };
  }, []);

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
      fetchTopPosts().catch(() => ({ items: [], nextCursor: null })),
    ]).then(([tags, posts]) => {
      setTrendingTags(Array.isArray(tags) ? tags : []);
      setTopPosts(Array.isArray(posts.items) ? posts.items : []);
      setTopCursor(posts.nextCursor);
      setTopLoading(false);
    });
  }, [fetchTopPosts]);

  // Fetch users only when tab is switched to "users" for the first time
  useEffect(() => {
    if (activeTab === "users" && !usersFetched) {
      fetchUsers("");
    }
  }, [activeTab, usersFetched, fetchUsers]);

  const loadMoreTopPosts = useCallback(async () => {
    if (!topCursor || loadingMoreTop) return;

    setLoadingMoreTop(true);
    try {
      const data = await fetchTopPosts(topCursor);
      setTopPosts((prev) => {
        const ids = new Set(prev.map((post) => post.id));
        const next = [...prev];
        for (const post of data.items) {
          if (ids.has(post.id)) continue;
          ids.add(post.id);
          next.push(post);
        }
        return next;
      });
      setTopCursor(data.nextCursor);
    } catch {
      setTopCursor(null);
    } finally {
      setLoadingMoreTop(false);
    }
  }, [fetchTopPosts, loadingMoreTop, topCursor]);

  useEffect(() => {
    if (activeTab !== "top" || !topCursor || loadingMoreTop) return;

    const node = loadMoreRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        void loadMoreTopPosts();
      },
      { rootMargin: "240px 0px" }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [activeTab, topCursor, loadingMoreTop, loadMoreTopPosts, topPosts.length]);

  const topAvailableStatuses = useMemo(
    () =>
      Array.from(
        new Set(
          topPosts
            .map((post) => post.status)
            .filter(
              (status): status is string => typeof status === "string" && status.trim() !== ""
            )
        )
      ).sort((a, b) => a.localeCompare(b, "tr")),
    [topPosts]
  );

  const filteredTopPosts = useMemo(() => {
    const normalizedQuery = topQuery.trim().toLowerCase();
    const result = topPosts
      .filter((post) => {
        if (!normalizedQuery) return true;
        return (
          post.title.toLowerCase().includes(normalizedQuery) ||
          (post.creator?.toLowerCase().includes(normalizedQuery) ?? false) ||
          (post.user?.username?.toLowerCase().includes(normalizedQuery) ?? false) ||
          (post.user?.name?.toLowerCase().includes(normalizedQuery) ?? false)
        );
      })
      .filter((post) => matchesAdvancedFilters(post, topFilters));
    return applySortFilter(result, topFilters);
  }, [topPosts, topFilters, topQuery]);

  const averageTopRating =
    filteredTopPosts.length > 0
      ? Math.round(
          (filteredTopPosts.reduce((sum, post) => sum + (post.rating > 0 ? post.rating : 0), 0) /
            filteredTopPosts.length) *
            10
        ) / 10
      : 0;

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
            Toplulukta Öne Çıkan Notları ve Kişileri Keşfet
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)] sm:text-[15px]">
            En yüksek puanlı içerikleri incele, popüler etiketlere göz at ve yeni profiller bul.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-[var(--border)] bg-[rgba(7,12,22,0.42)] px-4 py-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-faint)]">
                Buradaki mantık
              </p>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Takipten bağımsız, public yüzeylerde gezinme.
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[rgba(7,12,22,0.42)] px-4 py-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-faint)]">
                Ne zaman kullanılır?
              </p>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Yeni insanlar ve beklenmedik içerikler ararken.
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[rgba(7,12,22,0.42)] px-4 py-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-faint)]">
                Sonraki aksiyon
              </p>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Profili aç, etikete dal veya öne çıkan nota geç.
              </p>
            </div>
          </div>

          <div className="mt-6 inline-flex rounded-2xl border border-[var(--border)] bg-[rgba(7,12,22,0.52)] p-1">
            <button
              onClick={() => setActiveTab("top")}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                activeTab === "top"
                  ? "bg-[var(--gold)] text-[var(--text-on-accent)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Öne Çıkan Notlar
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                activeTab === "users"
                  ? "bg-[var(--gold)] text-[var(--text-on-accent)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Kullanıcılar
            </button>
          </div>
        </header>

        {activeTab === "top" && (
          <>
            {topLoading ? (
              <div className="space-y-6">
                <div className="rounded-[28px] border border-[var(--border)] bg-[var(--bg-card)] p-5">
                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div
                        key={i}
                        className="h-9 w-24 animate-pulse rounded-full bg-[var(--bg-base)]"
                      />
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className="h-72 animate-pulse rounded-[28px] border border-[var(--border)] bg-[var(--bg-card)]"
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {trendingTags.length > 0 && (
                  <section className="rounded-[28px] border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-[var(--shadow-soft)]">
                    <div className="mb-4 flex items-center gap-2">
                      <Sparkle size={16} weight="duotone" className="text-[var(--gold)]" />
                      <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                        Şu Anda Öne Çıkan Etiketler
                      </h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {trendingTags.map((tag) => (
                        <Link
                          key={tag.id}
                          href={`/tag/${encodeURIComponent(tag.name)}`}
                          className="hover:border-[#c4a24b]/24 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-base)] px-3 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--gold)]"
                        >
                          <span className="text-[var(--gold)]">#{tag.name}</span>
                          <span className="text-xs text-[var(--text-faint)]">{tag.count}</span>
                        </Link>
                      ))}
                    </div>
                  </section>
                )}

                {topPosts.length > 0 ? (
                  <section className="rounded-[28px] border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-[var(--shadow-soft)]">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                      <div>
                        <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                          En Yüksek Puanlı Notlar
                        </h2>
                        <p className="mt-1 text-sm text-[var(--text-muted)]">
                          Başlık, üretici veya kullanıcı adı ile filtrele.
                        </p>
                      </div>
                      <label className="relative block w-full lg:max-w-xs">
                        <MagnifyingGlass
                          size={16}
                          weight="bold"
                          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]"
                        />
                        <input
                          type="text"
                          value={topQuery}
                          onChange={(e) => setTopQuery(e.target.value)}
                          placeholder="Not veya kullanıcı ara..."
                          className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-base)] pl-10 pr-3 text-[16px] text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--gold)] sm:text-sm"
                        />
                      </label>
                    </div>

                    <div className="mt-4 space-y-3">
                      <SortFilterBar
                        value={topFilters}
                        onChange={setTopFilters}
                        totalCount={topPosts.length}
                        filteredCount={filteredTopPosts.length}
                        availableStatuses={topAvailableStatuses}
                        defaultValue={defaultTopFilters}
                      />
                      {(topQuery || hasActiveSortFilters(topFilters, defaultTopFilters)) && (
                        <div className="flex items-center justify-between gap-3 text-xs text-[var(--text-muted)]">
                          <span>{filteredTopPosts.length} sonuç gösteriliyor</span>
                          <button
                            type="button"
                            onClick={() => {
                              setTopQuery("");
                              setTopFilters(defaultTopFilters);
                            }}
                            className="font-medium text-[var(--gold)] transition-colors hover:text-[var(--gold-light)]"
                          >
                            Tüm filtreleri temizle
                          </button>
                        </div>
                      )}
                    </div>

                    {filteredTopPosts.length === 0 ? (
                      <div className="mt-5 rounded-[24px] border border-dashed border-[var(--border)] bg-[var(--bg-base)] px-5 py-14 text-center">
                        <p className="text-sm text-[var(--text-secondary)]">
                          Filtreye uygun herkese açık not bulunamadı.
                        </p>
                      </div>
                    ) : (
                      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {filteredTopPosts.map((post) => (
                          <TopPostCard key={post.id} post={post} />
                        ))}
                      </div>
                    )}

                    {(topCursor || loadingMoreTop) && (
                      <div ref={loadMoreRef} className="mt-6 flex justify-center">
                        <button
                          type="button"
                          onClick={() => void loadMoreTopPosts()}
                          disabled={!topCursor || loadingMoreTop}
                          className="rounded-xl border border-[var(--border)] bg-[var(--bg-base)] px-4 py-2.5 text-sm text-[var(--text-secondary)] transition-colors hover:border-[#c4a24b]/35 hover:text-[var(--gold)] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {loadingMoreTop
                            ? "Daha fazla yükleniyor..."
                            : topCursor
                              ? "Daha fazla yükle"
                              : "Tüm içerikler yüklendi"}
                        </button>
                      </div>
                    )}

                    <div className="mt-6 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl border border-[var(--border)] bg-[rgba(7,12,22,0.42)] p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#c4a24b]/10 text-[var(--gold)]">
                            <Compass size={18} weight="duotone" />
                          </div>
                          <div>
                            <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-faint)]">
                              Gösterilen not
                            </p>
                            <p className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">
                              {filteredTopPosts.length}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-2xl border border-[var(--border)] bg-[rgba(7,12,22,0.42)] p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#c4a24b]/10 text-[var(--gold)]">
                            <Hash size={18} weight="duotone" />
                          </div>
                          <div>
                            <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-faint)]">
                              Popüler etiket
                            </p>
                            <p className="mt-1 text-base font-semibold text-[var(--text-primary)]">
                              {trendingTags[0] ? `#${trendingTags[0].name}` : "-"}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-2xl border border-[var(--border)] bg-[rgba(7,12,22,0.42)] p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#c4a24b]/10 text-[var(--gold)]">
                            <TrendUp size={18} weight="duotone" />
                          </div>
                          <div>
                            <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-faint)]">
                              Ortalama puan
                            </p>
                            <p className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">
                              {averageTopRating > 0 ? averageTopRating : "-"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                ) : (
                  trendingTags.length === 0 && (
                    <div className="rounded-[28px] border border-dashed border-[var(--border)] bg-[var(--bg-card)] px-6 py-16 text-center">
                      <p className="text-sm text-[var(--text-secondary)]">
                        Henüz herkese açık içerik yok.
                      </p>
                    </div>
                  )
                )}
              </div>
            )}
          </>
        )}

        {activeTab === "users" && (
          <section className="space-y-6">
            <div className="rounded-[28px] border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-[var(--shadow-soft)]">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <UsersThree size={16} weight="duotone" className="text-[var(--gold)]" />
                    <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                      Topluluktaki Kullanıcıları Ara
                    </h2>
                  </div>
                  <p className="mt-2 text-sm text-[var(--text-muted)]">
                    İsim veya kullanıcı adı ile herkese açık profilleri bul.
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[var(--text-faint)]">
                    Buradaki amaç takip ettiğin kişilere dönmek değil, yeni biriyle karşılaşmak.
                  </p>
                </div>
                <label className="relative block w-full lg:max-w-sm">
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
              </div>
            </div>

            {usersLoading ? (
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
                <p className="text-sm text-[var(--text-secondary)]">
                  {query ? "Kullanıcı bulunamadı." : "Henüz herkese açık profil yok."}
                </p>
                <p className="mt-2 text-sm text-[var(--text-muted)]">
                  {query
                    ? "Farklı bir isim ya da kullanıcı adı deneyebilirsin."
                    : "Kullanıcılar profillerini herkese açık hale getirdikçe burada görünür."}
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {users.map((user) => (
                    <UserCard key={user.id} user={user} />
                  ))}
                </div>

                <div className="rounded-[24px] border border-[var(--border)] bg-[rgba(7,12,22,0.42)] px-4 py-3 text-sm text-[var(--text-secondary)]">
                  <span className="font-medium text-[var(--text-primary)]">{users.length}</span>{" "}
                  profil gösteriliyor
                  {query.trim() ? (
                    <span className="text-[var(--text-faint)]"> · arama: {query}</span>
                  ) : (
                    <span className="text-[var(--text-faint)]"> · tüm herkese açık profiller</span>
                  )}
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
  const displayTitle = formatDisplayTitle(post.title);
  const displayCreator = formatDisplayTitle(post.creator);

  return (
    <article className="group overflow-hidden rounded-[28px] border border-[var(--border)] bg-[linear-gradient(180deg,rgba(18,26,45,0.96),rgba(10,16,29,0.92))] shadow-[var(--shadow-soft)] transition-all duration-200 hover:-translate-y-1 hover:border-[#c4a24b]/20 hover:shadow-[var(--shadow-card)]">
      <Link href={`/posts/${post.id}`} className="block">
        <div className="relative h-44 overflow-hidden bg-[var(--bg-raised)]">
          <ResilientImage
            src={getPostImageSrc(post.image)}
            alt={displayTitle}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            style={{ objectPosition: post.imagePosition ?? "center" }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(7,12,22,0.88)] via-[rgba(7,12,22,0.1)] to-transparent" />
          <div className="absolute left-4 top-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-[#c4a24b]/20 bg-[rgba(7,10,18,0.68)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--gold)]">
              {getCategoryLabel(post.category)}
            </span>
            {post.status && <StatusBadge status={post.status} />}
          </div>
        </div>
        <div className="space-y-3 p-5">
          <div>
            <h3 className="line-clamp-2 text-lg font-semibold text-[var(--text-primary)] transition-colors group-hover:text-[var(--gold)]">
              {displayTitle}
            </h3>
            {post.creator && (
              <p className="mt-1 text-sm text-[var(--text-muted)]">{displayCreator}</p>
            )}
          </div>
          {post.rating > 0 && <StarRating rating={post.rating} size={11} />}
          <div className="flex items-center justify-between border-t border-[var(--border)] pt-3 text-xs text-[var(--text-faint)]">
            <span>{post.user?.username ? `@${post.user.username}` : "Topluluk notu"}</span>
            <span>Notu aç</span>
          </div>
        </div>
      </Link>
    </article>
  );
}
