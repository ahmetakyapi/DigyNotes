"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Post } from "@/types";
import StarRating from "@/components/StarRating";
import { StatusBadge } from "@/components/StatusBadge";
import TagBadge from "@/components/TagBadge";

const customLoader = ({ src }: { src: string }) => src;

export default function RecommendedPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/recommendations")
      .then((r) => r.json())
      .then((data) => {
        setPosts(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Senin İçin Öneriler</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Notlarındaki tag&apos;lere göre topluluktan seçmeler
        </p>
      </div>

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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <p className="mb-1 font-medium text-[var(--text-secondary)]">Henüz öneri yok.</p>
          <p className="mb-4 text-sm text-[var(--text-muted)]">
            Daha fazla not ekleyip tag&apos;ledikçe öneriler belirecek.
          </p>
          <Link href="/new-post" className="rounded-lg border border-[#c4a24b]/60 bg-[#c4a24b]/10 px-5 py-2 text-sm font-semibold text-[#c4a24b] transition-all hover:bg-[#c4a24b]/20">
            Not Ekle
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => <RecommendedCard key={post.id} post={post} />)}
        </div>
      )}
    </div>
  );
}

function RecommendedCard({ post }: { post: Post }) {
  return (
    <div className="group overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] transition-all hover:border-[#c4a24b]/30">
      <div className="relative h-40 w-full overflow-hidden">
        <Image loader={customLoader} src={post.image} alt={post.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" style={{ objectPosition: post.imagePosition ?? "center" }} />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-card)] via-transparent to-transparent" />
        <div className="absolute bottom-2 left-3 flex items-center gap-1.5">
          <span className="rounded-sm border border-[#c4a24b]/30 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#c4a24b]">{post.category}</span>
          {post.status && <StatusBadge status={post.status} />}
        </div>
      </div>
      <div className="p-4">
        <h3 className="mb-0.5 line-clamp-1 font-semibold text-[var(--text-primary)] transition-colors group-hover:text-[#c4a24b]">{post.title}</h3>
        {post.creator && <p className="mb-2 text-xs text-[var(--text-secondary)]">{post.creator}</p>}
        {post.rating > 0 && <div className="mb-2"><StarRating rating={post.rating} size={11} /></div>}
        {post.tags && post.tags.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1">
            {post.tags.slice(0, 3).map((tag) => <TagBadge key={tag.id} tag={tag} />)}
          </div>
        )}
        {post.user && (
          <div className="flex items-center gap-2 border-t border-[var(--border)] pt-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#c4a24b]/20 text-[9px] font-bold text-[#c4a24b]">
              {post.user.avatarUrl ? (
                <Image loader={customLoader} src={post.user.avatarUrl} alt={post.user.name} width={24} height={24} className="h-full w-full object-cover" />
              ) : post.user.name.charAt(0).toUpperCase()}
            </div>
            {post.user.username ? (
              <Link href={`/profile/${post.user.username}`} className="text-xs text-[var(--text-muted)] transition-colors hover:text-[#c4a24b]">
                @{post.user.username}
              </Link>
            ) : <span className="text-xs text-[var(--text-muted)]">{post.user.name}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
