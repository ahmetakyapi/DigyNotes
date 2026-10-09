"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeftIcon, HashIcon } from "@phosphor-icons/react";
import { Post } from "@/types";
import StarRating from "@/components/StarRating";
import { StatusBadge } from "@/components/StatusBadge";
import { getCategoryLabel } from "@/lib/categories";
import { formatDisplaySentence, formatDisplayTitle } from "@/lib/display-text";
import { getPostImageSrc } from "@/lib/post-image";
import { categorySupportsSpoiler } from "@/lib/post-config";
import { ResilientImage } from "@/components/ResilientImage";
import { AvatarImage } from "@/components/AvatarImage";
import { PageHeader, Em, Dot } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";

const EASE = [0.16, 1, 0.3, 1] as const;

type SortOption = "newest" | "oldest" | "rating";

export default function TagPageClient({ params }: { params: { name: string } }) {
  const tagName = decodeURIComponent(params.name);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortOption>("newest");
  const reduceMotion = useReducedMotion();

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
      <PageHeader
        index="13"
        eyebrow="Etiket"
        title={
          <>
            <span className="text-[var(--gold)]">#</span>
            <Em>{tagName}</Em>
            <Dot />
          </>
        }
        description="Bu etiket, farklı profiller ve kategoriler arasında aynı hafıza izini taşıyan herkese açık notları bir araya getirir."
        stats={loading ? undefined : [{ value: posts.length, label: "Herkese Açık Not" }]}
        actions={
          <>
            <Link
              href="/discover"
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[var(--border)] px-4 text-xs font-medium text-[var(--text-secondary)] transition-colors duration-200 hover:border-[var(--text-faint)] hover:text-[var(--text-primary)]"
            >
              <ArrowLeftIcon size={12} weight="bold" />
              Keşfet
            </Link>
            <Link
              href="/notes"
              className="hidden h-9 items-center rounded-full border border-[var(--border)] px-4 text-xs font-medium text-[var(--text-secondary)] transition-colors duration-200 hover:border-[var(--text-faint)] hover:text-[var(--text-primary)] sm:inline-flex"
            >
              Notlar
            </Link>
          </>
        }
      />

      {/* LAYOUT: Sort pill aligned right above the grid. */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <p className="dn-mono text-[10.5px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
          Sıralama
        </p>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
          className="h-9 cursor-pointer rounded-full border border-[var(--border)] bg-[var(--bg-card)] px-4 text-[16px] text-[var(--text-primary)] outline-none transition-colors duration-200 focus:border-accent/50 sm:text-xs"
        >
          <option value="newest">En Yeni</option>
          <option value="oldest">En Eski</option>
          <option value="rating">Puana Göre</option>
        </select>
      </div>

      {/* İçerik */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-72 animate-pulse rounded-[24px] border border-[var(--border)] bg-[var(--bg-card)]"
            />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <EmptyState
          icon={<HashIcon size={22} weight="duotone" />}
          title={
            <>
              Bu Etiket Henüz <Em>Sessiz</Em>
            </>
          }
          description="Bu etiketle henüz herkese açık not yok. Aynı etiketi kullanan ilk herkese açık not bu yüzeyi başlatır."
          primary={{ label: "Not Yaz", href: "/new-post" }}
          secondary={{ label: "Keşfet", href: "/discover" }}
        />
      ) : (
        /* LAYOUT: 1 / 2 / 3 column grid with staggered entrance. */
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post, i) => (
            <motion.div
              key={post.id}
              initial={reduceMotion ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE, delay: Math.min(i, 8) * 0.05 }}
            >
              <PostCard post={post} />
            </motion.div>
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
    <article className="group flex h-full flex-col overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--bg-card)] transition-colors duration-500 ease-out-expo hover:border-[var(--text-faint)]">
      {/* Image */}
      <Link href={`/posts/${post.id}`} className="relative block h-48 w-full overflow-hidden">
        <ResilientImage
          src={getPostImageSrc(post.image, post.category)}
          alt={displayTitle}
          fill
          variant="wide"
          className="object-cover transition-transform duration-[1400ms] ease-out-expo group-hover:scale-[1.06]"
          style={{ objectPosition: post.imagePosition ?? "center" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-card)] via-transparent to-transparent" />
        <div className="absolute left-3 top-3 flex items-center gap-1.5">
          <span className="dn-mono rounded-full border border-[var(--border)] bg-[var(--bg-overlay)] px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-[var(--text-primary)] backdrop-blur-sm">
            {getCategoryLabel(post.category)}
          </span>
          {post.status && <StatusBadge status={post.status} />}
        </div>
      </Link>

      {/* Body */}
      <div className="flex flex-1 flex-col px-5 pb-5 pt-2">
        <Link href={`/posts/${post.id}`} className="block">
          <h3 className="mb-1 line-clamp-2 text-lg font-extrabold leading-snug tracking-[-0.02em] text-[var(--text-primary)] transition-colors duration-200 group-hover:text-[var(--gold)]">
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
          <div className="mt-auto flex items-center gap-2 border-t border-[var(--border)] pt-3">
            <div className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-accent/20 text-[9px] font-bold text-accent">
              <AvatarImage
                src={post.user.avatarUrl}
                alt={post.user.name}
                name={post.user.name}
                size={24}
                className="h-full w-full object-cover"
                textClassName="text-[9px] font-bold text-accent"
              />
            </div>
            {post.user.username ? (
              <Link
                href={`/profile/${post.user.username}`}
                className="text-xs text-[var(--text-muted)] transition-colors hover:text-accent"
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
