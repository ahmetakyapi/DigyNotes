"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Post } from "@/types";
import StarRating from "@/components/StarRating";
import { StatusBadge } from "@/components/StatusBadge";
import { getCategoryLabel } from "@/lib/categories";
import { formatDisplaySentence, formatDisplayTitle } from "@/lib/display-text";
import { getPostImageSrc } from "@/lib/post-image";
import { categorySupportsSpoiler } from "@/lib/post-config";
import { ResilientImage } from "@/components/ResilientImage";
import { AvatarImage } from "@/components/AvatarImage";

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
      <div className="mb-8 rounded-[28px] border border-[var(--border)] bg-[linear-gradient(135deg,rgba(196,162,75,0.12),rgba(12,18,31,0.94),rgba(104,136,192,0.08))] p-5 shadow-[var(--shadow-soft)] sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Link
                href="/discover"
                className="text-xs text-[var(--text-muted)] transition-colors hover:text-[#6366f1]"
              >
                ← Keşfet
              </Link>
              <span className="text-[var(--border)]">•</span>
              <Link
                href="/notes"
                className="text-xs text-[var(--text-muted)] transition-colors hover:text-[#6366f1]"
              >
                Notlar
              </Link>
            </div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--gold)]">
              Etiket yüzeyi
            </p>
            <h1 className="mt-2 text-2xl font-bold text-[var(--text-primary)]">
              <span className="text-[#6366f1]">#</span>
              {tagName}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
              Bu etiket, farklı profiller ve kategoriler arasında aynı hafıza izini taşıyan herkese
              açık notları bir araya getirir.
            </p>
            {!loading && (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
                <span className="rounded-full border border-[var(--border)] bg-[var(--bg-raised)] px-3 py-1">
                  {posts.length} herkese açık not
                </span>
                <span className="rounded-full border border-[var(--border)] bg-[var(--bg-raised)] px-3 py-1">
                  Detail, etiket ve public akış
                </span>
              </div>
            )}
          </div>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-[16px] text-[var(--text-primary)] outline-none transition-colors focus:border-[#6366f1]/40 sm:text-sm"
          >
            <option value="newest">En Yeni</option>
            <option value="oldest">En Eski</option>
            <option value="rating">Puana Göre</option>
          </select>
        </div>
      </div>

      {/* İçerik */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-2xl bg-[var(--bg-card)]" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-card)]">
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
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
              />
            </svg>
          </div>
          <p className="text-[var(--text-muted)]">Bu etiketle henüz herkese açık not yok.</p>
          <p className="mt-2 max-w-md text-sm text-[var(--text-muted)]">
            Not detaylarından gelen etiket tıklamaları burada ortak bağlam oluşturur. Aynı etiketi
            kullanan ilk herkese açık not bu yüzeyi başlatır.
          </p>
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
  const displayTitle = formatDisplayTitle(post.title);
  const displayCreator = formatDisplayTitle(post.creator);
  const displayExcerpt = formatDisplaySentence(post.excerpt);
  const shouldHideExcerpt = Boolean(post.hasSpoiler && categorySupportsSpoiler(post.category));

  return (
    <article className="group overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] transition-all hover:border-[#6366f1]/30 hover:shadow-[var(--shadow-soft)]">
      {/* Image */}
      <Link href={`/posts/${post.id}`} className="relative block h-40 w-full overflow-hidden">
        <ResilientImage
          src={getPostImageSrc(post.image, post.category)}
          alt={displayTitle}
          fill
          variant="wide"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          style={{ objectPosition: post.imagePosition ?? "center" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-card)] via-transparent to-transparent" />
        <div className="absolute bottom-2 left-3 flex items-center gap-1.5">
          <span className="rounded-sm border border-[#6366f1]/30 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#6366f1]">
            {getCategoryLabel(post.category)}
          </span>
          {post.status && <StatusBadge status={post.status} />}
        </div>
      </Link>

      {/* Body */}
      <div className="p-4">
        <Link href={`/posts/${post.id}`} className="block">
          <h3 className="mb-1 line-clamp-1 font-semibold text-[var(--text-primary)] transition-colors group-hover:text-[#6366f1]">
            {displayTitle}
          </h3>
        </Link>
        {post.creator && (
          <p className="mb-2 text-xs text-[var(--text-secondary)]">{displayCreator}</p>
        )}

        {!shouldHideExcerpt && post.excerpt && (
          <Link href={`/posts/${post.id}`} className="block">
            <p className="mb-3 line-clamp-3 text-xs leading-6 text-[var(--text-muted)]">
              {displayExcerpt}
            </p>
          </Link>
        )}

        {post.rating > 0 && (
          <div className="mb-2">
            <StarRating rating={post.rating} size={11} />
          </div>
        )}

        {/* User */}
        {post.user && (
          <div className="mt-3 flex items-center gap-2 border-t border-[var(--border)] pt-3">
            <div className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-[#6366f1]/20 text-[9px] font-bold text-[#6366f1]">
              <AvatarImage
                src={post.user.avatarUrl}
                alt={post.user.name}
                name={post.user.name}
                size={24}
                className="h-full w-full object-cover"
                textClassName="text-[9px] font-bold text-[#6366f1]"
              />
            </div>
            {post.user.username ? (
              <Link
                href={`/profile/${post.user.username}`}
                className="text-xs text-[var(--text-muted)] transition-colors hover:text-[#6366f1]"
              >
                @{post.user.username}
              </Link>
            ) : (
              <span className="text-xs text-[var(--text-muted)]">{post.user.name}</span>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
