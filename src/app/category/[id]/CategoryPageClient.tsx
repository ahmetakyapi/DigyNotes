"use client";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Post } from "@/types";
import StarRating from "@/components/StarRating";
import { StatusBadge } from "@/components/StatusBadge";
import { TravelMapView } from "@/components/TravelMapView";
import {
  SortFilterBar,
  SortFilterState,
  applySortFilter,
  createSortFilterState,
  hasActiveSortFilters,
  matchesAdvancedFilters,
} from "@/components/SortFilterBar";
import toast from "react-hot-toast";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeftIcon, FolderOpenIcon, MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react";
import {
  FIXED_CATEGORIES,
  getCategoryLabel,
  isTravelCategory,
  normalizeCategory,
} from "@/lib/categories";
import { formatDisplaySentence, formatDisplayTitle } from "@/lib/display-text";
import { ResilientImage } from "@/components/ResilientImage";
import { getPostImageSrc } from "@/lib/post-image";
import { categorySupportsSpoiler } from "@/lib/post-config";
import { PageHeader, Em, Dot } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";

const EASE = [0.16, 1, 0.3, 1] as const;

/** Two-digit nav-order index for fixed categories ("01" movies … "06" other), "00" otherwise. */
function getCategoryIndex(category: string) {
  const position = (FIXED_CATEGORIES as readonly string[]).indexOf(category);
  return position === -1 ? "00" : String(position + 1).padStart(2, "0");
}

