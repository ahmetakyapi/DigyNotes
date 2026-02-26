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
import CommunityStatsCard from "@/components/CommunityStatsCard";
import toast from "react-hot-toast";

const customLoader = ({ src }: { src: string }) => src;

export default function PostDetailClient({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [communityPosts, setCommunityPosts] = useState<Post[]>([]);
  const [imgOrientation, setImgOrientation] = useState<"portrait" | "landscape" | null>(null);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.naturalWidth > 0 && img.naturalHeight > 0) {
      setImgOrientation(img.naturalHeight > img.naturalWidth ? "portrait" : "landscape");
    }
  };

  useEffect(() => {
    fetch(`/api/posts/${params.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setPost(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.id]);

  useEffect(() => {
    if (!post?.title) return;
    fetch(
      `/api/posts/related?title=${encodeURIComponent(post.title)}&excludePostId=${post.id}`
    )
      .then((r) => (r.ok ? r.json() : []))
      .then(setCommunityPosts)
      .catch(() => {});
  }, [post?.title, post?.id]);

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
      <div className="min-h-screen bg-[var(--bg-base)]">
        <div className="mx-auto max-w-6xl px-4 pt-4 sm:px-8 lg:px-16">
          {/* Breadcrumb skeleton */}
          <div className="mb-3 flex items-center gap-2">
            <div className="h-3 w-12 animate-pulse rounded bg-[var(--bg-raised)]" />
            <div className="h-3 w-2 animate-pulse rounded bg-[var(--bg-raised)]" />
            <div className="h-3 w-16 animate-pulse rounded bg-[var(--bg-raised)]" />
            <div className="h-3 w-2 animate-pulse rounded bg-[var(--bg-raised)]" />
            <div className="h-3 w-32 animate-pulse rounded bg-[var(--bg-raised)]" />
          </div>
          {/* Hero skeleton */}
          <div
            className="w-full animate-pulse rounded-2xl bg-[var(--bg-raised)]"
            style={{ height: "52vh" }}
          />
        </div>
        <div className="mx-auto max-w-3xl space-y-4 px-4 py-10 sm:px-6">
          <div className="h-8 w-3/4 animate-pulse rounded-lg bg-[var(--bg-raised)]" />
          <div className="h-4 w-full animate-pulse rounded bg-[var(--bg-raised)]" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-[var(--bg-raised)]" />
          <div className="h-4 w-4/5 animate-pulse rounded bg-[var(--bg-raised)]" />
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
            className="text-xs text-[var(--text-muted)] transition-colors hover:text-[#c9a84c]"
          >
            ← Notlara dön
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--bg-base)]">
      {/* ─── Hero Image ─── */}
      <div className="mx-auto max-w-6xl px-4 pt-4 sm:px-8 lg:px-16">
        {/* Breadcrumb */}
        <nav className="mb-3 flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
          <Link href="/notes" className="transition-colors hover:text-[#c9a84c]">
            Notlar
          </Link>
          <span className="text-[var(--border)]">›</span>
          <Link
            href={`/category/${encodeURIComponent(post.category)}`}
            className="transition-colors hover:text-[#c9a84c]"
          >
            {post.category}
          </Link>
          <span className="text-[var(--border)]">›</span>
          <span className="max-w-[180px] truncate text-[var(--text-secondary)] sm:max-w-xs">
            {post.title.length > 35 ? post.title.slice(0, 35) + "…" : post.title}
          </span>
        </nav>

        <div
          className="relative w-full overflow-hidden rounded-2xl bg-[var(--bg-raised)]"
          style={{ height: imgOrientation === "landscape" ? "44vh" : "52vh" }}
        >
          {/* Blur backdrop — sadece dikey görsellerde yan boşlukları doldurur */}
          {imgOrientation !== "landscape" && (
            <Image
              loader={customLoader}
              src={post.image}
              alt=""
              fill
              aria-hidden
              className="scale-110 object-cover opacity-30 blur-2xl"
              priority
            />
          )}
          {/* Ana görsel */}
          <Image
            loader={customLoader}
            src={post.image}
            alt={post.title}
            fill
            className={imgOrientation === "portrait" ? "object-contain" : "object-cover"}
            onLoad={handleImageLoad}
            priority
          />
          {/* Gradient: top → bottom dark */}
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-base)] via-[var(--bg-base)]/30 to-transparent" />

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
              <h1 className="mb-3 text-2xl font-bold leading-tight text-[var(--text-primary)] sm:text-3xl lg:text-4xl">
                {post.title}
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--text-secondary)] sm:gap-3">
                {post.creator && <span>{post.creator}</span>}
                {post.years && (
                  <>
                    <span className="text-[var(--border)]">•</span>
                    <span>{post.years}</span>
                  </>
                )}
                {post.rating > 0 && (
                  <>
                    <span className="text-[var(--border)]">•</span>
                    <StarRating rating={post.rating} size={13} />
                    <span className="text-xs text-[var(--text-muted)]">({post.rating}/5)</span>
                  </>
                )}
                {post.externalRating && post.externalRating > 0 && (
                  <>
                    <span className="text-[var(--border)]">•</span>
                    <span className="flex items-center gap-1 text-xs font-medium text-[#c9a84c]">
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.86 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z" />
                      </svg>
                      TMDB {post.externalRating.toFixed(1)}
                      <span className="font-normal text-[var(--text-muted)]">/10</span>
                    </span>
                  </>
                )}
                {post.date && (
                  <>
                    <span className="text-[var(--border)]">•</span>
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
          <div className="mb-6 flex flex-wrap gap-1.5">
            {post.tags.map((tag) => (
              <TagBadge key={tag.id} tag={tag} />
            ))}
          </div>
        )}

        <CommunityStatsCard title={post.title} creator={post.creator} />

        <article className="prose prose-lg max-w-none prose-headings:font-bold prose-headings:text-[var(--text-primary)] prose-p:leading-[1.85] prose-p:text-[var(--text-secondary)] prose-a:text-[#c9a84c] prose-a:no-underline hover:prose-a:underline prose-blockquote:border-l-[#c9a84c] prose-blockquote:text-[var(--text-secondary)] prose-strong:text-[var(--text-primary)] prose-code:rounded prose-code:bg-[var(--bg-raised)] prose-code:px-1 prose-code:text-[#c9a84c] prose-pre:border prose-pre:border-[var(--border)] prose-pre:bg-[var(--bg-raised)] prose-ol:text-[var(--text-secondary)] prose-ul:text-[var(--text-secondary)] prose-li:marker:text-[#c9a84c]">
          <div dangerouslySetInnerHTML={{ __html: post.content }} />
        </article>

        {/* ─── Başkalarının Notları ─── */}
        {communityPosts.length > 0 && (
          <div className="mt-12 border-t border-[var(--border)] pt-8">
            <div className="mb-4 flex items-center gap-2">
              <svg
                className="h-4 w-4 text-[var(--text-muted)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
                />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <h2 className="text-sm font-semibold text-[var(--text-secondary)]">
                Bu içerik hakkında diğer notlar
              </h2>
              <span className="rounded-full bg-[var(--bg-raised)] px-2 py-0.5 text-[10px] text-[var(--text-muted)]">
                {communityPosts.length}
              </span>
            </div>
            <div className="space-y-3">
              {communityPosts.map((cp) => (
                <Link
                  key={cp.id}
                  href={`/posts/${cp.id}`}
                  className="group block rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 transition-colors hover:border-[#c9a84c]/30 hover:bg-[var(--bg-raised)]"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#c9a84c]/10 text-[10px] font-bold text-[#c9a84c]">
                      {cp.user?.name?.charAt(0)?.toUpperCase() ?? "?"}
                    </div>
                    <span className="text-xs font-medium text-[var(--text-secondary)]">
                      {cp.user?.name ?? "Kullanıcı"}
                    </span>
                    {cp.rating > 0 && (
                      <span className="ml-auto flex items-center gap-1 text-xs text-[#c9a84c]">
                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        {cp.rating}/5
                      </span>
                    )}
                  </div>
                  <p className="line-clamp-3 text-sm leading-relaxed text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">
                    {cp.excerpt}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Alt Navigasyon */}
        <div className="mt-12 border-t border-[var(--border)] pt-6">
          <Link
            href={`/category/${encodeURIComponent(post.category)}`}
            className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] transition-colors hover:text-[#c9a84c]"
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
