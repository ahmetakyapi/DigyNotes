"use client";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
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

const customLoader = ({ src }: { src: string }) => src;

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

export default function ProfilePageClient({ username }: { username: string }) {
  const { data: session } = useSession();
  const currentUser = session?.user as { id?: string; name?: string } | undefined;
  const [user, setUser] = useState<PublicUser | null>(null);
  const [followerCount, setFollowerCount] = useState(0);
  const [posts, setPosts] = useState<Post[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [followModal, setFollowModal] = useState<"followers" | "following" | null>(null);
  const [activeTab, setActiveTab] = useState<"posts" | "collections">("posts");
  const [searchQuery, setSearchQuery] = useState("");

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
          <Link href="/discover" className="text-xs text-[#c4a24b] hover:underline">
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
              {user.avatarUrl ? (
                <Image
                  loader={customLoader}
                  src={user.avatarUrl}
                  alt={user.name}
                  width={80}
                  height={80}
                  className="h-full w-full object-cover"
                  unoptimized
                />
              ) : (
                <span className="text-3xl font-semibold text-[#c4a24b]">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-bold text-[var(--text-primary)]">{user.name}</h1>
                  <p className="mb-2 text-sm text-[var(--text-muted)]">@{user.username}</p>
                </div>
                {/* Follow button — sadece başka kullanıcıysa ve giriş yapılmışsa */}
                {currentUser?.id && currentUser.id !== user.id && (
                  <FollowButton
                    username={user.username}
                    initialIsFollowing={user.isFollowing}
                    onFollowChange={(following) =>
                      setFollowerCount((c) => c + (following ? 1 : -1))
                    }
                  />
                )}
              </div>
              {user.bio && (
                <p className="max-w-lg text-sm leading-relaxed text-[var(--text-secondary)]">
                  {user.bio}
                </p>
              )}

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
                    <p className="text-lg font-bold text-[#c4a24b]">★ {user.avgRating}</p>
                    <p className="text-xs text-[var(--text-muted)]">Ort. Puan</p>
                  </div>
                )}
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--text-muted)]">
                    Katıldı
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">
                    {joinedDate}
                  </p>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--text-muted)]">
                    Son Giriş
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">
                    {lastLoginDate}
                  </p>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--text-muted)]">
                    Koleksiyon
                  </p>
                  <p className="mt-2 text-2xl font-black text-[var(--text-primary)]">
                    {collections.length}
                  </p>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--text-muted)]">
                    Güçlü Alan
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">
                    {topCategory ?? "Henüz yok"}
                  </p>
                </div>
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
        />
      )}

      {/* Tabs */}
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center gap-2 overflow-x-auto border-b border-[var(--border)] pb-1">
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
        </div>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--text-muted)]">
              {activeTab === "posts" ? "Profil Notları" : "Profil Koleksiyonları"}
            </p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              {activeTab === "posts"
                ? `${filteredPosts.length} / ${posts.length} not`
                : `${filteredCollections.length} / ${collections.length} koleksiyon`}
            </p>
          </div>
          <div className="relative w-full sm:max-w-xs">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeTab === "posts"
                  ? "Not, kategori veya etiket ara..."
                  : "Koleksiyon veya not ara..."
              }
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
                  <article className="flex h-full flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-card)] transition-all duration-300 hover:border-[#c4a24b]/30 sm:flex-row">
                    {/* Cover */}
                    <div
                      className="relative h-48 flex-shrink-0 sm:h-auto sm:w-[36%]"
                      style={{ minHeight: "160px" }}
                    >
                      <Image
                        loader={customLoader}
                        src={getPostImageSrc(post.image)}
                        alt={formatDisplayTitle(post.title)}
                        fill
                        sizes="200px"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                        unoptimized
                      />
                      <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[var(--image-edge-fade)] to-transparent sm:inset-y-0 sm:left-auto sm:right-0 sm:h-auto sm:w-8 sm:bg-gradient-to-l" />
                    </div>

                    {/* Content */}
                    <div className="flex min-w-0 flex-1 flex-col justify-between p-4">
                      <div>
                        <div className="mb-2 flex flex-wrap items-center gap-1.5">
                          <span className="rounded-sm border border-[#c4a24b]/25 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-[#c4a24b]">
                            {getCategoryLabel(post.category)}
                          </span>
                          {post.status && <StatusBadge status={post.status} />}
                        </div>
                        <h2 className="mb-1 line-clamp-2 text-sm font-bold leading-snug text-[var(--text-primary)] transition-colors duration-200 group-hover:text-[#c4a24b]">
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
        ) : collections.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-[var(--text-muted)]">Henüz koleksiyon yok.</p>
          </div>
        ) : filteredCollections.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg-card)] px-6 py-12 text-center">
            <p className="text-sm text-[var(--text-muted)]">Aramana uyan koleksiyon bulunamadı.</p>
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
        )}
      </div>
    </main>
  );
}
