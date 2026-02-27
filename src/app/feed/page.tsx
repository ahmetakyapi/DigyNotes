"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Post } from "@/types";
import StarRating from "@/components/StarRating";
import { StatusBadge } from "@/components/StatusBadge";
import TagBadge from "@/components/TagBadge";

const customLoader = ({ src }: { src: string }) => src;

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [empty, setEmpty] = useState(false);

  useEffect(() => {
    fetch("/api/feed")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setPosts(data);
          setEmpty(data.length === 0);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Akış</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Takip ettiklerinin son notları</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-[var(--bg-card)]" />
          ))}
        </div>
      ) : empty ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-card)]">
            <svg className="h-7 w-7 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="mb-1 font-medium text-[var(--text-secondary)]">Henüz kimseyi takip etmiyorsun.</p>
          <p className="mb-4 text-sm text-[var(--text-muted)]">Keşfet sayfasından kullanıcıları bul.</p>
          <Link
            href="/discover"
            className="rounded-lg border border-[#c4a24b]/60 bg-[#c4a24b]/10 px-5 py-2 text-sm font-semibold text-[#c4a24b] transition-all hover:bg-[#c4a24b]/20"
          >
            Keşfet
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <FeedCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}

function FeedCard({ post }: { post: Post }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] transition-all hover:border-[#c4a24b]/30">
      {post.user && (
        <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#c4a24b]/20 text-xs font-bold text-[#c4a24b]">
            {post.user.avatarUrl ? (
              <Image loader={customLoader} src={post.user.avatarUrl} alt={post.user.name} width={32} height={32} className="h-full w-full object-cover" />
            ) : (
              post.user.name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            <span className="block truncate text-sm font-semibold text-[var(--text-primary)]">{post.user.name}</span>
            {post.user.username && (
              <Link href={`/profile/${post.user.username}`} className="text-xs text-[var(--text-muted)] transition-colors hover:text-[#c4a24b]">
                @{post.user.username}
              </Link>
            )}
          </div>
          <span className="ml-auto shrink-0 text-xs text-[var(--text-muted)]">{post.date}</span>
        </div>
      )}

      <div className="flex gap-4 p-4">
        <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-xl">
          <Image loader={customLoader} src={post.image} alt={post.title} fill className="object-cover" style={{ objectPosition: post.imagePosition ?? "center" }} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-1.5">
            <span className="rounded-sm border border-[#c4a24b]/30 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#c4a24b]">{post.category}</span>
            {post.status && <StatusBadge status={post.status} />}
          </div>
          <h3 className="mb-0.5 line-clamp-1 font-semibold text-[var(--text-primary)]">{post.title}</h3>
          {post.creator && <p className="mb-2 text-xs text-[var(--text-secondary)]">{post.creator}</p>}
          {post.rating > 0 && <StarRating rating={post.rating} size={11} />}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {post.tags.slice(0, 3).map((tag) => <TagBadge key={tag.id} tag={tag} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
