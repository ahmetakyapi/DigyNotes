"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { FaEdit, FaTrash } from "react-icons/fa";
import { Heart } from "@phosphor-icons/react";
import { Post } from "@/types";
import StarRating from "@/components/StarRating";
import { StatusBadge } from "@/components/StatusBadge";
import { ConfirmModal } from "@/components/ConfirmModal";
import TagBadge from "@/components/TagBadge";
import CommunityStatsCard from "@/components/CommunityStatsCard";
import { BookmarkButton } from "@/components/BookmarkButton";
import { ActionTooltip } from "@/components/ActionTooltip";
import { getCategoryLabel, normalizeCategory } from "@/lib/categories";
import { formatDisplaySentence, formatDisplayTitle } from "@/lib/display-text";
import { buildOpenStreetMapEmbedUrl, buildOpenStreetMapLink, formatCoordinate } from "@/lib/maps";
import { getPostImageSrc } from "@/lib/post-image";
import { categorySupportsSpoiler } from "@/lib/post-config";
import toast from "react-hot-toast";

const customLoader = ({ src }: { src: string }) => src;
const SPOILER_OVERLAY_STORAGE_KEY = "dn_spoiler_overlay_seen";

interface CommentUser {
  id: string;
  name: string;
  username: string | null;
  avatarUrl: string | null;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  parentId: string | null;
  user: CommentUser;
}

interface ThreadComment extends Comment {
  replies: ThreadComment[];
}

