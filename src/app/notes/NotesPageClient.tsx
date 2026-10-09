"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Post } from "@/types";
import { PostsList } from "@/components/posts-list";
import RecentlyViewed from "@/components/RecentlyViewed";
import { WelcomeHeader } from "@/components/WelcomeHeader";

const PAGE_SIZE = 12;

interface PaginatedPostsResponse {
  items: Post[];
  nextCursor: string | null;
}

function mergePosts(current: Post[], incoming: Post[]) {
  const ids = new Set(current.map((post) => post.id));
  const merged = [...current];

  for (const post of incoming) {
    if (ids.has(post.id)) continue;
    ids.add(post.id);
    merged.push(post);
  }

  return merged;
}

async function fetchPaginated(url: string): Promise<PaginatedPostsResponse> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error("Pagination fetch failed");
  }

  const data = (await res.json()) as PaginatedPostsResponse;

  return {
    items: Array.isArray(data.items) ? data.items : [],
    nextCursor: typeof data.nextCursor === "string" ? data.nextCursor : null,
  };
}

interface NotesPageClientProps {
  readonly initialQuery: string;
  readonly initialCategory: string;
  readonly initialTags: string[];
  readonly initialTab: "notlar" | "kaydedilenler" | "taslaklar" | "arsiv";
}

function buildPostsUrl(query: string, category: string, tags: string[], cursor?: string | null) {
  const params = new URLSearchParams({
    paginate: "1",
    limit: String(PAGE_SIZE),
  });

  const trimmedQuery = query.trim();
  const trimmedCategory = category.trim();
  const normalizedTags = tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean);

  if (trimmedQuery) params.set("q", trimmedQuery);
  if (trimmedCategory) params.set("category", trimmedCategory);
  if (normalizedTags.length > 0) params.set("tags", normalizedTags.join(","));
  if (cursor) params.set("cursor", cursor);

  return `/api/posts?${params.toString()}`;
}

