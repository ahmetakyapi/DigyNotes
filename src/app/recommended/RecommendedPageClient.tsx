"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRightIcon, CompassIcon, SparkleIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { getCategoryLabel, normalizeCategory } from "@/lib/categories";
import { formatDisplaySentence, formatDisplayTitle } from "@/lib/display-text";
import { getPostImageSrc } from "@/lib/post-image";
import { categorySupportsSpoiler } from "@/lib/post-config";
import { Post } from "@/types";
import { ResilientImage } from "@/components/ResilientImage";
import StarRating from "@/components/StarRating";
import { StatusBadge } from "@/components/StatusBadge";
import TagBadge from "@/components/TagBadge";
import { PageHeader, Em, Dot } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";

const EASE = [0.16, 1, 0.3, 1] as const;

export default function RecommendedPageClient() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [requiresLogin, setRequiresLogin] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    fetch("/api/recommendations")
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
        setPosts(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setLoadFailed(true);
        setLoading(false);
      });
  }, []);

  const categoryCount = useMemo(
    () => new Set(posts.map((post) => normalizeCategory(post.category))).size,
    [posts]
  );
  const authorCount = useMemo(
    () => new Set(posts.map((post) => post.user?.id || post.user?.username).filter(Boolean)).size,
    [posts]
  );

  const headerStats =
    !loading && !requiresLogin && !loadFailed && posts.length > 0
      ? [
          { value: posts.length, label: "Öneri" },
          ...(categoryCount > 0 ? [{ value: categoryCount, label: "Kategori" }] : []),
          ...(authorCount > 0 ? [{ value: authorCount, label: "Profil" }] : []),
        ]
      : undefined;

  return (
    <main className="mx-auto max-w-6xl px-4 pb-12 pt-8 sm:px-6 sm:pt-10">
      {/* LAYOUT: Editorial masthead (index 08) → state block (skeleton / empty / 3-col grid). */}
      <PageHeader
        index="08"
        eyebrow="Öneriler"
        title={
          <>
            Sana <Em>Önerilenler</Em>
            <Dot />
          </>
        }
        description="Notlarına ve etiketlerine bakarak seçtiklerimiz."
        stats={headerStats}
      />

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-72 animate-pulse rounded-[24px] border border-[var(--border)] bg-[var(--bg-card)]"
            />
          ))}
        </div>
      ) : requiresLogin ? (
        <EmptyState
          icon={<SparkleIcon size={22} weight="duotone" />}
          title={
            <>
              Önerileri Görmek İçin <Em>Giriş Yap</Em>
            </>
          }
          description="Öneriler senin notlarına göre hazırlanıyor. Giriş yaptığında sana uygun notları burada görürsün."
          primary={{ label: "Giriş Yap", href: "/login" }}
          secondary={{ label: "Keşfet", href: "/discover" }}
        />
      ) : loadFailed ? (
        <EmptyState
          icon={<WarningCircleIcon size={22} weight="duotone" />}
          title={
            <>
              Öneriler <Em>Yüklenemedi</Em>
            </>
          }
          description="Bir sorun oldu. Biraz sonra tekrar dene."
          primary={{ label: "Notlarıma Dön", href: "/notes" }}
        />
      ) : posts.length === 0 ? (
        <EmptyState
          icon={<CompassIcon size={22} weight="duotone" />}
          title={
            <>
              Henüz <Em>Öneri</Em> Yok
            </>
          }
          description="Birkaç not ekleyip etiketledikçe önerilerin burada belirmeye başlayacak."
          primary={{ label: "Notlarıma Dön", href: "/notes" }}
          secondary={{ label: "Keşfet", href: "/discover" }}
        />
      ) : (
        <section className="space-y-6">
          {/* LAYOUT: Responsive 1/2/3-column grid of recommendation cards, staggered entrance. */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {posts.map((post, i) => (
              <motion.div
                key={post.id}
                className="h-full"
                initial={reduce ? false : { opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: EASE, delay: Math.min(i, 8) * 0.05 }}
              >
                <RecommendedCard post={post} />
              </motion.div>
            ))}
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
    /* LAYOUT: Cover (category + status pills) over title, mono creator, excerpt, meta footer. */
    <article className="group h-full overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--bg-card)] transition-colors duration-300 ease-out-expo hover:border-[var(--text-faint)]">
      <Link href={`/posts/${post.id}`} className="flex h-full flex-col">
        <div className="relative h-48 overflow-hidden bg-[var(--bg-raised)]">
          <ResilientImage
            src={getPostImageSrc(post.image, post.category)}
            alt={displayTitle}
            fill
            className="object-cover transition-transform duration-[1200ms] ease-out-expo group-hover:scale-[1.06]"
            style={{ objectPosition: post.imagePosition ?? "center" }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[rgb(var(--ink-rgb)/0.88)] via-[rgb(var(--ink-rgb)/0.1)] to-transparent" />
          <div className="absolute left-4 top-4 flex flex-wrap items-center gap-2">
            <span className="dn-mono rounded-full border border-accent/20 bg-ink/70 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-[var(--gold)]">
              {getCategoryLabel(post.category)}
            </span>
            {post.status && <StatusBadge status={post.status} />}
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-3 p-5">
          {post.user?.username && (
            <span className="dn-mono inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-[var(--gold)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
              Benzer Zevk
            </span>
          )}
          <div>
            <h2 className="line-clamp-2 text-lg font-bold tracking-[-0.02em] text-[var(--text-primary)] transition-colors duration-200 group-hover:text-[var(--gold)]">
              {displayTitle}
            </h2>
            {post.creator && (
              <p className="dn-mono mt-1.5 text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
                {displayCreator}
              </p>
            )}
          </div>

          {post.excerpt && !(post.hasSpoiler && categorySupportsSpoiler(post.category)) && (
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

          <div className="mt-auto flex items-center justify-between border-t border-[var(--border)] pt-4">
            <span className="dn-mono truncate text-[10px] uppercase tracking-[0.14em] text-[var(--text-faint)]">
              {post.user?.username ? `@${post.user.username}` : "Topluluktan"}
            </span>
            <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-[var(--gold)]">
              Notu Aç
              <ArrowRightIcon
                size={12}
                weight="bold"
                className="transition-transform duration-300 ease-out-expo group-hover:translate-x-1"
              />
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