export default function CategoryPageClient({ params }: { params: { id: string } }) {
  const categoryName = normalizeCategory(decodeURIComponent(params.id));
  const categoryLabel = getCategoryLabel(categoryName);
  const travelCategory = isTravelCategory(categoryName);
  const categoryIndex = getCategoryIndex(categoryName);
  const reduceMotion = useReducedMotion();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "map">(travelCategory ? "map" : "cards");
  const defaultSortFilter = useMemo(() => createSortFilterState(), []);
  const [sortFilter, setSortFilter] = useState<SortFilterState>(defaultSortFilter);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/posts?category=${encodeURIComponent(categoryName)}`);
        if (!res.ok) {
          throw new Error(`API ${res.status}`);
        }
        const postsData = await res.json();
        setPosts(Array.isArray(postsData) ? postsData : []);
      } catch {
        toast.error("Veriler yüklenemedi");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [categoryName]);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const searched = q
      ? posts.filter(
          (p) =>
            p.title.toLowerCase().includes(q) || (p.creator?.toLowerCase().includes(q) ?? false)
        )
      : posts;
    return applySortFilter(
      searched.filter((post) => matchesAdvancedFilters(post, sortFilter)),
      sortFilter
    );
  }, [posts, searchQuery, sortFilter]);

  const mappedPosts = useMemo(
    () =>
      filtered.filter(
        (post) =>
          typeof post.lat === "number" &&
          Number.isFinite(post.lat) &&
          typeof post.lng === "number" &&
          Number.isFinite(post.lng)
      ),
    [filtered]
  );

  useEffect(() => {
    if (!travelCategory) {
      setViewMode("cards");
      return;
    }
    if (mappedPosts.length === 0 && viewMode === "map") {
      setViewMode("cards");
    }
  }, [travelCategory, mappedPosts.length, viewMode]);

  const availableStatuses = useMemo(
    () =>
      Array.from(
        new Set(
          posts
            .map((post) => post.status)
            .filter(
              (status): status is string => typeof status === "string" && status.trim() !== ""
            )
        )
      ).sort((a, b) => a.localeCompare(b, "tr")),
    [posts]
  );

  const ratedPosts = posts.filter((p) => p.rating);
  const averageRating =
    ratedPosts.length > 0
      ? (posts.reduce((sum, p) => sum + (p.rating || 0), 0) / ratedPosts.length).toFixed(1)
      : null;

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center gap-2">
          <div className="h-3 w-12 animate-pulse rounded bg-[var(--border)]" />
          <div className="h-3 w-2 animate-pulse rounded bg-[var(--border)]" />
          <div className="h-3 w-20 animate-pulse rounded bg-[var(--border)]" />
        </div>
        <div className="mb-2 h-7 w-40 animate-pulse rounded-lg bg-[var(--border)]" />
        <div className="mb-8 h-3 w-16 animate-pulse rounded bg-[var(--border)]" />
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-[160px] animate-pulse rounded-[22px] border border-[var(--border)] bg-[var(--bg-card)]"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <PageHeader
        index={categoryIndex}
        eyebrow="Kategori"
        title={
          <>
            <Em>{categoryLabel}</Em> Notların
            <Dot />
          </>
        }
        description={`${categoryLabel} kategorisindeki tüm notların burada. Ara, sırala ya da filtrele.`}
        stats={[
          { value: posts.length, label: "Not" },
          ...(travelCategory ? [{ value: mappedPosts.length, label: "Konum" }] : []),
          ...(averageRating ? [{ value: averageRating, label: "Ort. Puan" }] : []),
        ]}
        actions={
          <Link
            href="/notes"
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[var(--border)] px-4 text-xs font-medium text-[var(--text-secondary)] transition-colors duration-200 hover:border-[var(--text-faint)] hover:text-[var(--text-primary)]"
          >
            <ArrowLeftIcon size={12} weight="bold" />
            Notlar
          </Link>
        }
      />

      {/* ── Arama + Sıralama satırı ── */}
      {/* LAYOUT: Toolbar row — search pill, sort/filter bar, and (travel only) cards/map segmented pill. */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <div className="relative max-w-xs flex-1">
          <MagnifyingGlassIcon
            size={13}
            weight="bold"
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`${categoryLabel} içinde ara...`}
            className="h-9 w-full rounded-full border border-[var(--border)] bg-[var(--bg-card)] pl-9 pr-8 text-[16px] text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-all focus:border-accent/40 focus:ring-1 focus:ring-accent/10 sm:text-xs"
          />
          {searchQuery && (
            <button
              type="button"
              aria-label="Aramayı temizle"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-[var(--text-muted)] transition-colors hover:text-[var(--text-secondary)]"
            >
              <XIcon size={10} />
            </button>
          )}
        </div>
        <SortFilterBar
          value={sortFilter}
          onChange={setSortFilter}
          totalCount={posts.length}
          filteredCount={filtered.length}
          availableStatuses={availableStatuses}
          defaultValue={defaultSortFilter}
        />
        {travelCategory && (
          <div className="ml-auto inline-flex rounded-full border border-[var(--border)] bg-[var(--bg-card)] p-1">
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={`cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors duration-200 ${
                viewMode === "cards"
                  ? "bg-[var(--gold)] text-[var(--text-on-accent)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Kartlar
            </button>
            <button
              type="button"
              onClick={() => setViewMode("map")}
              disabled={mappedPosts.length === 0}
              className={`cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-40 ${
                viewMode === "map"
                  ? "bg-[var(--gold)] text-[var(--text-on-accent)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Harita
            </button>
          </div>
        )}
      </div>

      {/* ── İçerik ── */}
      {filtered.length === 0 ? (
        searchQuery || hasActiveSortFilters(sortFilter, defaultSortFilter) ? (
          <EmptyState
            compact
            icon={<MagnifyingGlassIcon size={22} weight="duotone" />}
            title={
              <>
                Sonuç <Em>Bulunamadı</Em>
              </>
            }
            description="Başka bir kelime dene ya da filtreleri temizleyip tüm notlarını gör."
            primary={{
              label: "Filtreleri Temizle",
              onClick: () => {
                setSearchQuery("");
                setSortFilter(defaultSortFilter);
              },
            }}
          />
        ) : (
          <EmptyState
            icon={<FolderOpenIcon size={22} weight="duotone" />}
            title={
              <>
                Henüz <Em>{categoryLabel}</Em> Notun Yok
              </>
            }
            description="Bu kategoride henüz notun yok. İlk notunu ekleyerek başla."
            primary={{ label: "İlk Notu Ekle", href: "/new-post" }}
          />
        )
      ) : travelCategory && viewMode === "map" ? (
        <TravelMapView posts={mappedPosts} />
      ) : (
        /* LAYOUT: 1 / 2 column list of horizontal cards (poster left), staggered entrance. */
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filtered.map((post, index) => {
            const displayTitle = formatDisplayTitle(post.title);
            const displayCreator = formatDisplayTitle(post.creator);
            const displayExcerpt = formatDisplaySentence(post.excerpt);

            return (
              <motion.div
                key={post.id}
                initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: EASE, delay: Math.min(index, 8) * 0.05 }}
              >
                <Link href={`/posts/${post.id}`} className="group block h-full">
                  <article className="flex h-full flex-col overflow-hidden rounded-[22px] border border-[var(--border)] bg-[var(--bg-card)] transition-colors duration-500 ease-out-expo hover:border-[var(--text-faint)] sm:flex-row">
                    <div className="relative h-48 min-h-[140px] flex-shrink-0 overflow-hidden sm:h-auto sm:w-[32%]">
                      <ResilientImage
                        src={getPostImageSrc(post.image, post.category)}
                        alt={displayTitle}
                        fill
                        variant="wide"
                        sizes="(max-width: 768px) 32vw, 200px"
                        className="object-cover transition-transform duration-[1400ms] ease-out-expo group-hover:scale-[1.06]"
                        priority={index === 0}
                      />
                      <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[var(--image-edge-fade)] to-transparent sm:inset-y-0 sm:left-auto sm:right-0 sm:h-auto sm:w-8 sm:bg-gradient-to-l" />
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col justify-between p-5">
                      <div>
                        <div className="mb-2 flex flex-wrap items-center gap-1.5">
                          {post.years && (
                            <span className="dn-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                              {post.years}
                            </span>
                          )}
                          {post.status && <StatusBadge status={post.status} />}
                        </div>
                        <h2 className="mb-1.5 line-clamp-2 text-base font-extrabold leading-snug tracking-[-0.02em] text-[var(--text-primary)] transition-colors duration-200 group-hover:text-[var(--gold)] sm:text-lg">
                          {displayTitle}
                        </h2>
                        {post.creator && (
                          <p className="mb-2 text-xs text-[var(--text-secondary)]">
                            {displayCreator}
                          </p>
                        )}
                        {!(post.hasSpoiler && categorySupportsSpoiler(post.category)) && (
                          <p className="line-clamp-3 text-xs leading-relaxed text-[var(--text-muted)]">
                            {displayExcerpt}
                          </p>
                        )}
                      </div>
                      <div className="mt-3 flex items-center justify-between border-t border-[var(--border)] pt-3">
                        <StarRating rating={post.rating} size={12} />
                        <span className="dn-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--text-faint)]">
                          {post.date}
                        </span>
                      </div>
                    </div>
                  </article>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
