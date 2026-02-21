"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Post, Category } from "@/types";
import StarRating from "@/components/StarRating";
import { StatusBadge } from "@/components/StatusBadge";
import { SortFilterBar, SortFilterState, applySortFilter } from "@/components/SortFilterBar";
import { ConfirmModal } from "@/components/ConfirmModal";
import toast from "react-hot-toast";
import { FaSearch, FaTimes } from "react-icons/fa";

const customLoader = ({ src }: { src: string }) => src;

export default function CategoryPageClient({ params }: { params: { id: string } }) {
  const router = useRouter();
  const categoryName = decodeURIComponent(params.id);

  const [posts, setPosts] = useState<Post[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortFilter, setSortFilter] = useState<SortFilterState>({ sort: "newest", minRating: 0 });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [postsRes, catsRes] = await Promise.all([
          fetch(`/api/posts?category=${encodeURIComponent(categoryName)}`),
          fetch("/api/categories"),
        ]);
        const [postsData, catsData]: [Post[], Category[]] = await Promise.all([
          postsRes.json(),
          catsRes.json(),
        ]);
        setPosts(postsData);
        setCategory(catsData.find((c) => c.name === categoryName) ?? null);
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
            p.title.toLowerCase().includes(q) ||
            (p.creator?.toLowerCase().includes(q) ?? false)
        )
      : posts;
    return applySortFilter(searched, sortFilter);
  }, [posts, searchQuery, sortFilter]);

  const handleConfirmDelete = async () => {
    if (!category) return;
    const res = await fetch(`/api/categories/${category.id}`, { method: "DELETE" });
    setIsDeleteModalOpen(false);
    if (res.ok) {
      toast.success("Kategori silindi");
      router.push("/notes");
    } else {
      toast.error("Silme başarısız");
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb skeleton */}
        <div className="flex items-center gap-2 mb-6">
          <div className="h-3 w-12 rounded bg-[#1a1e2e] animate-pulse" />
          <div className="h-3 w-2 rounded bg-[#1a1e2e] animate-pulse" />
          <div className="h-3 w-20 rounded bg-[#1a1e2e] animate-pulse" />
        </div>
        <div className="h-7 w-40 rounded-lg bg-[#1a1e2e] animate-pulse mb-2" />
        <div className="h-3 w-16 rounded bg-[#1a1e2e] animate-pulse mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-[140px] rounded-xl bg-[#0d0f1a] border border-[#1a1e2e] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

      {/* ── Header ── */}
      <div className="mb-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 mb-3 text-xs text-[#4a5568]">
          <Link href="/notes" className="hover:text-[#c9a84c] transition-colors">
            Notlar
          </Link>
          <span className="text-[#2a2a3a]">›</span>
          <span className="text-[#6272a4] font-medium">{categoryName}</span>
        </nav>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#f0ede8] mb-2">{categoryName}</h1>
            <div className="flex items-center gap-3">
              <div className="h-0.5 w-8 bg-gradient-to-r from-[#c9a84c] to-transparent rounded-full" />
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#1a1e2e] border border-[#252d40] text-[#6272a4]">
                {posts.length} not
              </span>
            </div>
          </div>

          {category && (
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[#e53e3e]/20 text-[#e53e3e]/60
                         rounded-md hover:border-[#e53e3e]/40 hover:text-[#e53e3e] hover:bg-[#e53e3e]/8
                         transition-all flex-shrink-0"
              title="Kategoriyi sil"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span className="hidden sm:inline">Kategoriyi Sil</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Arama + Sıralama satırı ── */}
      <div className="flex items-center gap-2 mb-6">
        <div className="relative flex-1 max-w-xs">
          <FaSearch size={11} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#444]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`${categoryName} içinde ara...`}
            className="w-full pl-8 pr-7 py-2 bg-[#0d0f1a] border border-[#1a1e2e] rounded-lg text-xs
                       text-[#f0ede8] placeholder-[#3a3a5a] outline-none
                       focus:border-[#c9a84c]/40 focus:ring-1 focus:ring-[#c9a84c]/10 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#444] hover:text-[#888] transition-colors"
            >
              <FaTimes size={10} />
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
          <div className="w-14 h-14 rounded-full bg-[#0d0f1a] border border-[#1a1e2e] flex items-center justify-center mb-4">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3a3a5a" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" strokeLinecap="round" />
            </svg>
          </div>
          <p className="text-[#4a5568] text-sm font-medium mb-1">
            {searchQuery || sortFilter.minRating > 0 ? "Sonuç bulunamadı" : "Bu kategoride henüz not yok"}
          </p>
          {!searchQuery && sortFilter.minRating === 0 && (
            <Link
              href="/new-post"
              className="mt-3 text-xs text-[#c9a84c] hover:text-[#e0c068] transition-colors"
            >
              + İlk notu ekle
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {filtered.map((post, index) => (
            <Link key={post.id} href={`/posts/${post.id}`} className="group block">
              <article
                className="flex h-full rounded-xl overflow-hidden bg-[#0d0f1a] border border-[#1a1e2e]
                           hover:border-[#c9a84c]/30 transition-all duration-300
                           hover:shadow-[0_4px_24px_rgba(201,168,76,0.08)] hover:-translate-y-0.5"
              >
                <div className="relative flex-shrink-0" style={{ width: "32%", minHeight: "140px" }}>
                  <Image
                    loader={customLoader}
                    src={post.image}
                    alt={post.title}
                    fill
                    sizes="(max-width: 768px) 32vw, 200px"
                    className="object-cover group-hover:scale-[1.04] transition-transform duration-500"
                    priority={index === 0}
                  />
                  <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#0d0f1a] to-transparent" />
                </div>

                <div className="flex flex-col justify-between p-4 flex-1 min-w-0">
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5 mb-2">
                      {post.years && (
                        <span className="text-[11px] text-[#3a3a5a]">{post.years}</span>
                      )}
                      {post.status && <StatusBadge status={post.status} />}
                    </div>
                    <h2 className="text-sm sm:text-[15px] font-bold text-[#e8eaf6] leading-snug mb-1.5 group-hover:text-[#c9a84c] transition-colors line-clamp-2">
                      {post.title}
                    </h2>
                    {post.creator && (
                      <p className="text-xs text-[#4a5568] mb-2">{post.creator}</p>
                    )}
                    <p className="text-xs text-[#6272a4] line-clamp-3 leading-relaxed">
                      {post.excerpt}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#1a1e2e]">
                    <StarRating rating={post.rating} size={12} />
                    <span className="text-[10px] text-[#3a3a5a]">{post.date}</span>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Kategoriyi Sil"
        message={`"${categoryName}" kategorisini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
      />
    </div>
  );
}
