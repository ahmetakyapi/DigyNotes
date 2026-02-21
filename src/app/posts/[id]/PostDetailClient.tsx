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

export default function PostDetailClient({ params }: { params: { id: string } }) {
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
      router.push("/notes");
    } else {
      toast.error("Silme başarısız");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0c0e16]">
        <div className="px-4 sm:px-8 lg:px-16 pt-4 max-w-6xl mx-auto">
          {/* Breadcrumb skeleton */}
          <div className="flex items-center gap-2 mb-3">
            <div className="h-3 w-12 rounded bg-[#1a1e2e] animate-pulse" />
            <div className="h-3 w-2 rounded bg-[#1a1e2e] animate-pulse" />
            <div className="h-3 w-16 rounded bg-[#1a1e2e] animate-pulse" />
            <div className="h-3 w-2 rounded bg-[#1a1e2e] animate-pulse" />
            <div className="h-3 w-32 rounded bg-[#1a1e2e] animate-pulse" />
          </div>
          {/* Hero skeleton */}
          <div className="w-full rounded-2xl bg-[#1a1e2e] animate-pulse" style={{ height: "52vh" }} />
        </div>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-4">
          <div className="h-8 w-3/4 rounded-lg bg-[#1a1e2e] animate-pulse" />
          <div className="h-4 w-full rounded bg-[#1a1e2e] animate-pulse" />
          <div className="h-4 w-5/6 rounded bg-[#1a1e2e] animate-pulse" />
          <div className="h-4 w-4/5 rounded bg-[#1a1e2e] animate-pulse" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-[#e53e3e]/10 border border-[#e53e3e]/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-[#e53e3e]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-[#e53e3e] font-medium mb-1">İçerik bulunamadı</p>
          <Link href="/notes" className="text-xs text-[#4a5568] hover:text-[#c9a84c] transition-colors">
            ← Notlara dön
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0c0e16]">
      {/* ─── Hero Image ─── */}
      <div className="px-4 sm:px-8 lg:px-16 pt-4 max-w-6xl mx-auto">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 mb-3 text-xs text-[#4a5568]">
          <Link href="/notes" className="hover:text-[#c9a84c] transition-colors">
            Notlar
          </Link>
          <span className="text-[#2a2a3a]">›</span>
          <Link
            href={`/category/${encodeURIComponent(post.category)}`}
            className="hover:text-[#c9a84c] transition-colors"
          >
            {post.category}
          </Link>
          <span className="text-[#2a2a3a]">›</span>
          <span className="text-[#6272a4] truncate max-w-[180px] sm:max-w-xs">
            {post.title.length > 35 ? post.title.slice(0, 35) + "…" : post.title}
          </span>
        </nav>

        <div className="relative w-full overflow-hidden rounded-2xl" style={{ height: "52vh" }}>
          <Image
            loader={customLoader}
            src={post.image}
            alt={post.title}
            fill
            className="object-cover"
            style={{ objectPosition: post.imagePosition ?? "center" }}
            priority
          />
          {/* Gradient: top (transparent) → bottom (full dark) */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c0e16] via-[#0c0e16]/40 to-transparent" />

          {/* ── Top controls ── */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-end px-4 sm:px-5 pt-4 gap-2">
            <Link
              href={`/posts/${post.id}/edit`}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg
                         border border-white/25 bg-black/65 text-white
                         hover:border-[#c9a84c]/80 hover:text-[#c9a84c] hover:bg-black/80
                         backdrop-blur-md transition-all shadow-sm"
            >
              <FaEdit size={11} /> Düzenle
            </Link>
            <button
              onClick={() => setIsModalOpen(true)}
              disabled={isDeleting}
              className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg
                         border border-white/25 bg-black/65 text-white
                         hover:border-[#e53e3e]/80 hover:text-[#e53e3e] hover:bg-black/80
                         backdrop-blur-md transition-all shadow-sm disabled:opacity-40"
            >
              <FaTrash size={10} /> Sil
            </button>
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

        {/* Alt Navigasyon */}
        <div className="mt-12 pt-6 border-t border-[#1a1e2e]">
          <Link
            href={`/category/${encodeURIComponent(post.category)}`}
            className="flex items-center gap-1.5 text-sm text-[#4a5568] hover:text-[#c9a84c] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {post.category}
          </Link>
        </div>
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
