"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Post, Tag } from "@/types";
import StarRating from "@/components/StarRating";
import { StatusBadge } from "@/components/StatusBadge";
import TagBadge from "@/components/TagBadge";
import FollowButton from "@/components/FollowButton";
import FollowListModal from "@/components/FollowListModal";

const customLoader = ({ src }: { src: string }) => src;

interface PublicUser {
  id: string;
  name: string;
  username: string;
  bio: string | null;
  avatarUrl: string | null;
  isPublic: boolean;
  createdAt: string;
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
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [followModal, setFollowModal] = useState<"followers" | "following" | null>(null);

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
        setLoading(false);
      })
      .catch(() => {
        setNotFound(true);
        setLoading(false);
      });
  }, [username]);

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
          <Link href="/discover" className="text-xs text-[#c9a84c] hover:underline">
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
                <span className="text-3xl font-semibold text-[#c9a84c]">
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
                <p className="max-w-lg text-sm leading-relaxed text-[var(--text-secondary)]">{user.bio}</p>
              )}

              {/* Stats */}
              <div className="mt-4 flex items-center gap-5">
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
                  <p className="text-lg font-bold text-[var(--text-primary)]">{user.followingCount}</p>
                  <p className="text-xs text-[var(--text-muted)]">Takip</p>
                </button>
                {user.avgRating > 0 && (
                  <div className="text-center">
                    <p className="text-lg font-bold text-[#c9a84c]">★ {user.avgRating}</p>
                    <p className="text-xs text-[var(--text-muted)]">Ort. Puan</p>
                  </div>
                )}
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

      {/* Posts */}
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {posts.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-[var(--text-muted)]">Henüz not yok.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {posts.map((post) => (
              <Link key={post.id} href={`/posts/${post.id}`} className="group block">
                <article className="flex h-full overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-card)] transition-all duration-300 hover:border-[#c9a84c]/30">
                  {/* Cover */}
                  <div
                    className="relative flex-shrink-0"
                    style={{ width: "36%", minHeight: "160px" }}
                  >
                    <Image
                      loader={customLoader}
                      src={post.image}
                      alt={post.title}
                      fill
                      sizes="200px"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                      unoptimized
                    />
                    <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[var(--bg-card)] to-transparent" />
                  </div>

                  {/* Content */}
                  <div className="flex min-w-0 flex-1 flex-col justify-between p-4">
                    <div>
                      <div className="mb-2 flex flex-wrap items-center gap-1.5">
                        <span className="rounded-sm border border-[#c9a84c]/25 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-[#c9a84c]">
                          {post.category}
                        </span>
                        {post.status && <StatusBadge status={post.status} />}
                      </div>
                      <h2 className="mb-1 line-clamp-2 text-sm font-bold leading-snug text-[var(--text-primary)] transition-colors duration-200 group-hover:text-[#c9a84c]">
                        {post.title}
                      </h2>
                      {post.creator && (
                        <p className="mb-1.5 text-xs text-[var(--text-muted)]">{post.creator}</p>
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
