"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Post } from "@/types";
import StarRating from "@/components/StarRating";
import { StatusBadge } from "@/components/StatusBadge";
import { SortFilterBar, SortFilterState, applySortFilter } from "@/components/SortFilterBar";
import toast from "react-hot-toast";
import { MagnifyingGlass, X } from "@phosphor-icons/react";

const customLoader = ({ src }: { src: string }) => src;

export default function CategoryPageClient({ params }: { params: { id: string } }) {
  const router = useRouter();
  const categoryName = decodeURIComponent(params.id);

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortFilter, setSortFilter] = useState<SortFilterState>({ sort: "newest", minRating: 0 });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/posts?category=${encodeURIComponent(categoryName)}`);
        const postsData: Post[] = await res.json();
        setPosts(postsData);
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
    return applySortFilter(searched, sortFilter);
  }, [posts, searchQuery, sortFilter]);

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
              className="h-[140px] animate-pulse rounded-xl border border-[var(--border)] bg-[var(--bg-card)]"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* ── Header ── */}
      <div className="mb-6">
        <nav className="mb-3 flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
          <Link href="/notes" className="transition-colors hover:text-[#c4a24b]">
            Notlar
          </Link>
          <span className="opacity-40">›</span>
          <span className="font-medium text-[var(--text-secondary)]">{categoryName}</span>
        </nav>

        <div>
          <h1 className="mb-2 text-2xl font-bold text-[var(--text-primary)]">{categoryName}</h1>
          <div className="flex items-center gap-3">
            <div className="h-0.5 w-8 rounded-full bg-gradient-to-r from-[#c4a24b] to-transparent" />
            <span className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--bg-raised)] px-2 py-0.5 text-[11px] font-medium text-[var(--text-secondary)]">
              {posts.length} not
            </span>
          </div>
        </div>
      </div>

      {/* ── Arama + Sıralama satırı ── */}
      <div className="mb-6 flex items-center gap-2">
        <div className="relative max-w-xs flex-1">
          <MagnifyingGlass size={11} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`${categoryName} içinde ara...`}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] py-2 pl-8 pr-7 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-all focus:border-[#c4a24b]/40 focus:ring-1 focus:ring-[#c4a24b]/10"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] transition-colors hover:text-[var(--text-secondary)]"
            >
              <X size={10} />
            </button>
          )}
        </div>
        <SortFilterBar
          value={sortFilter}
          onChange={setSortFilter}
          totalCount={posts.length}
          filteredCount={filtered.length}
        />
      </div>

      {/* ── İçerik ── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-card)]">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-[var(--text-muted)]"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" strokeLinecap="round" />
            </svg>
          </div>
          <p className="mb-1 text-sm font-medium text-[var(--text-secondary)]">
            {searchQuery || sortFilter.minRating > 0
              ? "Sonuç bulunamadı"
              : "Bu kategoride henüz not yok"}
          </p>
          {!searchQuery && sortFilter.minRating === 0 && (
            <Link
              href="/new-post"
              className="mt-3 text-xs text-[#c4a24b] transition-colors hover:text-[#d7ba68]"
            >
              + İlk notu ekle
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {filtered.map((post, index) => (
            <Link key={post.id} href={`/posts/${post.id}`} className="group block">
              <article className="flex h-full overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-card)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#c4a24b]/30 hover:shadow-[0_4px_24px_rgba(201,168,76,0.08)]">
                <div
                  className="relative flex-shrink-0"
                  style={{ width: "32%", minHeight: "140px" }}
                >
                  <Image
                    loader={customLoader}
                    src={post.image}
                    alt={post.title}
                    fill
                    sizes="(max-width: 768px) 32vw, 200px"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    priority={index === 0}
                  />
                  <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[var(--bg-card)] to-transparent" />
                </div>

                <div className="flex min-w-0 flex-1 flex-col justify-between p-4">
                  <div>
                    <div className="mb-2 flex flex-wrap items-center gap-1.5">
                      {post.years && (
                        <span className="text-[11px] text-[var(--text-muted)]">{post.years}</span>
                      )}
                      {post.status && <StatusBadge status={post.status} />}
                    </div>
                    <h2 className="mb-1.5 line-clamp-2 text-sm font-bold leading-snug text-[var(--text-primary)] transition-colors group-hover:text-[#c4a24b] sm:text-[15px]">
                      {post.title}
                    </h2>
                    {post.creator && <p className="mb-2 text-xs text-[var(--text-secondary)]">{post.creator}</p>}
                    <p className="line-clamp-3 text-xs leading-relaxed text-[var(--text-muted)]">
                      {post.excerpt}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-[var(--border)] pt-3">
                    <StarRating rating={post.rating} size={12} />
                    <span className="text-[10px] text-[var(--text-muted)]">{post.date}</span>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}

    </div>
  );
}
