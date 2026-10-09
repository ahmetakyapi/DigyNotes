"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
import { PushPin } from "@phosphor-icons/react";

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
  const [privateProfile, setPrivateProfile] = useState<{
    name: string;
    username: string;
    avatarUrl: string | null;
  } | null>(null);
  const [followModal, setFollowModal] = useState<"followers" | "following" | null>(null);
  const [activeTab, setActiveTab] = useState<"posts" | "collections" | "liked">("posts");
  const [searchQuery, setSearchQuery] = useState("");
  const [likedPosts, setLikedPosts] = useState<Post[]>([]);
  const [likedLoading, setLikedLoading] = useState(false);
  const [likedLoaded, setLikedLoaded] = useState(false);

  useEffect(() => {
    setNotFound(false);
    setPrivateProfile(null);
    fetch(`/api/users/${username}`)
      .then(async (r) => {
        if (r.status === 403) {
          const body = await r.json().catch(() => null);
          if (body?.isPrivate && body.profile) {
            setPrivateProfile(body.profile);
          } else {
            setNotFound(true);
          }
          setLoading(false);
          return null;
        }
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

  const coverImages = useMemo(
    () =>
      posts
        .map((p) => p.image)
        .filter((src): src is string => typeof src === "string" && /^https?:\/\//.test(src))
        .slice(0, 8),
    [posts]
  );
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
        label: "Notlar",
        count: `${filteredPosts.length} / ${posts.length} not`,
        placeholder: "Not, kategori ya da etiket ara...",
      };
    }
    if (activeTab === "collections") {
      return {
        label: "Koleksiyonlar",
        count: `${filteredCollections.length} / ${collections.length} koleksiyon`,
        placeholder: "Koleksiyon ya da not ara...",
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

  if (privateProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-8 text-center shadow-[var(--shadow-soft)]">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-[var(--border)] bg-[var(--bg-raised)]">
            <AvatarImage
              src={privateProfile.avatarUrl}
              alt={privateProfile.name}
              name={privateProfile.name}
              size={80}
              className="h-full w-full object-cover"
              textClassName="text-2xl font-bold text-[var(--text-secondary)]"
            />
          </div>
          <p className="text-lg font-semibold text-[var(--text-primary)]">{privateProfile.name}</p>
          <p className="mb-5 text-xs text-[var(--text-muted)]">@{privateProfile.username}</p>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-raised)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)]">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            Bu profil gizli
          </div>
          <p className="mb-5 text-xs leading-5 text-[var(--text-muted)]">
            Bu kişinin notlarını görmek için onu takip etmen ya da profilini herkese açması
            gerekiyor.
          </p>
          <Link href="/discover" className="text-xs text-[var(--gold)] hover:underline">
            ← Kişileri keşfet
          </Link>
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
            @{username} adında bir kullanıcı yok.
          </p>
          <Link href="/discover" className="text-xs text-[var(--gold)] hover:underline">
            ← Kişileri keşfet
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen">
      {/* LAYOUT: Cinematic profile masthead.
          COVER: full-bleed tilted mosaic of the user's own covers, ink veil fading into the page.
          BODY (overlaps cover): avatar ring · giant name + @handle · follow action (right)
                 → bio → big serif stats (Not / Takipçi / Takip / Ort. Puan) → mono chips + dates. */}
      <section className="relative">
        <div aria-hidden className="relative h-[220px] overflow-hidden sm:h-[320px]">
          {coverImages.length > 0 ? (
            <div className="absolute inset-[-30%] grid -rotate-[8deg] grid-cols-4 gap-3 sm:grid-cols-6">
              {[...coverImages, ...coverImages, ...coverImages].slice(0, 18).map((src, i) => (
                <div
                  key={`${src}-${i}`}
                  className={`relative aspect-[2/3] overflow-hidden rounded-xl ${i % 2 ? "translate-y-[16%]" : ""}`}
                >
                  <Image src={src} alt="" fill unoptimized sizes="20vw" className="object-cover" />
                </div>
              ))}
            </div>
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgb(var(--gold-rgb)/0.22),transparent_60%),radial-gradient(ellipse_at_80%_80%,rgb(var(--accent-2-rgb)/0.14),transparent_60%)]" />
          )}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(var(--ink-rgb)/0.35)_0%,rgb(var(--ink-rgb)/0.55)_55%,var(--bg-base)_100%)]" />
        </div>

        <div className="relative mx-auto -mt-20 max-w-4xl px-4 pb-8 sm:-mt-24 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--border)] bg-[var(--bg-card)] ring-[6px] ring-[var(--bg-base)] sm:h-28 sm:w-28">
              <AvatarImage
                src={user.avatarUrl}
                alt={user.name}
                name={user.name}
                size={112}
                className="h-full w-full object-cover"
                textClassName="dn-display text-5xl italic text-[var(--gold)]"
              />
            </div>
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
                className="inline-flex h-11 items-center rounded-full bg-[var(--gold)] px-5 text-sm font-semibold text-[var(--text-on-accent)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[var(--gold-light)] active:scale-95"
              >
                Takip Etmek İçin Giriş Yap
              </Link>
            )}
          </div>

          <p className="dn-mono mt-6 text-[10.5px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
            <span className="text-[var(--gold)]">(@)</span> {user.username}
            {topCategory && (
              <span className="text-[var(--text-faint)]"> · En Çok: {topCategory}</span>
            )}
          </p>
          <h1 className="mt-2 text-[clamp(2.6rem,7vw,4.8rem)] font-extrabold leading-[0.9] tracking-[-0.055em] text-[var(--text-primary)]">
            {user.name}
            <span className="text-[var(--gold)]">.</span>
          </h1>
          {user.bio && (
            <p className="dn-display mt-4 max-w-xl text-xl italic leading-snug text-[var(--text-secondary)] sm:text-2xl">
              “{user.bio}”
            </p>
          )}

          <div className="mt-8 flex flex-wrap items-end gap-x-8 gap-y-4 border-t border-[var(--border)] pt-6">
            <ProfileStat value={user.postCount} label="Not" />
            <button
              type="button"
              onClick={() => setFollowModal("followers")}
              className="cursor-pointer text-left transition-opacity duration-200 hover:opacity-70"
            >
              <ProfileStat value={followerCount} label="Takipçi" />
            </button>
            <button
              type="button"
              onClick={() => setFollowModal("following")}
              className="cursor-pointer text-left transition-opacity duration-200 hover:opacity-70"
            >
              <ProfileStat value={user.followingCount} label="Takip" />
            </button>
            {user.avgRating > 0 && <ProfileStat value={user.avgRating} label="Ort. Puan" accent />}
            <div className="dn-mono ml-auto flex flex-col gap-1 text-right text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
              <span>Katıldı · {joinedDate}</span>
              <span>Son Giriş · {lastLoginDate}</span>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="dn-mono rounded-full border border-[var(--border)] px-3 py-1 text-[10.5px] uppercase tracking-[0.1em] text-[var(--text-muted)]">
              {posts.length} Herkese Açık Not
            </span>
            <span className="dn-mono rounded-full border border-[var(--border)] px-3 py-1 text-[10.5px] uppercase tracking-[0.1em] text-[var(--text-muted)]">
              {collections.length} Koleksiyon
            </span>
            {currentUser?.id && currentUser.id !== user.id && isFollowingProfile && (
              <span className="dn-mono rounded-full bg-accent/12 px-3 py-1 text-[10.5px] uppercase tracking-[0.1em] text-[var(--gold)]">
                Takip Ediyorsun
              </span>
            )}
          </div>
        </div>
      </section>

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
      <div className="mx-auto max-w-4xl px-4 pb-10 sm:px-6">
        {/* ── Tab bar ── */}
        <div className="mb-6 inline-flex rounded-full border border-[var(--border)] bg-[var(--bg-card)] p-1">
          {[
            { key: "posts" as const, label: "Notlar" },
            { key: "collections" as const, label: "Koleksiyonlar" },
            { key: "liked" as const, label: "Beğenilenler" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                activeTab === tab.key
                  ? "bg-accent text-[var(--text-on-accent)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
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
            <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg-card)] px-6 py-16 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10">
                <svg
                  className="h-5 w-5 text-[var(--gold)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium text-[var(--text-secondary)]">Henüz not yok</p>
              <p className="mx-auto mt-1 max-w-xs text-xs text-[var(--text-muted)]">
                Bu kişi henüz herkese açık bir not paylaşmamış.
              </p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg-card)] px-6 py-12 text-center">
              <p className="text-sm text-[var(--text-muted)]">Aramana uyan not yok.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {filteredPosts.map((post) => (
                <Link key={post.id} href={`/posts/${post.id}`} className="group block">
                  <article
                    className={`flex h-full flex-col overflow-hidden rounded-xl border bg-[var(--bg-card)] transition-all duration-300 hover:border-accent/30 sm:flex-row ${post.isPinned ? "border-accent/20" : "border-[var(--border)]"}`}
                  >
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
                          <span className="rounded-sm border border-accent/25 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-accent">
                            {getCategoryLabel(post.category)}
                          </span>
                          {post.isPinned && (
                            <span className="flex shrink-0 items-center gap-1 rounded-sm border border-accent/25 bg-accent/8 px-1.5 py-0.5 text-[9px] font-semibold text-accent">
                              <PushPin size={9} weight="fill" /> Sabit
                            </span>
                          )}
                          {post.status && <StatusBadge status={post.status} />}
                        </div>
                        <h2 className="mb-1 line-clamp-2 text-sm font-bold leading-snug text-[var(--text-primary)] transition-colors duration-200 group-hover:text-accent">
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
            <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg-card)] px-6 py-16 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10">
                <svg
                  className="h-5 w-5 text-[var(--gold)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium text-[var(--text-secondary)]">
                Henüz koleksiyon yok
              </p>
              <p className="mx-auto mt-1 max-w-xs text-xs text-[var(--text-muted)]">
                Bu kişi henüz koleksiyon oluşturmamış.
              </p>
            </div>
          ) : filteredCollections.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg-card)] px-6 py-12 text-center">
              <p className="text-sm text-[var(--text-muted)]">Aramana uyan koleksiyon yok.</p>
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
            <p className="text-sm text-[var(--text-muted)]">Henüz beğendiği bir not yok.</p>
          </div>
        ) : filteredLikedPosts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg-card)] px-6 py-12 text-center">
            <p className="text-sm text-[var(--text-muted)]">Aramana uyan not yok.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {filteredLikedPosts.map((post) => (
              <Link key={post.id} href={`/posts/${post.id}`} className="group block">
                <article className="flex h-full flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-card)] transition-all duration-300 hover:border-accent/30 sm:flex-row">
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
                        <span className="rounded-sm border border-accent/25 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-accent">
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
                      <h2 className="mb-1 line-clamp-2 text-sm font-bold leading-snug text-[var(--text-primary)] transition-colors duration-200 group-hover:text-accent">
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

function ProfileStat({
  value,
  label,
  accent = false,
}: {
  value: number;
  label: string;
  accent?: boolean;
}) {
  return (
    <span className="flex flex-col">
      <span
        className={`dn-display text-[40px] italic leading-none tracking-[-0.02em] sm:text-5xl ${
          accent ? "text-[var(--gold)]" : "text-[var(--text-primary)]"
        }`}
      >
        {value}
      </span>
      <span className="dn-mono mt-1 text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
        {label}
      </span>
    </span>
  );
}