interface LikeData {
  count: number;
  liked: boolean;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function buildCommentTree(items: Comment[]): ThreadComment[] {
  const map = new Map<string, ThreadComment>();
  const roots: ThreadComment[] = [];

  items.forEach((item) => {
    map.set(item.id, { ...item, replies: [] });
  });

  map.forEach((item) => {
    if (item.parentId) {
      const parent = map.get(item.parentId);
      if (parent) {
        parent.replies.push(item);
        return;
      }
    }
    roots.push(item);
  });

  return roots;
}

function collectCommentBranchIds(items: Comment[], rootId: string) {
  const ids = new Set<string>([rootId]);
  let changed = true;

  while (changed) {
    changed = false;
    items.forEach((item) => {
      if (item.parentId && ids.has(item.parentId) && !ids.has(item.id)) {
        ids.add(item.id);
        changed = true;
      }
    });
  }

  return ids;
}

export default function PostDetailClient({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: session } = useSession();
  const currentUserId = session?.user ? (session.user as { id: string }).id : null;

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [communityPosts, setCommunityPosts] = useState<Post[]>([]);
  const [imgOrientation, setImgOrientation] = useState<"portrait" | "landscape" | null>(null);
  const [isSpoilerRevealed, setIsSpoilerRevealed] = useState(false);
  const [hasDismissedSpoilerOverlay, setHasDismissedSpoilerOverlay] = useState(false);

  /* Like state */
  const [likeData, setLikeData] = useState<LikeData>({ count: 0, liked: false });
  const [isLiking, setIsLiking] = useState(false);

  /* Comment state */
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [replyText, setReplyText] = useState("");
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const replyInputRef = useRef<HTMLTextAreaElement>(null);

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
    fetch(`/api/posts/related?title=${encodeURIComponent(post.title)}&excludePostId=${post.id}`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setCommunityPosts)
      .catch(() => {});
  }, [post?.title, post?.id]);

  /* Fetch likes */
  useEffect(() => {
    fetch(`/api/posts/${params.id}/likes`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setLikeData(data))
      .catch(() => {});
  }, [params.id]);

  /* Fetch comments */
  useEffect(() => {
    fetch(`/api/posts/${params.id}/comments`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setComments)
      .catch(() => {});
  }, [params.id]);

  useEffect(() => {
    if (replyingToId) {
      window.setTimeout(() => replyInputRef.current?.focus(), 0);
    }
  }, [replyingToId]);

  useEffect(() => {
    setIsSpoilerRevealed(false);
    setHasDismissedSpoilerOverlay(false);

    if (typeof window === "undefined") return;

    try {
      const seenItems = JSON.parse(
        window.sessionStorage.getItem(SPOILER_OVERLAY_STORAGE_KEY) ?? "[]"
      ) as string[];

      if (Array.isArray(seenItems) && seenItems.includes(params.id)) {
        setHasDismissedSpoilerOverlay(true);
      }
    } catch {
      setHasDismissedSpoilerOverlay(false);
    }
  }, [params.id]);

  const markSpoilerOverlayDismissed = () => {
    if (hasDismissedSpoilerOverlay || typeof window === "undefined") return;

    setHasDismissedSpoilerOverlay(true);

    try {
      const seenItems = JSON.parse(
        window.sessionStorage.getItem(SPOILER_OVERLAY_STORAGE_KEY) ?? "[]"
      ) as string[];
      const nextItems = Array.isArray(seenItems) ? seenItems : [];

      if (!nextItems.includes(params.id)) {
        window.sessionStorage.setItem(
          SPOILER_OVERLAY_STORAGE_KEY,
          JSON.stringify([...nextItems, params.id])
        );
      }
    } catch {
      // noop
    }
  };

  const threadedComments = useMemo(() => buildCommentTree(comments), [comments]);

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

  const toggleLike = async () => {
    if (!session?.user) {
      router.push("/login");
      return;
    }
    if (isLiking) return;
    setIsLiking(true);
    // Optimistic update
    setLikeData((prev) => ({
      count: prev.liked ? prev.count - 1 : prev.count + 1,
      liked: !prev.liked,
    }));
    try {
      const res = await fetch(`/api/posts/${params.id}/likes`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setLikeData(data);
      } else {
        // Revert on error
        setLikeData((prev) => ({
          count: prev.liked ? prev.count - 1 : prev.count + 1,
          liked: !prev.liked,
        }));
      }
    } catch {
      setLikeData((prev) => ({
        count: prev.liked ? prev.count - 1 : prev.count + 1,
        liked: !prev.liked,
      }));
    } finally {
      setIsLiking(false);
    }
  };

  const submitComment = async (parentId?: string | null) => {
    if (!session?.user) {
      router.push("/login");
      return;
    }
    if (isOwnPost) {
      toast.error("Kendi notuna yorum veya yanıt ekleyemezsin.");
      return;
    }
    const text = (parentId ? replyText : commentText).trim();
    if (!text) return;

    setIsSubmittingComment(true);
    try {
      const res = await fetch(`/api/posts/${params.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text, parentId: parentId ?? null }),
      });
      if (res.ok) {
        const newComment: Comment = await res.json();
        setComments((prev) => [...prev, newComment]);
        if (parentId) {
          setReplyText("");
          setReplyingToId(null);
          toast.success("Yanıt eklendi");
        } else {
          setCommentText("");
          toast.success("Yorum eklendi");
        }
      } else {
        const err = await res.json();
        toast.error(err.error || "Yorum eklenemedi");
      }
    } catch {
      toast.error("Yorum eklenemedi");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const deleteComment = async (commentId: string) => {
    setDeletingCommentId(commentId);
    try {
      const res = await fetch(`/api/posts/${params.id}/comments/${commentId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setComments((prev) => {
          const branchIds = collectCommentBranchIds(prev, commentId);
          if (replyingToId && branchIds.has(replyingToId)) {
            setReplyingToId(null);
            setReplyText("");
          }
          return prev.filter((comment) => !branchIds.has(comment.id));
        });
        toast.success("Yorum silindi");
      } else {
        toast.error("Yorum silinemedi");
      }
    } catch {
      toast.error("Yorum silinemedi");
    } finally {
      setDeletingCommentId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)]">
        <div className="mx-auto max-w-6xl px-4 pt-4 sm:px-8 lg:px-16">
          <div className="mb-3 flex items-center gap-2">
            <div className="h-3 w-12 animate-pulse rounded bg-[var(--bg-raised)]" />
            <div className="h-3 w-2 animate-pulse rounded bg-[var(--bg-raised)]" />
            <div className="h-3 w-16 animate-pulse rounded bg-[var(--bg-raised)]" />
            <div className="h-3 w-2 animate-pulse rounded bg-[var(--bg-raised)]" />
            <div className="h-3 w-32 animate-pulse rounded bg-[var(--bg-raised)]" />
          </div>
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
            className="text-xs text-[var(--text-muted)] transition-colors hover:text-[var(--gold)]"
          >
            ← Notlara dön
          </Link>
        </div>
      </div>
    );
  }

  const isOwnPost = !!currentUserId && currentUserId === post.user?.id;
  const canCommentOnPost = Boolean(session?.user) && !isOwnPost;
  const supportsSpoiler = categorySupportsSpoiler(post.category);
  const categorySlug = normalizeCategory(post.category);
  const categoryLabel = getCategoryLabel(post.category);
  const displayTitle = formatDisplayTitle(post.title);
  const displayCreator = formatDisplayTitle(post.creator);
  const displayExcerpt = formatDisplaySentence(post.excerpt);
  const shouldBlurSpoiler = Boolean(supportsSpoiler && post.hasSpoiler && !isSpoilerRevealed);
  const shouldShowSpoilerOverlay = shouldBlurSpoiler && !hasDismissedSpoilerOverlay;

  const toggleReply = (commentId: string) => {
    if (!session?.user) {
      router.push("/login");
      return;
    }
    if (isOwnPost) {
      toast.error("Kendi notuna yanıt ekleyemezsin.");
      return;
    }

    setReplyingToId((prev) => {
      const next = prev === commentId ? null : commentId;
      if (!next) setReplyText("");
      return next;
    });
  };

  const renderCommentNode = (comment: ThreadComment, depth = 0): React.ReactNode => {
    const isOwn = comment.user.id === currentUserId;
    const isReplying = replyingToId === comment.id;
    const hasReplies = comment.replies.length > 0;

    return (
      <div
        key={comment.id}
        className={
          depth > 0
            ? "ml-4 border-l border-[var(--surface-strong-border)] pl-4 sm:ml-6 sm:pl-5"
            : ""
        }
      >
        <div className="rounded-2xl border border-[var(--surface-strong-border)] bg-gradient-to-br from-[var(--surface-strong)] to-[var(--surface-strong-hover)] p-3 shadow-[var(--shadow-soft)] sm:p-4">
          <div className="mb-2.5 flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="bg-[#c4a24b]/12 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#c4a24b]/20 text-[11px] font-bold text-[var(--gold)]">
                {comment.user.name?.charAt(0)?.toUpperCase() ?? "?"}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[13px] font-semibold text-[var(--text-contrast)] sm:text-xs">
                    {comment.user.name}
                  </span>
                  {comment.user.username && (
                    <span className="text-[10px] text-[var(--text-faint)]">
                      @{comment.user.username}
                    </span>
                  )}
                  {depth > 0 && (
                    <span className="rounded-full border border-[var(--surface-strong-border)] bg-[var(--surface-strong)] px-2 py-0.5 text-[9px] text-[var(--text-faint)]">
                      Yanıt
                    </span>
                  )}
                </div>
                <span className="mt-1 inline-flex rounded-full border border-[var(--surface-strong-border)] bg-[var(--surface-strong)] px-2 py-0.5 text-[10px] text-[var(--text-faint)]">
                  {formatDate(comment.createdAt)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {canCommentOnPost && (
                <button
                  type="button"
                  onClick={() => toggleReply(comment.id)}
                  className="hover:bg-[#c4a24b]/8 rounded-md border border-transparent px-2 py-1 text-[11px] text-[var(--text-faint)] transition-colors duration-150 hover:border-[#c4a24b]/20 hover:text-[var(--gold)]"
                >
                  {isReplying ? "Vazgeç" : "Yanıtla"}
                </button>
              )}
              {isOwn && (
                <button
                  type="button"
                  onClick={() => deleteComment(comment.id)}
                  disabled={deletingCommentId === comment.id}
                  className="hover:bg-[#e53e3e]/8 rounded-md border border-transparent px-2 py-1 text-[11px] text-[var(--text-faint)] transition-colors duration-150 hover:border-[#e53e3e]/20 hover:text-[#e53e3e] disabled:opacity-40"
                >
                  {deletingCommentId === comment.id ? "Siliniyor..." : "Sil"}
                </button>
              )}
            </div>
          </div>
          <p className="whitespace-pre-wrap text-[13px] leading-6 text-[var(--text-dim)] sm:text-sm sm:leading-relaxed">
            {comment.content}
          </p>

          {isReplying && (
            <div className="bg-[var(--bg-card)]/50 mt-3 rounded-xl border border-[var(--surface-strong-border)] p-3">
              <textarea
                ref={replyInputRef}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Yanıtınızı yazın..."
                rows={3}
                maxLength={1000}
                className="bg-[var(--bg-card)]/70 min-h-[88px] w-full resize-none rounded-xl border border-[var(--surface-strong-border)] px-3 py-2.5 text-[13px] leading-6 text-[var(--text-contrast)] placeholder-[var(--text-faint)] outline-none transition-colors focus:border-[#c4a24b]/45"
              />
              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="text-[10px] text-[var(--text-faint)]">
                  {replyText.length}/1000 karakter
                </span>
                <button
                  type="button"
                  onClick={() => submitComment(comment.id)}
                  disabled={isSubmittingComment || !replyText.trim()}
                  className="rounded-lg bg-[var(--gold)] px-3 py-1.5 text-[11px] font-bold text-[var(--text-on-accent)] transition-all duration-200 hover:bg-[var(--gold-light)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isSubmittingComment ? "Gönderiliyor..." : "Yanıt Gönder"}
                </button>
              </div>
            </div>
          )}
        </div>

        {hasReplies && (
          <div className="mt-3 space-y-3">
            {comment.replies.map((reply) => renderCommentNode(reply, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-[var(--bg-base)]">
      {/* ─── Hero Image ─── */}
      <div className="mx-auto max-w-6xl px-4 pt-4 sm:px-8 lg:px-16">
        {/* Breadcrumb */}
        <nav className="mb-3 flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
          <Link href="/notes" className="transition-colors hover:text-[var(--gold)]">
            Notlar
          </Link>
          <span className="text-[var(--border)]">›</span>
          <Link
            href={`/category/${encodeURIComponent(categorySlug)}`}
            className="transition-colors hover:text-[var(--gold)]"
          >
            {categoryLabel}
          </Link>
          <span className="text-[var(--border)]">›</span>
          <span className="max-w-[180px] truncate text-[var(--text-secondary)] sm:max-w-xs">
            {displayTitle.length > 35 ? displayTitle.slice(0, 35) + "…" : displayTitle}
          </span>
        </nav>

        <div
          className="relative w-full overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--media-panel-bg)] shadow-[var(--media-glow)]"
          style={{ height: imgOrientation === "landscape" ? "44vh" : "52vh" }}
        >
          {/* Blur backdrop */}
          {imgOrientation !== "landscape" && (
            <Image
              loader={customLoader}
              src={getPostImageSrc(post.image)}
              alt=""
              fill
              aria-hidden
              className="scale-110 object-cover opacity-55 blur-2xl"
              priority
            />
          )}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, var(--media-panel-sheen) 0%, transparent 58%, var(--media-panel-sheen) 100%)",
            }}
          />
          <Image
            loader={customLoader}
            src={getPostImageSrc(post.image)}
            alt={displayTitle}
            fill
            className={imgOrientation === "portrait" ? "object-contain" : "object-cover"}
            style={
              imgOrientation === "portrait"
                ? { filter: "drop-shadow(0 24px 36px rgba(0,0,0,0.35))" }
                : undefined
            }
            onLoad={handleImageLoad}
            priority
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, var(--media-overlay-soft) 0%, var(--media-overlay-mid) 56%, var(--media-overlay-strong) 100%)",
            }}
          />

          {/* Top controls */}
          <div className="absolute left-0 right-0 top-0 flex items-center justify-end gap-2 px-4 pt-4 sm:px-5">
            {isOwnPost && (
              <>
                <Link
                  href={`/posts/${post.id}/edit`}
                  className="flex items-center gap-1.5 rounded-lg border px-4 py-2 text-xs font-semibold shadow-sm backdrop-blur-md transition-all hover:border-[var(--media-control-hover-border)] hover:bg-[var(--media-control-hover-bg)] hover:text-[var(--gold)]"
                  style={{
                    borderColor: "var(--media-control-border)",
                    background: "var(--media-control-bg)",
                    color: "var(--media-control-text)",
                  }}
                >
                  <FaEdit size={11} /> Düzenle
                </Link>
                <button
                  onClick={() => setIsModalOpen(true)}
                  disabled={isDeleting}
                  className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs shadow-sm backdrop-blur-md transition-all hover:border-[#e53e3e]/70 hover:bg-[#3a151a]/80 hover:text-[#ff9a9a] disabled:opacity-40"
                  style={{
                    borderColor: "var(--media-control-border)",
                    background: "var(--media-control-bg)",
                    color: "var(--media-control-text)",
                  }}
                >
                  <FaTrash size={10} /> Sil
                </button>
              </>
            )}
          </div>

          {/* Overlaid title + meta */}
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-6 sm:px-6 sm:pb-8">
            <div className="max-w-3xl">
              <div className="mb-3 flex items-center gap-2">
                <span className="inline-block rounded-sm border border-[#c4a24b]/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--gold)]">
                  {categoryLabel}
                </span>
                {post.status && <StatusBadge status={post.status} />}
                {supportsSpoiler && post.hasSpoiler && (
                  <span className="bg-[#e53e3e]/12 inline-flex items-center rounded-full border border-[#e53e3e]/25 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#ffb2b2]">
                    Spoiler
                  </span>
                )}
              </div>
              <h1 className="mb-3 text-2xl font-bold leading-tight text-[var(--media-text-primary)] sm:text-3xl lg:text-4xl">
                {displayTitle}
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--media-text-secondary)] sm:gap-3">
                {post.creator && <span>{displayCreator}</span>}
                {post.years && (
                  <>
                    <span className="text-white/35">•</span>
                    <span>{post.years}</span>
                  </>
                )}
                {post.rating > 0 && (
                  <>
                    <span className="text-white/35">•</span>
                    <StarRating rating={post.rating} size={13} />
                    <span className="text-xs text-[var(--media-text-secondary)] opacity-90">
                      ({post.rating}/5)
                    </span>
                  </>
                )}
                {post.externalRating && post.externalRating > 0 && (
                  <>
                    <span className="text-white/35">•</span>
                    <span className="flex items-center gap-1 text-xs font-medium text-[var(--gold)]">
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.86 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z" />
                      </svg>
                      TMDB {post.externalRating.toFixed(1)}
                      <span className="font-normal text-[var(--media-text-secondary)] opacity-90">
                        /10
                      </span>
                    </span>
                  </>
                )}
                {post.date && (
                  <>
                    <span className="text-white/35">•</span>
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
        {/* Etiketler + Like butonu */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="flex flex-wrap gap-1.5">
            {post.tags &&
              post.tags.length > 0 &&
              post.tags.map((tag) => <TagBadge key={tag.id} tag={tag} />)}
          </div>

          {/* Like butonu — kendi notuna like yapamaz */}
          {!isOwnPost && (
            <div className="flex shrink-0 items-center gap-2">
              <BookmarkButton postId={post.id} ownerId={post.user?.id} />
              <ActionTooltip label={likeData.liked ? "Beğeniyi kaldır" : "Beğen"}>
                <button
                  type="button"
                  onClick={toggleLike}
                  disabled={isLiking}
                  aria-label={likeData.liked ? "Beğeniyi kaldır" : "Beğen"}
                  title={likeData.liked ? "Beğeniyi kaldır" : "Beğen"}
                  className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all duration-200 active:scale-95 disabled:opacity-50 ${
                    likeData.liked
                      ? "border-[#e53e3e]/40 bg-[#e53e3e]/10 text-[#e53e3e]"
                      : "border-[var(--surface-strong-border)] bg-[var(--surface-strong)] text-[var(--text-dim)] hover:border-[#e53e3e]/30 hover:text-[#e53e3e]"
                  }`}
                >
                  <Heart
                    size={16}
                    weight={likeData.liked ? "fill" : "regular"}
                    className="transition-transform duration-150"
                  />
                  <span>{likeData.count > 0 ? likeData.count : ""}</span>
                </button>
              </ActionTooltip>
            </div>
          )}

          {/* Kendi notu — sadece like sayısını göster */}
          {isOwnPost && likeData.count > 0 && (
            <div className="flex shrink-0 items-center gap-1.5 rounded-lg border border-[var(--surface-strong-border)] px-3 py-1.5 text-sm text-[var(--text-dim)]">
              <Heart size={16} weight="fill" className="text-[#e53e3e]" />
              <span>{likeData.count}</span>
            </div>
          )}
        </div>

        <CommunityStatsCard title={displayTitle} creator={displayCreator} />

        {typeof post.lat === "number" && typeof post.lng === "number" && (
          <section className="mb-6 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                  Konum
                </p>
                <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
                  {displayTitle}
                </p>
              </div>
              <a
                href={buildOpenStreetMapLink(post.lat, post.lng)}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-[var(--border)] bg-[var(--bg-raised)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:border-[#c4a24b]/35 hover:text-[var(--text-primary)]"
              >
                Haritada aç
              </a>
            </div>
            <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_220px]">
              <iframe
                title={`${displayTitle} harita görünümü`}
                src={buildOpenStreetMapEmbedUrl(post.lat, post.lng)}
                className="h-[260px] w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              <div className="border-t border-[var(--border)] bg-[var(--bg-raised)] p-4 text-sm lg:border-l lg:border-t-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                  Koordinatlar
                </p>
                <p className="mt-3 text-[var(--text-secondary)]">
                  {formatCoordinate(post.lat)}, {formatCoordinate(post.lng)}
                </p>
                {post.excerpt && (
                  <p className="mt-3 text-xs leading-6 text-[var(--text-muted)]">
                    {displayExcerpt}
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        {supportsSpoiler && post.hasSpoiler && (
          <div className="border-[#e53e3e]/18 bg-[#e53e3e]/6 mb-4 rounded-2xl border px-4 py-3 text-sm text-[var(--text-secondary)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-[var(--text-primary)]">Spoiler uyarısı</p>
                <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
                  Bu not açık detaylar içerebilir. Devam etmek için içeriği açman gerekiyor.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  markSpoilerOverlayDismissed();
                  setIsSpoilerRevealed((prev) => !prev);
                }}
                className="hover:bg-[#e53e3e]/16 inline-flex items-center justify-center rounded-lg border border-[#e53e3e]/25 bg-[#e53e3e]/10 px-3 py-2 text-xs font-semibold text-[#ffb2b2] transition-colors"
              >
                {shouldBlurSpoiler ? "Spoiler'i Göster" : "Spoiler'i Gizle"}
              </button>
            </div>
          </div>
        )}

        <div className="relative">
          <article
            aria-hidden={shouldBlurSpoiler}
            className={`prose prose-base max-w-none transition-[filter,opacity] duration-300 sm:prose-lg prose-headings:font-bold prose-headings:text-[var(--text-primary)] prose-p:leading-[1.85] prose-p:text-[var(--text-secondary)] prose-a:text-[var(--gold)] prose-a:no-underline hover:prose-a:underline prose-blockquote:border-l-[var(--gold)] prose-blockquote:text-[var(--text-secondary)] prose-strong:text-[var(--text-primary)] prose-code:rounded prose-code:bg-[var(--bg-raised)] prose-code:px-1 prose-code:text-[var(--gold)] prose-pre:border prose-pre:border-[var(--border)] prose-pre:bg-[var(--bg-raised)] prose-ol:text-[var(--text-secondary)] prose-ul:text-[var(--text-secondary)] prose-li:marker:text-[var(--gold)] ${
              shouldBlurSpoiler ? "pointer-events-none select-none opacity-70 blur-[14px]" : ""
            }`}
          >
            <div dangerouslySetInnerHTML={{ __html: post.content }} />
          </article>

          {shouldShowSpoilerOverlay && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-3xl">
              <div className="bg-[var(--bg-card)]/96 pointer-events-auto max-w-sm rounded-2xl border border-[var(--border)] p-5 text-center shadow-[var(--shadow-soft)] backdrop-blur-xl">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-[#e53e3e]/25 bg-[#e53e3e]/10 text-[#ffb2b2]">
                  !
                </div>
                <p className="text-base font-semibold text-[var(--text-primary)]">
                  Spoiler filtresi aktif
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
                  İçeriği okumadan önce spoiler riskini kabul etmen gerekiyor.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    markSpoilerOverlayDismissed();
                    setIsSpoilerRevealed(true);
                  }}
                  className="mt-4 inline-flex rounded-xl bg-[var(--gold)] px-4 py-2 text-sm font-semibold text-[var(--text-on-accent)] transition-colors hover:bg-[var(--gold-light)]"
                >
                  Spoiler'i Gör
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ─── Yorumlar ─── */}
        <div className="mt-12 border-t border-[var(--surface-strong-border)] pt-8">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="bg-[#c4a24b]/12 flex h-7 w-7 items-center justify-center rounded-full border border-[#c4a24b]/25">
                <svg
                  className="h-3.5 w-3.5 text-[var(--gold)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <h2 className="text-[13px] font-semibold text-[var(--text-dim)] sm:text-sm">
                Yorumlar
              </h2>
            </div>
            <span className="rounded-full border border-[var(--surface-strong-border)] bg-[var(--surface-strong)] px-2.5 py-0.5 text-[10px] text-[var(--text-faint)]">
              {comments.length}
            </span>
          </div>

          {comments.length === 0 && (
            <div className="bg-[var(--surface-strong)]/40 mb-6 rounded-xl border border-dashed border-[var(--surface-strong-border)] px-4 py-3 text-center text-xs text-[var(--text-faint)]">
              {isOwnPost
                ? "Henüz yorum yok. Bu alanda diğer kullanıcıların yorumları görünecek."
                : "Henüz yorum yok. İlk yorumu sen bırak."}
            </div>
          )}

          {threadedComments.length > 0 && (
            <div className="mb-6 space-y-3">
              {threadedComments.map((comment) => renderCommentNode(comment))}
            </div>
          )}

          {session?.user ? (
            canCommentOnPost ? (
              <div className="bg-[var(--surface-strong)]/85 rounded-2xl border border-[var(--surface-strong-border)] p-3.5 shadow-[var(--shadow-soft)] sm:p-4">
                {replyingToId && (
                  <div className="bg-[#c4a24b]/8 mb-3 flex items-center justify-between rounded-xl border border-[#c4a24b]/20 px-3 py-2 text-[11px] text-[var(--gold)]">
                    <span>Şu anda bir yoruma yanıt yazıyorsun.</span>
                    <button
                      type="button"
                      onClick={() => {
                        setReplyingToId(null);
                        setReplyText("");
                      }}
                      className="font-semibold transition-colors hover:text-[var(--gold-light)]"
                    >
                      İptal et
                    </button>
                  </div>
                )}
                <textarea
                  ref={commentInputRef}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Yorumunuzu yazın..."
                  rows={3}
                  maxLength={1000}
                  className="bg-[var(--bg-card)]/70 min-h-[96px] w-full resize-none rounded-xl border border-[var(--surface-strong-border)] px-3 py-2.5 text-[13px] leading-6 text-[var(--text-contrast)] placeholder-[var(--text-faint)] outline-none transition-colors focus:border-[#c4a24b]/45 sm:text-sm sm:leading-relaxed"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.metaKey) submitComment();
                  }}
                />
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-[10px] text-[var(--text-faint)]">
                    {commentText.length}/1000 karakter
                  </span>
                  <button
                    type="button"
                    onClick={() => submitComment()}
                    disabled={isSubmittingComment || !commentText.trim()}
                    className="h-11 w-full rounded-lg bg-[var(--gold)] px-4 text-xs font-bold text-[var(--text-on-accent)] transition-all duration-200 hover:bg-[var(--gold-light)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 sm:h-auto sm:w-auto sm:py-1.5"
                  >
                    {isSubmittingComment ? "Gönderiliyor..." : "Yorum Yap"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-[var(--surface-strong-border)] bg-[var(--surface-strong)] px-4 py-5 text-center shadow-[var(--shadow-soft)]">
                <p className="text-sm text-[var(--text-dim)]">
                  Kendi notuna yorum veya yanıt ekleyemezsin.
                </p>
              </div>
            )
          ) : (
            <div className="rounded-2xl border border-[var(--surface-strong-border)] bg-[var(--surface-strong)] px-4 py-5 text-center shadow-[var(--shadow-soft)]">
              <p className="mb-2 text-sm text-[var(--text-dim)]">Yorum yapmak için giriş yapın.</p>
              <Link
                href="/login"
                className="text-xs font-medium text-[var(--gold)] transition-colors hover:text-[var(--gold-light)]"
              >
                Giriş Yap →
              </Link>
            </div>
          )}
        </div>

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
                  className="group block rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 transition-colors hover:border-[#c4a24b]/30 hover:bg-[var(--bg-raised)]"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#c4a24b]/10 text-[10px] font-bold text-[var(--gold)]">
                      {cp.user?.name?.charAt(0)?.toUpperCase() ?? "?"}
                    </div>
                    <span className="text-xs font-medium text-[var(--text-secondary)]">
                      {cp.user?.name ?? "Kullanıcı"}
                    </span>
                    {cp.rating > 0 && (
                      <span className="ml-auto flex items-center gap-1 text-xs text-[var(--gold)]">
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
            href={`/category/${encodeURIComponent(categorySlug)}`}
            className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--gold)]"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            {categoryLabel}
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
