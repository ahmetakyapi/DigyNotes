"use client";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Compass, Sparkle, Stack, UsersThree } from "@phosphor-icons/react";
import { getCategoryLabel, normalizeCategory } from "@/lib/categories";
import { formatDisplaySentence, formatDisplayTitle } from "@/lib/display-text";
import { getPostImageSrc } from "@/lib/post-image";
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

  const categoryCount = useMemo(
    () => new Set(posts.map((post) => normalizeCategory(post.category))).size,
    [posts]
  );
  const authorCount = useMemo(
    () => new Set(posts.map((post) => post.user?.id || post.user?.username).filter(Boolean)).size,
    [posts]
  );

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-8 rounded-[32px] border border-[var(--border)] bg-[linear-gradient(180deg,rgba(18,26,45,0.88),rgba(10,16,30,0.72))] p-6 shadow-[var(--shadow-soft)] sm:p-7">
        <span className="bg-[#c4a24b]/8 inline-flex rounded-full border border-[#c4a24b]/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--gold)]">
          Öneriler
        </span>
        <h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-[-0.03em] text-[var(--text-primary)] sm:text-4xl">
          Senin İçin Seçilen İçerikler
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)] sm:text-[15px]">
          Notlarındaki etiketlere göre topluluktan eşleşen içerikleri tek akışta gör.
        </p>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-72 animate-pulse rounded-[28px] border border-[var(--border)] bg-[var(--bg-card)]"
            />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-[32px] border border-dashed border-[var(--border)] bg-[var(--bg-card)] px-6 py-20 text-center shadow-[var(--shadow-soft)]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#c4a24b]/10 text-[var(--gold)]">
            <Compass size={28} weight="duotone" />
          </div>
          <h2 className="mt-5 text-xl font-semibold text-[var(--text-primary)]">
            Henüz öneri görünmüyor
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--text-secondary)]">
            Etiketli notların arttıkça sana daha isabetli öneriler göstermeye başlayacağız.
          </p>
          <Link
            href="/notes"
            className="hover:bg-[#c4a24b]/16 mt-6 inline-flex items-center gap-2 rounded-xl border border-[#c4a24b]/30 bg-[#c4a24b]/10 px-5 py-3 text-sm font-semibold text-[var(--gold)] transition-colors"
          >
            <Sparkle size={16} weight="duotone" />
            Notlarıma dön
          </Link>
        </div>
      ) : (
        <section className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {posts.map((post) => (
              <RecommendedCard key={post.id} post={post} />
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-[var(--border)] bg-[rgba(7,12,22,0.42)] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#c4a24b]/10 text-[var(--gold)]">
                  <Sparkle size={18} weight="duotone" />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-faint)]">
                    Gösterilen Öneri
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
                  <Stack size={18} weight="duotone" />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-faint)]">
                    Kategori
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">
                    {categoryCount}
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
                    Kaynak Profil
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">
                    {authorCount}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

function RecommendedCard({ post }: { post: Post }) {
  const displayTitle = formatDisplayTitle(post.title);
  const displayCreator = formatDisplayTitle(post.creator);
  const displayExcerpt = formatDisplaySentence(post.excerpt);

  return (
    <article className="group overflow-hidden rounded-[28px] border border-[var(--border)] bg-[linear-gradient(180deg,rgba(18,26,45,0.96),rgba(10,16,29,0.92))] shadow-[var(--shadow-soft)] transition-all duration-200 hover:-translate-y-1 hover:border-[#c4a24b]/20 hover:shadow-[var(--shadow-card)]">
      <Link href={`/posts/${post.id}`} className="block">
        <div className="relative h-48 overflow-hidden bg-[var(--bg-raised)]">
          <Image
            loader={customLoader}
            src={getPostImageSrc(post.image)}
            alt={displayTitle}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            style={{ objectPosition: post.imagePosition ?? "center" }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(7,12,22,0.88)] via-[rgba(7,12,22,0.1)] to-transparent" />
          <div className="absolute left-4 top-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-[#c4a24b]/20 bg-[rgba(7,10,18,0.68)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--gold)]">
              {getCategoryLabel(post.category)}
            </span>
            {post.status && <StatusBadge status={post.status} />}
          </div>
        </div>

        <div className="space-y-3 p-5">
          <div>
            <h2 className="line-clamp-2 text-xl font-semibold text-[var(--text-primary)] transition-colors group-hover:text-[var(--gold)]">
              {displayTitle}
            </h2>
            {post.creator && (
              <p className="mt-1 text-sm text-[var(--text-muted)]">{displayCreator}</p>
            )}
          </div>

          {post.excerpt && (
            <p className="line-clamp-3 text-sm leading-6 text-[var(--text-secondary)]">
              {displayExcerpt}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            {post.rating > 0 && <StarRating rating={post.rating} size={11} />}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {post.tags.slice(0, 3).map((tag) => (
                  <TagBadge key={tag.id} tag={tag} />
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-[var(--border)] pt-4 text-xs text-[var(--text-faint)]">
            <span>{post.user?.username ? `@${post.user.username}` : "Topluluk önerisi"}</span>
            <span className="font-medium text-[var(--gold)]">Aç →</span>
          </div>
        </div>
      </Link>
    </article>
  );
}
