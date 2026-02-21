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
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-[#444] animate-pulse text-sm">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/notes" className="text-[11px] text-[#444] hover:text-[#c9a84c] transition-colors mb-2 block">
            ← Tüm Notlar
          </Link>
          <h1 className="text-xl font-bold text-[#f0ede8]">{categoryName}</h1>
          <div className="flex items-center gap-3 mt-1">
            <div className="h-0.5 w-8 bg-gradient-to-r from-[#c9a84c] to-transparent rounded-full" />
            <span className="text-xs text-[#555555]">{posts.length} not</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {category && (
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="px-3 py-1.5 text-xs border border-[#e53e3e]/30 text-[#e53e3e]
                         rounded-md hover:bg-[#e53e3e]/10 transition-colors"
            >
              Kategoriyi Sil
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
            placeholder="Ara..."
            className="w-full pl-8 pr-7 py-1.5 bg-[#111111] border border-[#1e1e1e] rounded-lg text-xs
                       text-[#f0ede8] placeholder-[#444] outline-none focus:border-[#c9a84c]/30 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#444] hover:text-[#888]"
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
          <div className="w-12 h-12 rounded-full bg-[#111111] border border-[#1e1e1e] flex items-center justify-center mb-4">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" strokeLinecap="round" />
            </svg>
          </div>
          <p className="text-[#555555] text-sm">
            {searchQuery || sortFilter.minRating > 0 ? "Sonuç bulunamadı." : "Bu kategoride henüz not yok."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {filtered.map((post, index) => (
            <Link key={post.id} href={`/posts/${post.id}`} className="group block">
              <article
                className="flex h-full rounded-xl overflow-hidden bg-[#111111] border border-[#1e1e1e]
                           hover:border-[#c9a84c]/30 transition-all duration-300
                           hover:shadow-[0_4px_24px_rgba(201,168,76,0.08)]"
              >
                <div className="relative flex-shrink-0" style={{ width: "32%", minHeight: "220px" }}>
                  <Image
                    loader={customLoader}
                    src={post.image}
                    alt={post.title}
                    fill
                    sizes="(max-width: 768px) 32vw, 200px"
                    className="object-cover group-hover:scale-[1.04] transition-transform duration-500"
                    priority={index === 0}
                  />
                  <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#111111] to-transparent" />
                </div>

                <div className="flex flex-col justify-between p-5 flex-1 min-w-0">
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5 mb-2">
                      {post.years && (
                        <span className="text-[11px] text-[#444]">{post.years}</span>
                      )}
                      {post.status && <StatusBadge status={post.status} />}
                    </div>
                    <h2 className="text-sm sm:text-base font-bold text-[#e8eaf6] leading-snug mb-1.5 group-hover:text-[#c9a84c] transition-colors line-clamp-2">
                      {post.title}
                    </h2>
                    {post.creator && (
                      <p className="text-xs text-[#555555] mb-2">{post.creator}</p>
                    )}
                    <p className="text-xs text-[#888] line-clamp-4 leading-relaxed">
                      {post.excerpt}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#1e1e1e]">
                    <StarRating rating={post.rating} size={12} />
                    <span className="text-[10px] text-[#444]">{post.date}</span>
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
