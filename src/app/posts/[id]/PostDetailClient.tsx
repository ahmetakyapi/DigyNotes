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
import TagBadge from "@/components/TagBadge";
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
        <div className="mx-auto max-w-6xl px-4 pt-4 sm:px-8 lg:px-16">
          {/* Breadcrumb skeleton */}
          <div className="mb-3 flex items-center gap-2">
            <div className="h-3 w-12 animate-pulse rounded bg-[#1a1e2e]" />
            <div className="h-3 w-2 animate-pulse rounded bg-[#1a1e2e]" />
            <div className="h-3 w-16 animate-pulse rounded bg-[#1a1e2e]" />
            <div className="h-3 w-2 animate-pulse rounded bg-[#1a1e2e]" />
            <div className="h-3 w-32 animate-pulse rounded bg-[#1a1e2e]" />
          </div>
          {/* Hero skeleton */}
          <div
            className="w-full animate-pulse rounded-2xl bg-[#1a1e2e]"
            style={{ height: "52vh" }}
          />
        </div>
        <div className="mx-auto max-w-3xl space-y-4 px-4 py-10 sm:px-6">
          <div className="h-8 w-3/4 animate-pulse rounded-lg bg-[#1a1e2e]" />
          <div className="h-4 w-full animate-pulse rounded bg-[#1a1e2e]" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-[#1a1e2e]" />
          <div className="h-4 w-4/5 animate-pulse rounded bg-[#1a1e2e]" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-[#e53e3e]/20 bg-[#e53e3e]/10">
            <svg
              className="h-7 w-7 text-[#e53e3e]/60"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="mb-1 font-medium text-[#e53e3e]">İçerik bulunamadı</p>
          <Link
            href="/notes"
            className="text-xs text-[#4a5568] transition-colors hover:text-[#c9a84c]"
          >
            ← Notlara dön
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0c0e16]">
      {/* ─── Hero Image ─── */}
      <div className="mx-auto max-w-6xl px-4 pt-4 sm:px-8 lg:px-16">
        {/* Breadcrumb */}
        <nav className="mb-3 flex items-center gap-1.5 text-xs text-[#4a5568]">
          <Link href="/notes" className="transition-colors hover:text-[#c9a84c]">
            Notlar
          </Link>
          <span className="text-[#2a2a3a]">›</span>
          <Link
            href={`/category/${encodeURIComponent(post.category)}`}
            className="transition-colors hover:text-[#c9a84c]"
          >
            {post.category}
          </Link>
          <span className="text-[#2a2a3a]">›</span>
          <span className="max-w-[180px] truncate text-[#6272a4] sm:max-w-xs">
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
          <div className="absolute left-0 right-0 top-0 flex items-center justify-end gap-2 px-4 pt-4 sm:px-5">
            <Link
              href={`/posts/${post.id}/edit`}
              className="flex items-center gap-1.5 rounded-lg border border-white/25 bg-black/65 px-4 py-2 text-xs font-semibold text-white shadow-sm backdrop-blur-md transition-all hover:border-[#c9a84c]/80 hover:bg-black/80 hover:text-[#c9a84c]"
            >
              <FaEdit size={11} /> Düzenle
            </Link>
            <button
              onClick={() => setIsModalOpen(true)}
              disabled={isDeleting}
              className="flex items-center gap-1.5 rounded-lg border border-white/25 bg-black/65 px-3 py-2 text-xs text-white shadow-sm backdrop-blur-md transition-all hover:border-[#e53e3e]/80 hover:bg-black/80 hover:text-[#e53e3e] disabled:opacity-40"
            >
              <FaTrash size={10} /> Sil
            </button>
          </div>

          {/* ── Overlaid title + meta ── */}
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-6 sm:px-6 sm:pb-8">
            <div className="max-w-3xl">
              <div className="mb-3 flex items-center gap-2">
                <span className="inline-block rounded-sm border border-[#c9a84c]/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#c9a84c]">
                  {post.category}
                </span>
                {post.status && <StatusBadge status={post.status} />}
              </div>
              <h1 className="mb-3 text-2xl font-bold leading-tight text-[#e8eaf6] sm:text-3xl lg:text-4xl">
                {post.title}
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-sm text-[#8892b0] sm:gap-3">
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
                    <span className="text-xs text-[#4a5568]">({post.rating}/5)</span>
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
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        {/* Etiketler */}
        {post.tags && post.tags.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-1.5">
            {post.tags.map((tag) => (
              <TagBadge key={tag.id} tag={tag} />
            ))}
          </div>
        )}

        <article className="prose prose-lg max-w-none prose-headings:font-bold prose-headings:text-[#e8eaf6] prose-p:leading-[1.85] prose-p:text-[#c5cae9] prose-a:text-[#c9a84c] prose-a:no-underline hover:prose-a:underline prose-blockquote:border-l-[#c9a84c] prose-blockquote:text-[#8892b0] prose-strong:text-[#e8eaf6] prose-code:rounded prose-code:bg-[#151b2d] prose-code:px-1 prose-code:text-[#c9a84c] prose-pre:border prose-pre:border-[#252d40] prose-pre:bg-[#151b2d] prose-ol:text-[#c5cae9] prose-ul:text-[#c5cae9] prose-li:marker:text-[#c9a84c]">
          <div dangerouslySetInnerHTML={{ __html: post.content }} />
        </article>

        {/* Alt Navigasyon */}
        <div className="mt-12 border-t border-[#1a1e2e] pt-6">
          <Link
            href={`/category/${encodeURIComponent(post.category)}`}
            className="flex items-center gap-1.5 text-sm text-[#4a5568] transition-colors hover:text-[#c9a84c]"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
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
