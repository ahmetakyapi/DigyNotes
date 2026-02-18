"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Post, Category } from "@/types";
import StarRating from "@/components/StarRating";
import { ConfirmModal } from "@/components/ConfirmModal";
import toast from "react-hot-toast";

const customLoader = ({ src }: { src: string }) => src;

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const categoryName = decodeURIComponent(params.id as string);

  const [posts, setPosts] = useState<Post[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

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

  const handleConfirmDelete = async () => {
    if (!category) return;
    const res = await fetch(`/api/categories/${category.id}`, { method: "DELETE" });
    setIsDeleteModalOpen(false);
    if (res.ok) {
      toast.success("Kategori silindi");
      router.push("/");
    } else {
      toast.error("Silme başarısız");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-[#4a5568] animate-pulse">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Category header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <Link
            href="/"
            className="text-xs text-[#4a5568] hover:text-[#c9a84c] transition-colors mb-2 block"
          >
            ← Tüm Notlar
          </Link>
          <h1 className="text-2xl font-bold text-[#e8eaf6]">{categoryName}</h1>
          <p className="text-sm text-[#4a5568] mt-1">{posts.length} not</p>
        </div>
        {category && (
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="px-3 py-1.5 text-sm border border-[#e53e3e]/40 text-[#e53e3e]
                       rounded-md hover:bg-[#e53e3e]/10 transition-colors mt-6"
          >
            Kategoriyi Sil
          </button>
        )}
      </div>

      {/* Posts list */}
      {posts.length === 0 ? (
        <div className="text-center text-[#4a5568] py-16">
          Bu kategoride henüz not yok.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {posts.map((post, index) => (
            <Link key={post.id} href={`/posts/${post.id}`} className="group block">
              <article
                className="flex rounded-xl overflow-hidden bg-[#151b2d] border border-[#252d40]
                           hover:border-[#c9a84c]/40 transition-all duration-300
                           hover:shadow-[0_4px_32px_rgba(201,168,76,0.08)]"
              >
                <div
                  className="relative flex-shrink-0"
                  style={{ width: "38%", minHeight: "200px" }}
                >
                  <Image
                    loader={customLoader}
                    src={post.image}
                    alt={post.title}
                    fill
                    sizes="(max-width: 768px) 40vw, 300px"
                    className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
                    priority={index === 0}
                  />
                  <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-[#151b2d] to-transparent" />
                </div>

                <div className="flex flex-col justify-between p-5 flex-1 min-w-0">
                  <div>
                    {post.years && (
                      <p className="text-xs text-[#4a5568] mb-2">{post.years}</p>
                    )}
                    <h2
                      className="text-lg font-bold text-[#e8eaf6] leading-snug mb-2
                                 group-hover:text-[#c9a84c] transition-colors line-clamp-2"
                    >
                      {post.title}
                    </h2>
                    {post.creator && (
                      <p className="text-sm text-[#8892b0] mb-2">{post.creator}</p>
                    )}
                    <p className="text-sm text-[#8892b0] line-clamp-3 leading-relaxed">
                      {post.excerpt}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#252d40]">
                    <StarRating rating={post.rating} size={13} />
                    <span className="text-xs text-[#4a5568]">{post.date}</span>
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
