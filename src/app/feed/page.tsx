"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowsClockwise,
  Compass,
  NewspaperClipping,
  Sparkle,
  UsersThree,
} from "@phosphor-icons/react";
import { getCategoryLabel, normalizeCategory } from "@/lib/categories";
import { formatDisplaySentence, formatDisplayTitle } from "@/lib/display-text";
import { getPostImageSrc } from "@/lib/post-image";
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

  const uniqueAuthors = new Set(posts.map((post) => post.user?.id).filter(Boolean)).size;
  const categoriesCount = new Set(posts.map((post) => normalizeCategory(post.category))).size;
  const thisWeekCount = posts.filter((post) => {
    const createdAt = new Date(post.createdAt).getTime();
    return Number.isFinite(createdAt) && Date.now() - createdAt < 1000 * 60 * 60 * 24 * 7;
  }).length;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-48 animate-pulse rounded-[28px] border border-[var(--border)] bg-[var(--bg-card)]"
            />
          ))}
        </div>
      ) : empty ? (
        <div className="rounded-[32px] border border-dashed border-[var(--border)] bg-[var(--bg-card)] px-6 py-20 text-center shadow-[var(--shadow-soft)]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#c4a24b]/10 text-[var(--gold)]">
            <Compass size={28} weight="duotone" />
          </div>
          <h2 className="mt-5 text-xl font-semibold text-[var(--text-primary)]">
            Akışın henüz boş görünüyor
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--text-secondary)]">
            Henüz kimseyi takip etmiyorsun ya da takip ettiklerinden yeni içerik gelmedi. Keşfet
            sayfasından yeni profiller bulabilirsin.
          </p>
          <Link
            href="/discover"
            className="hover:bg-[#c4a24b]/16 mt-6 inline-flex items-center gap-2 rounded-xl border border-[#c4a24b]/30 bg-[#c4a24b]/10 px-5 py-3 text-sm font-semibold text-[var(--gold)] transition-colors"
          >
            <Sparkle size={16} weight="duotone" />
            Keşfet
          </Link>
        </div>
      ) : (
        <section className="space-y-4">
          <div className="rounded-[32px] border border-[var(--border)] bg-[linear-gradient(180deg,rgba(18,26,45,0.88),rgba(10,16,30,0.72))] p-6 shadow-[var(--shadow-soft)] sm:p-7">
            <span className="bg-[#c4a24b]/8 inline-flex rounded-full border border-[#c4a24b]/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--gold)]">
              Akış
            </span>
            <h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-[-0.03em] text-[var(--text-primary)] sm:text-4xl">
              Son Güncellemeler
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)] sm:text-[15px]">
              Takip ettiğin kişilerden gelen en yeni notlar burada görünür.
            </p>
          </div>

          <div className="space-y-4">
            {posts.map((post) => (
              <FeedCard key={post.id} post={post} />
            ))}
          </div>

          <div className="grid gap-3 pt-2 sm:grid-cols-3">
            <div className="rounded-2xl border border-[var(--border)] bg-[rgba(7,12,22,0.42)] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#c4a24b]/10 text-[var(--gold)]">
                  <NewspaperClipping size={18} weight="duotone" />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-faint)]">
                    Yeni Notlar
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">
                    {posts.length}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[rgba(7,12,22,0.42)] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#c4a24b]/10 text-[var(--gold)]">
                  <UsersThree size={18} weight="duotone" />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-faint)]">
                    Aktif Kişiler
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">
                    {uniqueAuthors}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[rgba(7,12,22,0.42)] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#c4a24b]/10 text-[var(--gold)]">
                  <ArrowsClockwise size={18} weight="duotone" />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-faint)]">
                    Bu hafta
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">
                    {thisWeekCount}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-xs text-[var(--text-muted)]">{categoriesCount} kategori</p>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

function FeedCard({ post }: { post: Post }) {
  const displayTitle = formatDisplayTitle(post.title);
  const displayCreator = formatDisplayTitle(post.creator);
  const displayExcerpt = formatDisplaySentence(post.excerpt);

  return (
    <article className="hover:border-[#c4a24b]/18 overflow-hidden rounded-[28px] border border-[var(--border)] bg-[linear-gradient(180deg,rgba(18,26,45,0.96),rgba(10,16,29,0.92))] shadow-[var(--shadow-soft)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[var(--shadow-card)]">
      {post.user && (
        <div className="flex items-center gap-3 border-b border-[var(--border)] px-5 py-4">
          <div className="bg-[#c4a24b]/16 flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-sm font-bold text-[#c4a24b]">
            {post.user.avatarUrl ? (
              <Image
                loader={customLoader}
                src={post.user.avatarUrl}
                alt={post.user.name}
                width={40}
                height={40}
                className="h-full w-full object-cover"
              />
            ) : (
              post.user.name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            <span className="block truncate text-sm font-semibold text-[var(--text-primary)]">
              {post.user.name}
            </span>
            {post.user.username && (
              <Link
                href={`/profile/${post.user.username}`}
                className="text-xs text-[var(--text-muted)] transition-colors hover:text-[#c4a24b]"
              >
                @{post.user.username}
              </Link>
            )}
          </div>
          <span className="ml-auto shrink-0 text-xs text-[var(--text-faint)]">{post.date}</span>
        </div>
      )}

      <Link href={`/posts/${post.id}`} className="block p-5">
        <div className="grid gap-5 lg:grid-cols-[240px_1fr]">
          <div className="relative h-52 overflow-hidden rounded-[24px] bg-[var(--bg-raised)]">
            <Image
              loader={customLoader}
              src={getPostImageSrc(post.image)}
              alt={displayTitle}
              fill
              className="object-cover"
              style={{ objectPosition: post.imagePosition ?? "center" }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[rgba(7,12,22,0.82)] via-transparent to-transparent" />
            <div className="absolute left-4 top-4 flex flex-wrap items-center gap-2">
              <span className="border-[#c4a24b]/18 rounded-full border bg-[rgba(7,10,18,0.68)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--gold)]">
                {getCategoryLabel(post.category)}
              </span>
              {post.status && <StatusBadge status={post.status} />}
            </div>
          </div>

          <div className="min-w-0">
            <h3 className="line-clamp-2 text-2xl font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
              {displayTitle}
            </h3>
            {post.creator && (
              <p className="mt-2 text-sm text-[var(--text-secondary)]">{displayCreator}</p>
            )}
            {post.excerpt && (
              <p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--text-muted)]">
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
              <p className="text-xs text-[var(--text-faint)]">Not detayına git</p>
              <span className="text-xs font-medium text-[var(--gold)]">Aç →</span>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}
