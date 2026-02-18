"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FaEdit, FaTrash } from "react-icons/fa";
import { Post } from "@/types";
import StarRating from "@/components/StarRating";
import { StatusBadge } from "@/components/StatusBadge";
import { ConfirmModal } from "@/components/ConfirmModal";
import toast from "react-hot-toast";

const customLoader = ({ src }: { src: string }) => src;

export default function PostPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetch(`/api/posts/${params.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setPost(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.id]);

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    const res = await fetch(`/api/posts/${params.id}`, { method: "DELETE" });
    setIsDeleting(false);
    setIsModalOpen(false);
    if (res.ok) {
      toast.success("Not silindi");
      router.push("/");
    } else {
      toast.error("Silme başarısız");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-[#4a5568] animate-pulse text-lg">Yükleniyor...</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-[#e53e3e] text-lg">İçerik bulunamadı</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0f1117]">
      {/* ─── Hero Image ─── */}
      <div className="px-4 sm:px-8 lg:px-16 pt-4 max-w-6xl mx-auto">
        <div className="relative w-full overflow-hidden rounded-2xl" style={{ height: "52vh" }}>
          <Image
            loader={customLoader}
            src={post.image}
            alt={post.title}
            fill
            className="object-cover object-center"
            priority
          />
          {/* Gradient: top (transparent) → bottom (full dark) */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f1117] via-[#0f1117]/40 to-transparent" />

          {/* ── Top controls ── */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 sm:px-5 pt-4">
            <Link
              href={`/category/${encodeURIComponent(post.category)}`}
              className="text-sm text-[#e8eaf6]/60 hover:text-[#c9a84c] transition-colors"
            >
              ← {post.category}
            </Link>
            <div className="flex gap-2">
              <Link
                href={`/posts/${post.id}/edit`}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[#252d40]
                           bg-[#151b2d]/80 text-[#e8eaf6] rounded-md hover:border-[#c9a84c]/50
                           backdrop-blur-sm transition-colors"
              >
                <FaEdit size={11} /> Düzenle
              </Link>
              <button
                onClick={() => setIsModalOpen(true)}
                disabled={isDeleting}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[#e53e3e]/40
                           bg-[#151b2d]/80 text-[#e53e3e] rounded-md hover:bg-[#e53e3e]/10
                           backdrop-blur-sm transition-colors disabled:opacity-50"
              >
                <FaTrash size={11} /> Sil
              </button>
            </div>
          </div>

          {/* ── Overlaid title + meta ── */}
          <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-6 pb-6 sm:pb-8">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="inline-block text-[10px] font-bold uppercase tracking-[0.12em] text-[#c9a84c]
                             border border-[#c9a84c]/30 px-2 py-0.5 rounded-sm"
                >
                  {post.category}
                </span>
                {post.status && <StatusBadge status={post.status} />}
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#e8eaf6] leading-tight mb-3">
                {post.title}
              </h1>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-sm text-[#8892b0]">
                {post.creator && <span>{post.creator}</span>}
                {post.years && (
                  <>
                    <span className="text-[#252d40]">•</span>
                    <span>{post.years}</span>
                  </>
                )}
                {post.rating > 0 && (
                  <>
                    <span className="text-[#252d40]">•</span>
                    <StarRating rating={post.rating} size={13} />
                    <span className="text-[#4a5568] text-xs">({post.rating}/5)</span>
                  </>
                )}
                {post.date && (
                  <>
                    <span className="text-[#252d40]">•</span>
                    <span className="text-xs">{post.date}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Content ─── */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <article
          className="prose prose-lg max-w-none
                     prose-headings:text-[#e8eaf6] prose-headings:font-bold
                     prose-p:text-[#c5cae9] prose-p:leading-[1.85]
                     prose-a:text-[#c9a84c] prose-a:no-underline hover:prose-a:underline
                     prose-strong:text-[#e8eaf6]
                     prose-blockquote:border-l-[#c9a84c] prose-blockquote:text-[#8892b0]
                     prose-code:text-[#c9a84c] prose-code:bg-[#151b2d] prose-code:px-1 prose-code:rounded
                     prose-pre:bg-[#151b2d] prose-pre:border prose-pre:border-[#252d40]
                     prose-ul:text-[#c5cae9] prose-ol:text-[#c5cae9]
                     prose-li:marker:text-[#c9a84c]"
        >
          <div dangerouslySetInnerHTML={{ __html: post.content }} />
        </article>
      </div>

      <ConfirmModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Yazıyı Sil"
        message="Bu yazıyı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
      />
    </main>
  );
}