export default function NotesPageClient({
  initialQuery,
  initialCategory,
  initialTags,
  initialTab,
}: NotesPageClientProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [postsCursor, setPostsCursor] = useState<string | null>(null);
  const [savedCursor, setSavedCursor] = useState<string | null>(null);
  const [postsError, setPostsError] = useState<string | null>(null);
  const [savedError, setSavedError] = useState<string | null>(null);
  const [draftPosts, setDraftPosts] = useState<Post[]>([]);
  const [archivedPosts, setArchivedPosts] = useState<Post[]>([]);
  const [draftsCursor, setDraftsCursor] = useState<string | null>(null);
  const [archivedCursor, setArchivedCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMorePosts, setLoadingMorePosts] = useState(false);
  const [loadingMoreSaved, setLoadingMoreSaved] = useState(false);
  const [draftsLoaded, setDraftsLoaded] = useState(false);
  const [archivedLoaded, setArchivedLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchInitial = async () => {
      setLoading(true);
      setLoadingMorePosts(false);
      setLoadingMoreSaved(false);
      setPostsError(null);
      setSavedError(null);

      const [postsResult, savedResult, draftsResult, archivedResult] = await Promise.allSettled([
        fetchPaginated(buildPostsUrl(initialQuery, initialCategory, initialTags)),
        fetchPaginated(`/api/bookmarks?paginate=1&limit=${PAGE_SIZE}`),
        fetchPaginated(`/api/posts?paginate=1&limit=${PAGE_SIZE}&drafts=1`),
        fetchPaginated(`/api/posts?paginate=1&limit=${PAGE_SIZE}&archived=1`),
      ]);

      if (cancelled) return;

      if (postsResult.status === "fulfilled") {
        setPosts(postsResult.value.items);
        setPostsCursor(postsResult.value.nextCursor);
      } else {
        setPosts([]);
        setPostsCursor(null);
        setPostsError("Notlar şu anda yüklenemedi.");
      }

      if (savedResult.status === "fulfilled") {
        setSavedPosts(savedResult.value.items);
        setSavedCursor(savedResult.value.nextCursor);
      } else {
        setSavedPosts([]);
        setSavedCursor(null);
        setSavedError("Kaydedilenler sekmesi şu anda yüklenemedi.");
      }

      if (draftsResult.status === "fulfilled") {
        setDraftPosts(draftsResult.value.items);
        setDraftsCursor(draftsResult.value.nextCursor);
        setDraftsLoaded(true);
      }

      if (archivedResult.status === "fulfilled") {
        setArchivedPosts(archivedResult.value.items);
        setArchivedCursor(archivedResult.value.nextCursor);
        setArchivedLoaded(true);
      }

      if (!cancelled) {
        setLoading(false);
      }
    };

    void fetchInitial();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery, initialCategory, initialTags.join(",")]);

  const loadMorePosts = async () => {
    if (!postsCursor || loadingMorePosts) return;

    setLoadingMorePosts(true);
    try {
      const data = await fetchPaginated(
        buildPostsUrl(initialQuery, initialCategory, initialTags, postsCursor)
      );

      setPosts((prev) => mergePosts(prev, data.items));
      setPostsCursor(data.nextCursor);
    } catch {
      setPostsCursor(null);
      setPostsError("Daha fazla not yüklenemedi.");
    } finally {
      setLoadingMorePosts(false);
    }
  };

  const loadMoreSavedPosts = async () => {
    if (!savedCursor || loadingMoreSaved) return;

    setLoadingMoreSaved(true);
    try {
      const data = await fetchPaginated(
        `/api/bookmarks?paginate=1&limit=${PAGE_SIZE}&cursor=${encodeURIComponent(savedCursor)}`
      );

      setSavedPosts((prev) => mergePosts(prev, data.items));
      setSavedCursor(data.nextCursor);
    } catch {
      setSavedCursor(null);
      setSavedError("Kaydedilenlerin devamı yüklenemedi.");
    } finally {
      setLoadingMoreSaved(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-3 py-6 sm:px-6 sm:py-8">
        <div className="mb-5 h-11 animate-pulse rounded-xl bg-[var(--bg-card)]" />
        <div className="space-y-4">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-40 animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]"
            />
          ))}
        </div>
      </div>
    );
  }

  if (
    posts.length === 0 &&
    savedPosts.length === 0 &&
    draftPosts.length === 0 &&
    archivedPosts.length === 0
  ) {
    const hasQuery = initialQuery.trim().length > 0;
    const hasCategory = initialCategory.trim().length > 0;
    const hasTags = initialTags.length > 0;
    const hasFilterPath = hasQuery || hasCategory || hasTags;

    if (hasFilterPath) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-card)]">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-[var(--text-muted)]"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
            </svg>
          </div>
          <p className="mb-2 text-base text-[var(--text-secondary)]">
            Aradığın filtre yolunda sonuç bulunamadı.
          </p>
          <p className="mb-4 max-w-md text-sm text-[var(--text-muted)]">
            Aramayı sadeleştirip tekrar deneyebilir veya yeni bir not oluşturabilirsin.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/notes"
              className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-5 py-2.5 text-sm font-semibold text-[var(--text-secondary)] transition-colors hover:text-[var(--gold)]"
            >
              Aramayı Temizle
            </Link>
            <Link
              href="/new-post"
              className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-[var(--text-on-accent)] transition-all hover:bg-accent-dark"
            >
              Yeni Not Ekle
            </Link>
          </div>
        </div>
      );
    }

    const quickStartCategories = [
      {
        name: "Film",
        hint: "İzlediklerin",
        img: "/landing/media/perfect-days.webp",
        href: "/new-post?category=film",
      },
      {
        name: "Dizi",
        hint: "Takip Ettiklerin",
        img: "/landing/media/severance.webp",
        href: "/new-post?category=dizi",
      },
      {
        name: "Kitap",
        hint: "Okudukların",
        img: "/landing/media/stoner.webp",
        href: "/new-post?category=kitap",
      },
      {
        name: "Oyun",
        hint: "Oynadıkların",
        img: "/landing/media/outer-wilds.webp",
        href: "/new-post?category=oyun",
      },
      {
        name: "Gezi",
        hint: "Gezdiklerin",
        img: "/landing/media/kyoto.webp",
        href: "/new-post?category=gezi",
      },
      {
        name: "Diğer",
        hint: "Kalan Her Şey",
        img: "/landing/media/disco-elysium.webp",
        href: "/new-post?category=diger",
      },
    ];

    /* LAYOUT: Onboarding stage for an empty archive.
       TOP: mono eyebrow + oversized headline with serif accent + one-line copy.
       GRID: 6 category tiles (3 cols mobile → 6 desktop); each tile is a tilted cover that
             straightens and lifts on hover, with index number, name and verb.
       BOTTOM: primary pill + discover link. */
    return (
      <div className="mx-auto max-w-5xl px-3 pb-16 pt-10 sm:px-6 sm:pt-14">
        <p className="dn-mono text-[10.5px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
          <span className="text-[var(--gold)]">(00)</span> İlk Adım
        </p>
        <h2 className="mt-4 max-w-[720px] text-[clamp(2.6rem,7vw,5rem)] font-extrabold leading-[0.9] tracking-[-0.04em] text-[var(--text-primary)]">
          Henüz Hiç <span className="dn-display font-normal italic tracking-[-0.02em]">Notun</span>{" "}
          Yok
          <span className="text-[var(--gold)]">.</span>
        </h2>
        <p className="mt-4 max-w-[480px] text-[15px] leading-relaxed text-[var(--text-secondary)]">
          Bir kategori seç ve ilk notunu ekle. Adını yazman yeter, gerisini biz doldururuz.
        </p>

        <div className="mt-10 grid grid-cols-3 gap-3 sm:gap-4 lg:grid-cols-6">
          {quickStartCategories.map((cat, i) => (
            <Link
              key={cat.name}
              href={cat.href}
              className="group relative flex cursor-pointer flex-col rounded-[22px] border border-[var(--border)] bg-[var(--bg-card)] p-3 transition-all duration-500 ease-out-expo hover:-translate-y-1 hover:border-[var(--text-faint)]"
            >
              <div
                className={`relative aspect-[2/3] overflow-hidden rounded-[14px] transition-transform duration-700 ease-out-expo group-hover:rotate-0 ${
                  i % 2 ? "rotate-[2deg]" : "-rotate-[2deg]"
                }`}
              >
                <Image
                  src={cat.img}
                  alt=""
                  fill
                  sizes="(min-width:1024px) 150px, 30vw"
                  className="object-cover opacity-70 grayscale-[35%] transition-all duration-700 ease-out-expo group-hover:scale-105 group-hover:opacity-100 group-hover:grayscale-0"
                />
                <span className="dn-mono absolute left-2 top-2 rounded-full bg-[rgb(var(--ink-rgb)/0.6)] px-2 py-0.5 text-[9.5px] text-[#f2efe8] backdrop-blur-md">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <span className="mt-3 flex items-center justify-between">
                <span className="text-base font-bold tracking-[-0.02em] text-[var(--text-primary)]">
                  {cat.name}
                </span>
                <span className="text-[var(--text-muted)] transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-[var(--gold)]">
                  +
                </span>
              </span>
              <span className="dn-display text-sm italic text-[var(--text-muted)]">{cat.hint}</span>
            </Link>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link
            href="/new-post"
            className="inline-flex h-12 cursor-pointer items-center rounded-full bg-[var(--gold)] px-6 text-sm font-semibold text-[var(--text-on-accent)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[var(--gold-light)] active:scale-95"
          >
            İlk Notu Ekle
          </Link>
          <Link
            href="/discover"
            className="group relative text-sm font-medium text-[var(--text-secondary)] transition-colors duration-200 hover:text-[var(--text-primary)]"
          >
            Ya da Başkalarının Notlarına Göz At
            <span className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-current transition-transform duration-500 ease-out-expo group-hover:scale-x-100" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {(postsError || savedError) && (
        <div className="mx-auto mb-4 max-w-5xl px-3 pt-6 sm:px-6 sm:pt-8">
          <div className="rounded-2xl border border-accent/20 bg-accent/8 px-4 py-3 text-sm text-[var(--text-secondary)]">
            {[postsError, savedError].filter(Boolean).join(" ")}
          </div>
        </div>
      )}

      <WelcomeHeader posts={posts} />

      <div className="mx-auto max-w-5xl px-3 pt-2 sm:px-6 sm:pt-4">
        <RecentlyViewed />
      </div>

      <PostsList
        initialActiveCategory={initialCategory}
        initialActiveTab={initialTab}
        initialActiveTags={initialTags}
        allPosts={posts}
        searchQuery={initialQuery}
        savedPosts={savedPosts}
        draftPosts={draftPosts}
        archivedPosts={archivedPosts}
        hasMorePosts={postsCursor !== null}
        hasMoreSavedPosts={savedCursor !== null}
        isLoadingMorePosts={loadingMorePosts}
        isLoadingMoreSavedPosts={loadingMoreSaved}
        onLoadMorePosts={loadMorePosts}
        onLoadMoreSavedPosts={loadMoreSavedPosts}
      />
    </>
  );
}
