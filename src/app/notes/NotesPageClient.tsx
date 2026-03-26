"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Post } from "@/types";
import { PostsList } from "@/components/posts-list";
import RecentlyViewed from "@/components/RecentlyViewed";

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
        fetchPaginated(buildPostsUrl(initialQuery, "", [])),
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
  }, [initialQuery]);

  const loadMorePosts = async () => {
    if (!postsCursor || loadingMorePosts) return;

    setLoadingMorePosts(true);
    try {
      const data = await fetchPaginated(buildPostsUrl(initialQuery, "", [], postsCursor));

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

  if (posts.length === 0 && savedPosts.length === 0 && draftPosts.length === 0 && archivedPosts.length === 0) {
    const hasQuery = initialQuery.trim().length > 0;
    const hasCategory = initialCategory.trim().length > 0;
    const hasTags = initialTags.length > 0;
    const hasFilterPath = hasQuery || hasCategory || hasTags;

    if (hasFilterPath) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-card)]">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--text-muted)]">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
            </svg>
          </div>
          <p className="mb-2 text-base text-[var(--text-secondary)]">Aradığın filtre yolunda sonuç bulunamadı.</p>
          <p className="mb-4 max-w-md text-sm text-[var(--text-muted)]">
            Aramayı sadeleştirip tekrar deneyebilir veya yeni bir not oluşturabilirsin.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/notes"
              className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-5 py-2.5 text-sm font-semibold text-[var(--text-secondary)] transition-colors hover:text-[var(--gold)]"
            >
              Aramayı temizle
            </Link>
            <Link
              href="/new-post"
              className="rounded-lg bg-gradient-to-r from-[#10b981] via-[#059669] to-[#047857] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(16,185,129,0.28)] transition-all hover:shadow-[0_6px_20px_rgba(16,185,129,0.38)] hover:brightness-110"
            >
              Yeni not ekle
            </Link>
          </div>
        </div>
      );
    }

    const quickStartCategories = [
      { name: "Film", emoji: "🎬", href: "/new-post?category=film" },
      { name: "Dizi", emoji: "📺", href: "/new-post?category=dizi" },
      { name: "Kitap", emoji: "📖", href: "/new-post?category=kitap" },
      { name: "Oyun", emoji: "🎮", href: "/new-post?category=oyun" },
      { name: "Gezi", emoji: "✈️", href: "/new-post?category=gezi" },
      { name: "Diğer", emoji: "📝", href: "/new-post?category=diger" },
    ];

    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#10b981]">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
        </div>
        <h2 className="mb-2 text-xl font-bold text-[var(--text-primary)]">İlk notunu oluştur</h2>
        <p className="mb-6 max-w-md text-sm text-[var(--text-muted)]">
          İzlediğin filmleri, okuduğun kitapları, oynadığın oyunları ve gezdiğin yerleri not al.
          Puanla, etiketle ve koleksiyonlar oluştur.
        </p>

        <div className="mb-6 grid grid-cols-3 gap-2.5 sm:grid-cols-6">
          {quickStartCategories.map((cat) => (
            <Link
              key={cat.name}
              href={cat.href}
              className="flex flex-col items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3.5 transition-all duration-200 hover:border-[#10b981]/30 hover:bg-[#10b981]/5"
            >
              <span className="text-2xl">{cat.emoji}</span>
              <span className="text-xs font-medium text-[var(--text-secondary)]">{cat.name}</span>
            </Link>
          ))}
        </div>

        <Link
          href="/new-post"
          className="rounded-lg bg-gradient-to-r from-[#10b981] via-[#059669] to-[#047857] px-6 py-3 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(16,185,129,0.28)] transition-all hover:shadow-[0_6px_20px_rgba(16,185,129,0.38)] hover:brightness-110"
        >
          İlk notu ekle
        </Link>

        <p className="mt-8 text-xs text-[var(--text-muted)]">
          Veya{" "}
          <Link href="/discover" className="text-[var(--gold)] transition-colors hover:text-[#e0c068]">
            topluluğu keşfet
          </Link>{" "}
          ve ilham al.
        </p>
      </div>
    );
  }

  return (
    <>
      {(postsError || savedError) && (
        <div className="mx-auto mb-4 max-w-5xl px-3 pt-6 sm:px-6 sm:pt-8">
          <div className="border-[var(--gold)]/20 bg-[var(--gold)]/8 rounded-2xl border px-4 py-3 text-sm text-[var(--text-secondary)]">
            {[postsError, savedError].filter(Boolean).join(" ")}
          </div>
        </div>
      )}

      <div className="mx-auto max-w-5xl px-3 pt-3 sm:px-6 sm:pt-4">
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
