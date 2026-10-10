"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowDownIcon,
  ArrowRightIcon,
  CompassIcon,
  UsersThreeIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { getCategoryLabel } from "@/lib/categories";
import { formatDisplaySentence, formatDisplayTitle } from "@/lib/display-text";
import { getPostImageSrc } from "@/lib/post-image";
import { categorySupportsSpoiler } from "@/lib/post-config";
import { Post } from "@/types";
import { AvatarImage } from "@/components/AvatarImage";
import { ResilientImage } from "@/components/ResilientImage";
import StarRating from "@/components/StarRating";
import { StatusBadge } from "@/components/StatusBadge";
import TagBadge from "@/components/TagBadge";
import { PageHeader, Em } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";

const FEED_LIMIT = 20;
const EASE = [0.16, 1, 0.3, 1] as const;

export default function FeedPageClient() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [empty, setEmpty] = useState(false);
  const [requiresLogin, setRequiresLogin] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const reduce = useReducedMotion();

  const fetchFeed = useCallback(async (cursor?: string | null) => {
    const params = new URLSearchParams({ limit: String(FEED_LIMIT) });
    if (cursor) params.set("cursor", cursor);

    const r = await fetch(`/api/feed?${params.toString()}`);
    if (r.status === 401) {
      setRequiresLogin(true);
      return { items: [] as Post[], nextCursor: null };
    }
    if (!r.ok) {
      throw new Error("Feed fetch failed");
    }
    const data = await r.json();
    let items: Post[] = [];
    let nc: string | null = null;
    if (Array.isArray(data)) {
      items = data;
    } else if (data && Array.isArray(data.items)) {
      items = data.items;
      nc = data.nextCursor ?? null;
    }
    return { items, nextCursor: nc };
  }, []);

  useEffect(() => {
    fetchFeed()
      .then(({ items, nextCursor: nc }) => {
        setPosts(items);
        setNextCursor(nc);
        setEmpty(items.length === 0);
      })
      .catch(() => {
        setLoadFailed(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [fetchFeed]);

  const handleLoadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const { items, nextCursor: nc } = await fetchFeed(nextCursor);
      setPosts((prev) => [...prev, ...items]);
      setNextCursor(nc);
    } catch {
      // silently fail, user can retry
    } finally {
      setLoadingMore(false);
    }
  };

  const uniqueAuthors = new Set(posts.map((post) => post.user?.id).filter(Boolean)).size;
  const thisWeekCount = posts.filter((post) => {
    const createdAt = new Date(post.createdAt).getTime();
    return Number.isFinite(createdAt) && Date.now() - createdAt < 1000 * 60 * 60 * 24 * 7;
  }).length;

  const statsReady = !loading && !requiresLogin && !loadFailed && posts.length > 0;
  const headerStats = statsReady
    ? [
        { value: posts.length, label: "Not" },
        ...(uniqueAuthors > 0 ? [{ value: uniqueAuthors, label: "Kişi" }] : []),
        ...(thisWeekCount > 0 ? [{ value: thisWeekCount, label: "Bu Hafta" }] : []),
      ]
    : undefined;

  return (
    <main className="mx-auto max-w-6xl px-4 pb-12 pt-8 sm:px-6 sm:pt-10">
      {/* LAYOUT: Editorial masthead (index 07) → state block (skeleton / empty / list). */}
      <PageHeader
        index="07"
        eyebrow="Takip Ettiklerin"
        title={
          <>
            Takip Ettiklerinden <Em>Son Notlar</Em>
          </>
        }
        description="Takip ettiğin kişilerin yeni notları burada, en yenisi en üstte."
        stats={headerStats}
      />

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-48 animate-pulse rounded-[24px] border border-[var(--border)] bg-[var(--bg-card)]"
            />
          ))}
        </div>
      ) : requiresLogin ? (
        <EmptyState
          icon={<UsersThreeIcon size={22} weight="duotone" />}
          title={
            <>
              Akışı Görmek İçin <Em>Giriş Yap</Em>
            </>
          }
          description="Takip ettiğin kişilerin son notlarını görmek için giriş yapman gerekiyor."
          primary={{ label: "Giriş Yap", href: "/login" }}
          secondary={{ label: "Keşfet", href: "/discover" }}
        />
      ) : loadFailed ? (
        <EmptyState
          icon={<WarningCircleIcon size={22} weight="duotone" />}
          title={
            <>
              Akış <Em>Yüklenemedi</Em>
            </>
          }
          description="Bir sorun oldu. Biraz sonra tekrar dene ya da bu arada Keşfet sayfasına göz at."
          primary={{ label: "Keşfet", href: "/discover" }}
        />
      ) : empty ? (
        <EmptyState
          icon={<CompassIcon size={22} weight="duotone" />}
          title={
            <>
              Henüz <Em>Not</Em> Yok
            </>
          }
          description="Henüz kimseyi takip etmiyorsun ya da takip ettiklerin yeni not eklemedi. Keşfet sayfasından takip edecek kişiler bulabilirsin."
          primary={{ label: "Keşfet", href: "/discover" }}
          secondary={{ label: "Önerilere Bak", href: "/recommended" }}
        />
      ) : (
        <section className="space-y-4">
          {/* LAYOUT: Single-column stack of feed cards, staggered entrance. */}
          <div className="space-y-4">
            {posts.map((post, i) => (
              <motion.div
                key={post.id}
                initial={reduce ? false : { opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.7,
                  ease: EASE,
                  delay: Math.min(i % FEED_LIMIT, 8) * 0.05,
                }}
              >
                <FeedCard post={post} />
              </motion.div>
            ))}
          </div>

          {nextCursor && (
            <div className="flex justify-center pt-4">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-card)] px-6 text-sm font-semibold text-[var(--text-secondary)] transition-colors duration-200 hover:border-[var(--text-faint)] hover:text-[var(--text-primary)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loadingMore ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
                    Yükleniyor…
                  </>
                ) : (
                  <>
                    <ArrowDownIcon size={16} weight="bold" />
                    Daha Fazla Yükle
                  </>
                )}
              </button>
            </div>
          )}
        </section>
      )}
    </main>
  );
}

