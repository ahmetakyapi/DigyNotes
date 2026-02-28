"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Post } from "@/types";
import { PostsList } from "@/components/PostsList";

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

export default function NotesPageClient({ initialQuery }: { initialQuery: string }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [postsCursor, setPostsCursor] = useState<string | null>(null);
  const [savedCursor, setSavedCursor] = useState<string | null>(null);
  const [postsError, setPostsError] = useState<string | null>(null);
  const [savedError, setSavedError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMorePosts, setLoadingMorePosts] = useState(false);
  const [loadingMoreSaved, setLoadingMoreSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchInitial = async () => {
      setLoading(true);
      setLoadingMorePosts(false);
      setLoadingMoreSaved(false);
      setPostsError(null);
      setSavedError(null);

      const queryParam = initialQuery.trim() ? `&q=${encodeURIComponent(initialQuery.trim())}` : "";

      const [postsResult, savedResult] = await Promise.allSettled([
        fetchPaginated(`/api/posts?paginate=1&limit=${PAGE_SIZE}${queryParam}`),
        fetchPaginated(`/api/bookmarks?paginate=1&limit=${PAGE_SIZE}`),
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
      const queryParam = initialQuery.trim() ? `&q=${encodeURIComponent(initialQuery.trim())}` : "";
      const data = await fetchPaginated(
        `/api/posts?paginate=1&limit=${PAGE_SIZE}&cursor=${encodeURIComponent(postsCursor)}${queryParam}`
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

  if (posts.length === 0 && savedPosts.length === 0) {
    const hasQuery = initialQuery.trim().length > 0;

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
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
        </div>
        <p className="mb-2 text-base text-[var(--text-muted)]">
          {hasQuery ? `"${initialQuery}" için sonuç bulunamadı.` : "Henüz not eklenmemiş."}
        </p>
        <p className="mb-4 max-w-md text-sm text-[var(--text-muted)]">
          {hasQuery
            ? "Aramayı sadeleştirip tekrar deneyebilir veya yeni bir not oluşturabilirsin."
            : "İlk notunu oluşturarak akışı başlatabilirsin."}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {hasQuery && (
            <Link
              href="/notes"
              className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-5 py-2.5 text-sm font-semibold text-[var(--text-secondary)] transition-colors hover:text-[var(--gold)]"
            >
              Aramayı temizle
            </Link>
          )}
          <Link
            href="/new-post"
            className="rounded-lg bg-[#c4a24b] px-5 py-2.5 text-sm font-semibold text-[#0f1117] transition-colors hover:bg-[#d7ba68]"
          >
            {hasQuery ? "Yeni not ekle" : "İlk notu ekle"}
          </Link>
        </div>
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

      <PostsList
        allPosts={posts}
        savedPosts={savedPosts}
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
