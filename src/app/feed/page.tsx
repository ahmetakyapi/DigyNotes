"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Compass,
  Sparkle,
  UsersThree,
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

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [empty, setEmpty] = useState(false);
  const [requiresLogin, setRequiresLogin] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    fetch("/api/feed")
      .then(async (r) => {
        if (r.status === 401) {
          setRequiresLogin(true);
          return [];
        }
        if (!r.ok) {
          setLoadFailed(true);
          return [];
        }
        return r.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setPosts(data);
          setEmpty(data.length === 0);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoadFailed(true);
        setLoading(false);
      });
  }, []);

  const uniqueAuthors = new Set(posts.map((post) => post.user?.id).filter(Boolean)).size;
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
      ) : requiresLogin ? (
        <div className="rounded-[32px] border border-dashed border-[var(--border)] bg-[var(--bg-card)] px-6 py-20 text-center shadow-[var(--shadow-soft)]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#c4a24b]/10 text-[var(--gold)]">
            <UsersThree size={28} weight="duotone" />
          </div>
          <h2 className="mt-5 text-xl font-semibold text-[var(--text-primary)]">
            Akışı görmek için giriş yap
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--text-secondary)]">
            Burası takip ettiğin kişilerin en yeni notları için ayrıldı. Giriş yaptığında akış,
            kronolojik olarak kimden ne geldiğini gösterecek.
          </p>
          <Link
            href="/login"
            className="hover:bg-[#6366f1]/12 mt-6 inline-flex items-center gap-2 rounded-xl border border-[#6366f1]/30 bg-[#6366f1]/8 px-5 py-3 text-sm font-semibold text-[#818cf8] transition-colors"
          >
            Giriş yap
          </Link>
        </div>
      ) : loadFailed ? (
        <div className="rounded-[32px] border border-dashed border-[var(--border)] bg-[var(--bg-card)] px-6 py-20 text-center shadow-[var(--shadow-soft)]">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">Akış yüklenemedi</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--text-secondary)]">
            Takip akışını şu anda getiremedik. Biraz sonra yeniden deneyebilir veya Keşfet
            yüzeyinden yeni içeriklere dönebilirsin.
          </p>
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
            className="hover:bg-[#6366f1]/12 mt-6 inline-flex items-center gap-2 rounded-xl border border-[#6366f1]/30 bg-[#6366f1]/8 px-5 py-3 text-sm font-semibold text-[#818cf8] transition-colors"
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

          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-[var(--text-muted)]">
            <span>{posts.length} not</span>
            <span className="text-[var(--text-faint)]">·</span>
            <span>{uniqueAuthors} kişi</span>
            <span className="text-[var(--text-faint)]">·</span>
            <span>Bu hafta {thisWeekCount}</span>
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
            <AvatarImage
              src={post.user.avatarUrl}
              alt={post.user.name}
              name={post.user.name}
              size={40}
              className="h-full w-full object-cover"
              textClassName="text-sm font-bold text-[#c4a24b]"
            />
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
            <ResilientImage
              src={getPostImageSrc(post.image, post.category)}
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
            {post.excerpt && !(post.hasSpoiler && categorySupportsSpoiler(post.category)) && (
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
              <p className="text-xs text-[var(--text-faint)]">Takip akışından nota geç</p>
              <span className="text-xs font-medium text-[var(--gold)]">Aç →</span>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}
