"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Post } from "@/types";
import StarRating from "@/components/StarRating";
import { StatusBadge } from "@/components/StatusBadge";

const customLoader = ({ src }: { src: string }) => src;

type SortOption = "newest" | "oldest" | "rating";

export default function TagPageClient({ params }: { params: { name: string } }) {
  const tagName = decodeURIComponent(params.name);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortOption>("newest");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/public/posts?tag=${encodeURIComponent(tagName)}&sort=${sort}&limit=50`)
      .then((r) => r.json())
      .then((data) => {
        setPosts(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [tagName, sort]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Link
              href="/discover"
              className="text-xs text-[var(--text-muted)] transition-colors hover:text-[#c9a84c]"
            >
              ← Keşfet
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            <span className="text-[#c9a84c]">#</span>
            {tagName}
          </h1>
          {!loading && (
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {posts.length} public not
            </p>
          )}
        </div>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
          className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition-colors focus:border-[#c9a84c]/40"
        >
          <option value="newest">En Yeni</option>
          <option value="oldest">En Eski</option>
          <option value="rating">Puana Göre</option>
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-2xl bg-[var(--bg-card)]" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-card)]">
            <svg className="h-7 w-7 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </div>
          <p className="text-[var(--text-muted)]">Bu tag ile henüz public not yok.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}

function PostCard({ post }: { post: Post }) {
  return (
    <div className="group overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] transition-all hover:border-[#c9a84c]/30">
      {/* Image */}
      <div className="relative h-40 w-full overflow-hidden">
        <Image
          loader={customLoader}
          src={post.image}
          alt={post.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          style={{ objectPosition: post.imagePosition ?? "center" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-card)] via-transparent to-transparent" />
        <div className="absolute bottom-2 left-3 flex items-center gap-1.5">
          <span className="rounded-sm border border-[#c9a84c]/30 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#c9a84c]">
            {post.category}
          </span>
          {post.status && <StatusBadge status={post.status} />}
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <h3 className="mb-1 line-clamp-1 font-semibold text-[var(--text-primary)] transition-colors group-hover:text-[#c9a84c]">
          {post.title}
        </h3>
        {post.creator && <p className="mb-2 text-xs text-[var(--text-secondary)]">{post.creator}</p>}

        {post.rating > 0 && (
          <div className="mb-2">
            <StarRating rating={post.rating} size={11} />
          </div>
        )}

        {/* User */}
        {post.user && (
          <div className="mt-3 flex items-center gap-2 border-t border-[var(--border)] pt-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#c9a84c]/20 text-[9px] font-bold text-[#c9a84c]">
              {post.user.avatarUrl ? (
                <Image
                  loader={customLoader}
                  src={post.user.avatarUrl}
                  alt={post.user.name}
                  width={24}
                  height={24}
                  className="rounded-full object-cover"
                />
              ) : (
                post.user.name.charAt(0).toUpperCase()
              )}
            </div>
            {post.user.username ? (
              <Link
                href={`/profile/${post.user.username}`}
                className="text-xs text-[var(--text-muted)] transition-colors hover:text-[#c9a84c]"
              >
                @{post.user.username}
              </Link>
            ) : (
              <span className="text-xs text-[var(--text-muted)]">{post.user.name}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