function FeedCard({ post }: Readonly<{ post: Post }>) {
  const displayTitle = formatDisplayTitle(post.title);
  const displayCreator = formatDisplayTitle(post.creator);
  const displayExcerpt = formatDisplaySentence(post.excerpt);

  return (
    /* LAYOUT: Author strip (avatar · name · mono date) over a cover + text grid. */
    <article className="group overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--bg-card)] transition-colors duration-300 ease-out-expo hover:border-[var(--text-faint)]">
      {post.user && (
        <div className="flex items-center gap-3 border-b border-[var(--border)] px-5 py-3.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent/15 text-sm font-bold text-accent">
            <AvatarImage
              src={post.user.avatarUrl}
              alt={post.user.name}
              name={post.user.name}
              size={36}
              className="h-full w-full object-cover"
              textClassName="text-sm font-bold text-accent"
            />
          </div>
          <div className="min-w-0">
            <span className="block truncate text-sm font-semibold text-[var(--text-primary)]">
              {post.user.name}
            </span>
            {post.user.username && (
              <Link
                href={`/profile/${post.user.username}`}
                className="text-[12px] font-medium text-[var(--text-muted)] transition-colors duration-200 hover:text-[var(--gold)]"
              >
                @{post.user.username}
              </Link>
            )}
          </div>
          <span className="ml-auto shrink-0 text-[12px] font-medium text-[var(--text-muted)]">
            {post.date}
          </span>
        </div>
      )}

      <Link href={`/posts/${post.id}`} className="block p-5">
        <div className="grid gap-5 lg:grid-cols-[240px_1fr]">
          <div className="relative h-52 overflow-hidden rounded-[18px] bg-[var(--bg-raised)]">
            <ResilientImage
              src={getPostImageSrc(post.image, post.category)}
              alt={displayTitle}
              fill
              className="object-cover transition-transform duration-[1200ms] ease-out-expo group-hover:scale-[1.06]"
              style={{ objectPosition: post.imagePosition ?? "center" }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[rgb(var(--ink-rgb)/0.82)] via-transparent to-transparent" />
            <div className="absolute left-3 top-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-accent/20 bg-ink/70 px-2.5 py-1 text-[12px] font-medium text-[var(--gold)]">
                {getCategoryLabel(post.category)}
              </span>
              {post.status && <StatusBadge status={post.status} />}
            </div>
          </div>

          <div className="min-w-0">
            <h3 className="line-clamp-2 text-lg font-bold tracking-[-0.02em] text-[var(--text-primary)] transition-colors duration-200 group-hover:text-[var(--gold)] sm:text-xl">
              {displayTitle}
            </h3>
            {post.creator && (
              <p className="mt-2 text-[12px] font-medium text-[var(--text-muted)]">
                {displayCreator}
              </p>
            )}
            {post.excerpt && !(post.hasSpoiler && categorySupportsSpoiler(post.category)) && (
              <p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--text-secondary)]">
                {displayExcerpt}
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-3">
              {post.rating > 0 && <StarRating rating={post.rating} size={12} />}
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {post.tags.slice(0, 3).map((tag) => (
                    <TagBadge key={tag.id} tag={tag} />
                  ))}
                </div>
              )}
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-[var(--border)] pt-4">
              <p className="text-[12px] font-medium text-[var(--text-muted)]">Takip Ettiğin Kişi</p>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--gold)]">
                Notu Aç
                <ArrowRightIcon
                  size={12}
                  weight="bold"
                  className="transition-transform duration-300 ease-out-expo group-hover:translate-x-1"
                />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}
