"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Collection, Post, Tag } from "@/types";
import StarRating from "@/components/StarRating";
import { StatusBadge } from "@/components/StatusBadge";
import TagBadge from "@/components/TagBadge";
import FollowButton from "@/components/FollowButton";
import FollowListModal from "@/components/FollowListModal";
import CollectionCard from "@/components/CollectionCard";
import { getCategoryLabel } from "@/lib/categories";
import { formatDisplayTitle } from "@/lib/display-text";
import { getPostImageSrc } from "@/lib/post-image";
import { ResilientImage } from "@/components/ResilientImage";
import { AvatarImage } from "@/components/AvatarImage";

interface PublicUser {
  id: string;
  name: string;
  username: string;
  bio: string | null;
  avatarUrl: string | null;
  isPublic: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  postCount: number;
  avgRating: number;
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
}

export default function ProfilePageClient({ username }: { readonly username: string }) {
  const { data: session } = useSession();
  const currentUser = session?.user as { id?: string; name?: string } | undefined;
  const [user, setUser] = useState<PublicUser | null>(null);
  const [followerCount, setFollowerCount] = useState(0);
  const [isFollowingProfile, setIsFollowingProfile] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [followModal, setFollowModal] = useState<"followers" | "following" | null>(null);
  const [activeTab, setActiveTab] = useState<"posts" | "collections" | "liked">("posts");
  const [searchQuery, setSearchQuery] = useState("");
  const [likedPosts, setLikedPosts] = useState<Post[]>([]);
  const [likedLoading, setLikedLoading] = useState(false);
  const [likedLoaded, setLikedLoaded] = useState(false);

  useEffect(() => {
    fetch(`/api/users/${username}`)
      .then((r) => {
        if (!r.ok) {
          setNotFound(true);
          setLoading(false);
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        setUser(data.user);
        setFollowerCount(data.user.followerCount);
        setIsFollowingProfile(Boolean(data.user.isFollowing));
        setPosts(data.posts);
        setCollections(Array.isArray(data.collections) ? data.collections : []);
        setLoading(false);
      })
      .catch(() => {
        setNotFound(true);
        setLoading(false);
      });
  }, [username]);

  useEffect(() => {
    setSearchQuery("");
  }, [activeTab, username]);

  // Beğenilen postları yalnızca "liked" tab'a ilk geçişte yükle
  useEffect(() => {
    if (activeTab !== "liked" || likedLoaded) return;
    setLikedLoading(true);
    fetch(`/api/users/${username}/liked-posts?limit=50`)
      .then((r) => r.json())
      .then((data) => {
        setLikedPosts(Array.isArray(data.posts) ? data.posts : []);
        setLikedLoaded(true);
      })
      .catch(() => setLikedLoaded(true))
      .finally(() => setLikedLoading(false));
  }, [activeTab, username, likedLoaded]);

  const joinedDate = user
    ? new Date(user.createdAt).toLocaleString("tr-TR", {
        day: "numeric",
        year: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";
  const lastLoginDate = user?.lastLoginAt
    ? new Date(user.lastLoginAt).toLocaleString("tr-TR", {
        day: "numeric",
        year: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Henüz yok";
  const topCategory = useMemo(() => {
    const counts = new Map<string, number>();
    posts.forEach((post) => {
      const label = getCategoryLabel(post.category);
      counts.set(label, (counts.get(label) ?? 0) + 1);
    });
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  }, [posts]);
  const normalizedProfileQuery = searchQuery.trim().toLowerCase();
  const filteredPosts = useMemo(
    () =>
      posts.filter((post) => {
        if (!normalizedProfileQuery) return true;
        return (
          post.title.toLowerCase().includes(normalizedProfileQuery) ||
          (post.creator?.toLowerCase().includes(normalizedProfileQuery) ?? false) ||
          post.category.toLowerCase().includes(normalizedProfileQuery) ||
          getCategoryLabel(post.category).toLowerCase().includes(normalizedProfileQuery) ||
          (post.tags?.some((tag) => tag.name.toLowerCase().includes(normalizedProfileQuery)) ??
            false)
        );
      }),
    [normalizedProfileQuery, posts]
  );
  const filteredCollections = useMemo(
    () =>
      collections.filter((collection) => {
        if (!normalizedProfileQuery) return true;
        return (
          collection.title.toLowerCase().includes(normalizedProfileQuery) ||
          (collection.description?.toLowerCase().includes(normalizedProfileQuery) ?? false) ||
          collection.posts.some((post) => post.title.toLowerCase().includes(normalizedProfileQuery))
        );
      }),
    [collections, normalizedProfileQuery]
  );

  const filteredLikedPosts = useMemo(
    () =>
      likedPosts.filter((post) => {
        if (!normalizedProfileQuery) return true;
        return (
          post.title.toLowerCase().includes(normalizedProfileQuery) ||
          (post.creator?.toLowerCase().includes(normalizedProfileQuery) ?? false) ||
          post.category.toLowerCase().includes(normalizedProfileQuery) ||
          getCategoryLabel(post.category).toLowerCase().includes(normalizedProfileQuery) ||
          (post.tags?.some((tag) => tag.name.toLowerCase().includes(normalizedProfileQuery)) ??
            false)
        );
      }),
    [likedPosts, normalizedProfileQuery]
  );

  // Tab-dependent computed values (avoids nested ternary in JSX)
  const tabMeta = useMemo(() => {
    if (activeTab === "posts") {
      return {
        label: "Profil Notları",
        count: `${filteredPosts.length} / ${posts.length} not`,
        placeholder: "Not, kategori veya etiket ara...",
      };
    }
    if (activeTab === "collections") {
      return {
        label: "Profil Koleksiyonları",
        count: `${filteredCollections.length} / ${collections.length} koleksiyon`,
        placeholder: "Koleksiyon veya not ara...",
      };
    }
    return {
      label: "Beğenilen Notlar",
      count: likedLoading
        ? "Yükleniyor…"
        : `${filteredLikedPosts.length} / ${likedPosts.length} beğenilen not`,
      placeholder: "Beğenilen notlarda ara...",
    };
  }, [
    activeTab,
    filteredPosts.length,
    posts.length,
    filteredCollections.length,
    collections.length,
    likedLoading,
    filteredLikedPosts.length,
    likedPosts.length,
  ]);

  if (loading) {
    return (
      <div className="min-h-screen py-10">
        <div className="mx-auto max-w-4xl space-y-6 px-4">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 animate-pulse rounded-full bg-[var(--bg-card)]" />
            <div className="space-y-2">
              <div className="h-5 w-40 animate-pulse rounded bg-[var(--bg-card)]" />
              <div className="h-3 w-24 animate-pulse rounded bg-[var(--bg-card)]" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-40 animate-pulse rounded-xl border border-[var(--border)] bg-[var(--bg-card)]"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-card)]">
            <svg
              className="h-7 w-7 text-[var(--text-muted)]"
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
          <p className="mb-1 font-medium text-[var(--text-secondary)]">Profil bulunamadı</p>
          <p className="mb-4 text-xs text-[var(--text-muted)]">
            @{username} adlı profil mevcut değil veya gizli.
          </p>
          <Link href="/discover" className="text-xs text-[#6366f1] hover:underline">
            ← Kullanıcıları keşfet
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen">
      {/* Profile Header */}
      <div className="border-b border-[var(--border)] bg-[var(--bg-header)]">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            {/* Avatar */}
            <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--border)] bg-[var(--bg-card)]">
              <AvatarImage
                src={user.avatarUrl}
                alt={user.name}
                name={user.name}
                size={80}
                className="h-full w-full object-cover"
                textClassName="text-3xl font-semibold text-[#6366f1]"
              />
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--gold)]">
                    Profil
                  </p>
                  <h1 className="text-2xl font-bold text-[var(--text-primary)]">{user.name}</h1>
                  <p className="mb-2 text-sm text-[var(--text-muted)]">@{user.username}</p>
                </div>
                {/* Follow button — sadece başka kullanıcıysa ve giriş yapılmışsa */}
                {currentUser?.id && currentUser.id !== user.id && (
                  <FollowButton
                    username={user.username}
                    initialIsFollowing={isFollowingProfile}
                    onFollowChange={(following) => {
                      setIsFollowingProfile(following);
                      setUser((prev) => (prev ? { ...prev, isFollowing: following } : prev));
                      setFollowerCount((c) => c + (following ? 1 : -1));
                    }}
                  />
                )}
                {!currentUser?.id && (
                  <Link
                    href="/login"
                    className="hover:bg-[#6366f1]/18 rounded-lg border border-[#6366f1]/35 bg-[#6366f1]/10 px-4 py-2 text-sm font-semibold text-[#6366f1] transition-colors"
                  >
                    Takip etmek için giriş yap
                  </Link>
                )}
              </div>
              {user.bio && (
                <p className="max-w-lg text-sm leading-relaxed text-[var(--text-secondary)]">
                  {user.bio}
                </p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-[var(--border)] bg-[var(--bg-card)] px-3 py-1 text-xs text-[var(--text-muted)]">
                  {posts.length} herkese açık not
                </span>
                <span className="rounded-full border border-[var(--border)] bg-[var(--bg-card)] px-3 py-1 text-xs text-[var(--text-muted)]">
                  {collections.length} koleksiyon
                </span>
                {topCategory && (
                  <span className="rounded-full border border-[var(--border)] bg-[var(--bg-card)] px-3 py-1 text-xs text-[var(--text-muted)]">
                    Güçlü alan: {topCategory}
                  </span>
                )}
                {currentUser?.id && currentUser.id !== user.id && isFollowingProfile && (
                  <span className="rounded-full border border-[#6366f1]/25 bg-[#6366f1]/10 px-3 py-1 text-xs text-[#6366f1]">
                    Bu profili takip ediyorsun
                  </span>
                )}
              </div>

              {/* Stats */}
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
                <div className="text-center">
                  <p className="text-lg font-bold text-[var(--text-primary)]">{user.postCount}</p>
                  <p className="text-xs text-[var(--text-muted)]">Not</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFollowModal("followers")}
                  className="text-center transition-opacity hover:opacity-70"
                >
                  <p className="text-lg font-bold text-[var(--text-primary)]">{followerCount}</p>
                  <p className="text-xs text-[var(--text-muted)]">Takipçi</p>
                </button>
                <button
                  type="button"
                  onClick={() => setFollowModal("following")}
                  className="text-center transition-opacity hover:opacity-70"
                >
                  <p className="text-lg font-bold text-[var(--text-primary)]">
                    {user.followingCount}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">Takip</p>
                </button>
                {user.avgRating > 0 && (
                  <div className="text-center">
                    <p className="text-lg font-bold text-[#6366f1]">★ {user.avgRating}</p>
                    <p className="text-xs text-[var(--text-muted)]">Ort. Puan</p>
                  </div>
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--text-muted)]">
                <span>Katıldı: {joinedDate}</span>
                <span className="text-[var(--text-faint)]">·</span>
                <span>Son aktivite: {lastLoginDate}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Followers / Following modal */}
      {followModal && (
        <FollowListModal
          username={username}
          type={followModal}
          onClose={() => setFollowModal(null)}
          onUserFollowChange={({ username: targetUsername, isFollowing }) => {
            if (targetUsername === user.username) {
              setIsFollowingProfile(isFollowing);
              setUser((prev) => (prev ? { ...prev, isFollowing } : prev));
              setFollowerCount((count) => count + (isFollowing ? 1 : -1));
            }
          }}
        />
      )}

      {/* Tabs */}
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {/* ── Tab bar ── */}
        <div className="mb-6 flex items-center gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("posts")}
            className={`shrink-0 rounded-t-xl px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === "posts"
                ? "border border-b-0 border-[var(--border)] bg-[var(--bg-card)] text-[var(--gold)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            Notlar
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("collections")}
            className={`shrink-0 rounded-t-xl px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === "collections"
                ? "border border-b-0 border-[var(--border)] bg-[var(--bg-card)] text-[var(--gold)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            Koleksiyonlar
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("liked")}
            className={`shrink-0 rounded-t-xl px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === "liked"
                ? "border border-b-0 border-[var(--border)] bg-[var(--bg-card)] text-[var(--gold)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            Beğenilenler
          </button>
        </div>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--text-muted)]">
              {tabMeta.label}
            </p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">{tabMeta.count}</p>
            <div className="relative mt-3 w-full sm:hidden">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={tabMeta.placeholder}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2.5 text-[16px] text-[var(--text-primary)] transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--gold)] focus:outline-none"
              />
            </div>
          </div>
          <div className="relative hidden w-full sm:block sm:max-w-xs">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={tabMeta.placeholder}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2.5 text-[16px] text-[var(--text-primary)] transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--gold)] focus:outline-none sm:text-sm"
            />
          </div>
        </div>

        {activeTab === "posts" ? (
          posts.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm text-[var(--text-muted)]">Henüz not yok.</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg-card)] px-6 py-12 text-center">
              <p className="text-sm text-[var(--text-muted)]">Aramana uyan not bulunamadı.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {filteredPosts.map((post) => (
                <Link key={post.id} href={`/posts/${post.id}`} className="group block">
                  <article className="flex h-full flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-card)] transition-all duration-300 hover:border-[#6366f1]/30 sm:flex-row">
                    {/* Cover */}
                    <div
                      className="relative h-48 flex-shrink-0 sm:h-auto sm:w-[36%]"
                      style={{ minHeight: "160px" }}
                    >
                      <ResilientImage
                        src={getPostImageSrc(post.image, post.category)}
                        alt={formatDisplayTitle(post.title)}
                        fill
                        variant="wide"
                        sizes="200px"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                      />
                      <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[var(--image-edge-fade)] to-transparent sm:inset-y-0 sm:left-auto sm:right-0 sm:h-auto sm:w-8 sm:bg-gradient-to-l" />
                    </div>

                    {/* Content */}
                    <div className="flex min-w-0 flex-1 flex-col justify-between p-4">
                      <div>
                        <div className="mb-2 flex flex-wrap items-center gap-1.5">
                          <span className="rounded-sm border border-[#6366f1]/25 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-[#6366f1]">
                            {getCategoryLabel(post.category)}
                          </span>
                          {post.status && <StatusBadge status={post.status} />}
                        </div>
                        <h2 className="mb-1 line-clamp-2 text-sm font-bold leading-snug text-[var(--text-primary)] transition-colors duration-200 group-hover:text-[#6366f1]">
                          {formatDisplayTitle(post.title)}
                        </h2>
                        {post.creator && (
                          <p className="mb-1.5 text-xs text-[var(--text-muted)]">
                            {formatDisplayTitle(post.creator)}
                          </p>
                        )}
                        {post.tags && post.tags.length > 0 && (
                          <div className="mb-1.5 flex flex-wrap gap-1">
                            {(post.tags as Tag[]).slice(0, 2).map((tag) => (
                              <TagBadge key={tag.id} tag={tag} />
                            ))}
                            {post.tags.length > 2 && (
                              <span className="self-center text-[10px] text-[var(--text-muted)]">
                                +{post.tags.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="mt-3 flex items-center justify-between border-t border-[var(--border)] pt-2.5">
                        <StarRating rating={post.rating} size={11} />
                        <span className="text-[10px] text-[var(--text-muted)]">{post.date}</span>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )
        ) : activeTab === "collections" ? (
          collections.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm text-[var(--text-muted)]">Henüz koleksiyon yok.</p>
            </div>
          ) : filteredCollections.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg-card)] px-6 py-12 text-center">
              <p className="text-sm text-[var(--text-muted)]">
                Aramana uyan koleksiyon bulunamadı.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {filteredCollections.map((collection) => (
                <CollectionCard
                  key={collection.id}
                  collection={collection}
                  href={`/collections/${collection.id}`}
                />
              ))}
            </div>
          )
        ) : /* ── Beğenilenler tab ── */ likedLoading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-40 animate-pulse rounded-xl border border-[var(--border)] bg-[var(--bg-card)]"
              />
            ))}
          </div>
        ) : likedPosts.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-card)]">
              <svg
                className="h-5 w-5 text-[var(--text-muted)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </div>
            <p className="text-sm text-[var(--text-muted)]">Henüz beğenilen not yok.</p>
          </div>
        ) : filteredLikedPosts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg-card)] px-6 py-12 text-center">
            <p className="text-sm text-[var(--text-muted)]">Aramana uyan not bulunamadı.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {filteredLikedPosts.map((post) => (
              <Link key={post.id} href={`/posts/${post.id}`} className="group block">
                <article className="flex h-full flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-card)] transition-all duration-300 hover:border-[#6366f1]/30 sm:flex-row">
                  {/* Cover */}
                  <div
                    className="relative h-48 flex-shrink-0 sm:h-auto sm:w-[36%]"
                    style={{ minHeight: "160px" }}
                  >
                    <ResilientImage
                      src={getPostImageSrc(post.image, post.category)}
                      alt={formatDisplayTitle(post.title)}
                      fill
                      variant="wide"
                      sizes="200px"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[var(--image-edge-fade)] to-transparent sm:inset-y-0 sm:left-auto sm:right-0 sm:h-auto sm:w-8 sm:bg-gradient-to-l" />
                  </div>

                  {/* Content */}
                  <div className="flex min-w-0 flex-1 flex-col justify-between p-4">
                    <div>
                      <div className="mb-2 flex flex-wrap items-center gap-1.5">
                        <span className="rounded-sm border border-[#6366f1]/25 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-[#6366f1]">
                          {getCategoryLabel(post.category)}
                        </span>
                        {post.status && <StatusBadge status={post.status} />}
                        {/* Beğenilen postun sahibini göster */}
                        {post.user && (
                          <Link
                            href={`/profile/${post.user.username}`}
                            onClick={(e) => e.stopPropagation()}
                            className="ml-auto flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--bg-raised)] px-2 py-0.5 text-[9px] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                          >
                            <AvatarImage
                              src={post.user.avatarUrl}
                              alt={post.user.name}
                              name={post.user.name}
                              size={14}
                              className="rounded-full"
                              textClassName="text-[6px]"
                            />
                            <span>{post.user.name}</span>
                          </Link>
                        )}
                      </div>
                      <h2 className="mb-1 line-clamp-2 text-sm font-bold leading-snug text-[var(--text-primary)] transition-colors duration-200 group-hover:text-[#6366f1]">
                        {formatDisplayTitle(post.title)}
                      </h2>
                      {post.creator && (
                        <p className="mb-1.5 text-xs text-[var(--text-muted)]">
                          {formatDisplayTitle(post.creator)}
                        </p>
                      )}
                      {post.tags && post.tags.length > 0 && (
                        <div className="mb-1.5 flex flex-wrap gap-1">
                          {(post.tags as Tag[]).slice(0, 2).map((tag) => (
                            <TagBadge key={tag.id} tag={tag} />
                          ))}
                          {post.tags.length > 2 && (
                            <span className="self-center text-[10px] text-[var(--text-muted)]">
                              +{post.tags.length - 2}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-[var(--border)] pt-2.5">
                      <StarRating rating={post.rating} size={11} />
                      <span className="text-[10px] text-[var(--text-muted)]">{post.date}</span>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
