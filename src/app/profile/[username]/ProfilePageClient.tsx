"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Post, Tag } from "@/types";
import StarRating from "@/components/StarRating";
import { StatusBadge } from "@/components/StatusBadge";
import TagBadge from "@/components/TagBadge";

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
}

export default function ProfilePageClient({ username }: { username: string }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/users/${username}`)
      .then((r) => {
        if (!r.ok) { setNotFound(true); setLoading(false); return null; }
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        setUser(data.user);
        setPosts(data.posts);
        setLoading(false);
      })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0c0c0c] py-10">
        <div className="max-w-4xl mx-auto px-4 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-[#161616] animate-pulse" />
            <div className="space-y-2">
              <div className="h-5 w-40 rounded bg-[#161616] animate-pulse" />
              <div className="h-3 w-24 rounded bg-[#161616] animate-pulse" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-xl bg-[#161616] border border-[#2a2a2a] h-40 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !user) {
    return (
      <div className="min-h-screen bg-[#0c0c0c] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-[#161616] border border-[#2a2a2a] flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-[#555555]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <p className="text-[#888888] font-medium mb-1">Profil bulunamadı</p>
          <p className="text-xs text-[#555555] mb-4">@{username} adlı profil mevcut değil veya gizli.</p>
          <Link href="/discover" className="text-xs text-[#c9a84c] hover:underline">
            ← Kullanıcıları keşfet
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0c0c0c]">

      {/* Profile Header */}
      <div className="border-b border-[#2a2a2a] bg-[#0c0c0c]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex flex-col sm:flex-row sm:items-start gap-5">

            {/* Avatar */}
            <div className="flex-shrink-0 w-20 h-20 rounded-full overflow-hidden bg-[#161616] border border-[#2a2a2a] flex items-center justify-center">
              {user.avatarUrl ? (
                <Image
                  loader={customLoader}
                  src={user.avatarUrl}
                  alt={user.name}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              ) : (
                <span className="text-[#c9a84c] text-3xl font-semibold">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-[#f0ede8]">{user.name}</h1>
              <p className="text-[#555555] text-sm mb-2">@{user.username}</p>
              {user.bio && (
                <p className="text-[#888888] text-sm leading-relaxed max-w-lg">{user.bio}</p>
              )}

              {/* Stats */}
              <div className="flex items-center gap-5 mt-4">
                <div className="text-center">
                  <p className="text-lg font-bold text-[#f0ede8]">{user.postCount}</p>
                  <p className="text-xs text-[#555555]">Not</p>
                </div>
                {user.avgRating > 0 && (
                  <div className="text-center">
                    <p className="text-lg font-bold text-[#c9a84c]">★ {user.avgRating}</p>
                    <p className="text-xs text-[#555555]">Ort. Puan</p>
                  </div>
                )}
                <div className="text-center">
                  <p className="text-lg font-bold text-[#f0ede8]">
                    {new Date(user.createdAt).getFullYear()}
                  </p>
                  <p className="text-xs text-[#555555]">Üye Yılı</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Posts */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {posts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[#555555] text-sm">Henüz not yok.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {posts.map((post) => (
              <Link key={post.id} href={`/posts/${post.id}`} className="group block">
                <article
                  className="flex h-full rounded-xl overflow-hidden bg-[#111111] border border-[#1e1e1e]
                             hover:border-[#c9a84c]/30 transition-all duration-300
                             hover:shadow-[0_4px_24px_rgba(201,168,76,0.08)]"
                >
                  {/* Cover */}
                  <div className="relative flex-shrink-0" style={{ width: "36%", minHeight: "160px" }}>
                    <Image
                      loader={customLoader}
                      src={post.image}
                      alt={post.title}
                      fill
                      sizes="200px"
                      className="object-cover group-hover:scale-[1.04] transition-transform duration-500"
                      unoptimized
                    />
                    <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#111111] to-transparent" />
                  </div>

                  {/* Content */}
                  <div className="flex flex-col justify-between p-4 flex-1 min-w-0">
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5 mb-2">
                        <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#c9a84c] border border-[#c9a84c]/25 px-1.5 py-0.5 rounded-sm">
                          {post.category}
                        </span>
                        {post.status && <StatusBadge status={post.status} />}
                      </div>
                      <h2 className="text-sm font-bold text-[#e8eaf6] leading-snug mb-1 line-clamp-2 group-hover:text-[#c9a84c] transition-colors duration-200">
                        {post.title}
                      </h2>
                      {post.creator && (
                        <p className="text-xs text-[#555555] mb-1.5">{post.creator}</p>
                      )}
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-1.5">
                          {(post.tags as Tag[]).slice(0, 2).map((tag) => (
                            <TagBadge key={tag.id} tag={tag} />
                          ))}
                          {post.tags.length > 2 && (
                            <span className="text-[10px] text-[#555555] self-center">
                              +{post.tags.length - 2}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[#1e1e1e]">
                      <StarRating rating={post.rating} size={11} />
                      <span className="text-[10px] text-[#444]">{post.date}</span>
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
