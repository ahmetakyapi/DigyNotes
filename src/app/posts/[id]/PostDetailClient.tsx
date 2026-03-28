"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArchiveIcon, HeartIcon, PencilSimpleIcon, PushPinIcon, TrashIcon } from "@phosphor-icons/react";
import { Post } from "@/types";
import StarRating from "@/components/StarRating";
import { StatusBadge } from "@/components/StatusBadge";
import { ConfirmModal } from "@/components/ConfirmModal";
import TagBadge from "@/components/TagBadge";
import CommunityStatsCard from "@/components/CommunityStatsCard";
import { BookmarkButton } from "@/components/BookmarkButton";
import { ActionTooltip } from "@/components/ActionTooltip";
import ShareButton from "@/components/ShareButton";
import { getCategoryLabel, normalizeCategory } from "@/lib/categories";
import { formatDisplaySentence, formatDisplayTitle } from "@/lib/display-text";
import { buildOpenStreetMapEmbedUrl, buildOpenStreetMapLink, formatCoordinate } from "@/lib/maps";
import { getPostImageSrc } from "@/lib/post-image";
import { categorySupportsSpoiler } from "@/lib/post-config";
import { estimateReadingTime, formatReadingTime } from "@/lib/reading-time";
import { addRecentView } from "@/components/RecentlyViewed";
import { ResilientImage } from "@/components/ResilientImage";
import { getClientErrorMessage, isAuthenticationError, requestJson } from "@/lib/client-api";
import toast from "react-hot-toast";

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
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const currentUserId = session?.user ? (session.user as { id: string }).id : null;

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [archived, setArchived] = useState(false);
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
  const [highlightedCommentId, setHighlightedCommentId] = useState<string | null>(null);
  const [interactionMessage, setInteractionMessage] = useState<{
    tone: "like" | "comment";
    text: string;
  } | null>(null);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const replyInputRef = useRef<HTMLTextAreaElement>(null);
  const interactionTimerRef = useRef<number | null>(null);

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
        if (data?.isPinned) setPinned(true);
        if (data?.isArchived) setArchived(true);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.id]);

  // Son görüntülenen notlara ekle
  useEffect(() => {
    if (post) {
      addRecentView({
        id: post.id,
        title: post.title,
        category: post.category,
        image: post.image,
        rating: post.rating,
      });
    }
  }, [post]);

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
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((data) => setComments(Array.isArray(data) ? data : data.items ?? []))
      .catch(() => {});
  }, [params.id]);

  useEffect(() => {
    if (replyingToId) {
      window.setTimeout(() => replyInputRef.current?.focus(), 0);
    }
  }, [replyingToId]);

  useEffect(() => {
    return () => {
      if (interactionTimerRef.current) {
        window.clearTimeout(interactionTimerRef.current);
      }
    };
  }, []);

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
  const commentsById = useMemo(
    () => new Map(comments.map((comment) => [comment.id, comment])),
    [comments]
  );
  const targetCommentId = searchParams.get("comment");

  const showInteractionMessage = (tone: "like" | "comment", text: string) => {
    setInteractionMessage({ tone, text });
    if (interactionTimerRef.current) {
      window.clearTimeout(interactionTimerRef.current);
    }
    interactionTimerRef.current = window.setTimeout(() => {
      setInteractionMessage(null);
    }, 2600);
  };

  useEffect(() => {
    if (!targetCommentId || comments.length === 0) return;

    const element = document.getElementById(`comment-${targetCommentId}`);
    if (!element) return;

    element.scrollIntoView({ behavior: "smooth", block: "center" });
    setHighlightedCommentId(targetCommentId);

    const timer = window.setTimeout(() => {
      setHighlightedCommentId((current) => (current === targetCommentId ? null : current));
    }, 3200);

    return () => window.clearTimeout(timer);
  }, [comments.length, targetCommentId]);

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await requestJson<{ success: boolean }>(
        `/api/posts/${params.id}`,
        { method: "DELETE" },
        "Not silinemedi."
      );
      setIsModalOpen(false);
      toast.success("Not silindi");
      router.push("/notes");
    } catch (error) {
      toast.error(getClientErrorMessage(error, "Not silinemedi."));
      if (isAuthenticationError(error)) {
        router.push("/login");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleLike = async () => {
    if (!session?.user) {
      toast.error("Beğenmek için giriş yapman gerekiyor.");
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
      const data = await requestJson<LikeData>(
        `/api/posts/${params.id}/likes`,
        { method: "POST" },
        "Beğeni güncellenemedi."
      );
      setLikeData(data);
      showInteractionMessage("like", data.liked ? "Beğeni kaydedildi" : "Beğeni kaldırıldı");
    } catch (error) {
      setLikeData((prev) => ({
        count: prev.liked ? prev.count - 1 : prev.count + 1,
        liked: !prev.liked,
      }));
      toast.error(getClientErrorMessage(error, "Beğeni güncellenemedi."));
      if (isAuthenticationError(error)) {
        router.push("/login");
      }
    } finally {
      setIsLiking(false);
    }
  };

  const submitComment = async (parentId?: string | null) => {
    if (!session?.user) {
      toast.error("Yorum yapmak için giriş yapman gerekiyor.");
      router.push("/login");
      return;
    }
    const text = (parentId ? replyText : commentText).trim();
    if (!text) return;

    setIsSubmittingComment(true);
    try {
      const newComment = await requestJson<Comment>(
        `/api/posts/${params.id}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: text, parentId: parentId ?? null }),
        },
        "Yorum eklenemedi."
      );
      setComments((prev) => [...prev, newComment]);
      if (parentId) {
        setReplyText("");
        setReplyingToId(null);
        showInteractionMessage("comment", "Yanıt konuşmaya eklendi");
      } else {
        setCommentText("");
        showInteractionMessage("comment", "Yorum konuşmaya eklendi");
      }
    } catch (error) {
      toast.error(getClientErrorMessage(error, "Yorum eklenemedi."));
      if (isAuthenticationError(error)) {
        router.push("/login");
      }
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const deleteComment = async (commentId: string) => {
    setDeletingCommentId(commentId);
    try {
      await requestJson<{ success: boolean }>(
        `/api/posts/${params.id}/comments/${commentId}`,
        {
          method: "DELETE",
        },
        "Yorum silinemedi."
      );
      setComments((prev) => {
        const branchIds = collectCommentBranchIds(prev, commentId);
        if (replyingToId && branchIds.has(replyingToId)) {
          setReplyingToId(null);
          setReplyText("");
        }
        return prev.filter((comment) => !branchIds.has(comment.id));
      });
      toast.success("Yorum silindi");
    } catch (error) {
      toast.error(getClientErrorMessage(error, "Yorum silinemedi."));
      if (isAuthenticationError(error)) {
        router.push("/login");
      }
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
  const canCommentOnPost = Boolean(session?.user);
  const supportsSpoiler = categorySupportsSpoiler(post.category);
  const categorySlug = normalizeCategory(post.category);
  const categoryLabel = getCategoryLabel(post.category);
  const displayTitle = formatDisplayTitle(post.title);
  const displayCreator = formatDisplayTitle(post.creator);
  const displayExcerpt = formatDisplaySentence(post.excerpt);
  const createdLabel = formatDate(post.createdAt);
  const authorProfileHref = post.user?.username ? `/profile/${post.user.username}` : null;
  const tagCount = post.tags?.length ?? 0;
  const shouldBlurSpoiler = Boolean(supportsSpoiler && post.hasSpoiler && !isSpoilerRevealed);
  const shouldShowSpoilerOverlay = shouldBlurSpoiler && !hasDismissedSpoilerOverlay;

  const toggleReply = (commentId: string) => {
    if (!session?.user) {
      router.push("/login");
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
    const parentComment = comment.parentId ? commentsById.get(comment.parentId) : null;
    const isPostAuthorComment = comment.user.id === post.user?.id;
    const isHighlighted = highlightedCommentId === comment.id;

    return (
      <div
        key={comment.id}
        id={`comment-${comment.id}`}
        className={
          depth > 0
            ? "ml-5 scroll-mt-24 border-l-2 border-[var(--surface-strong-border)] pl-5 sm:ml-8 sm:pl-6"
            : "scroll-mt-24"
        }
      >
        <div
          className={`rounded-xl p-4 transition-colors ${
            isHighlighted
              ? "bg-[#10b981]/5 ring-1 ring-[#10b981]/30"
              : "hover:bg-[var(--surface-strong)]/50"
          }`}
        >
          {/* Üst satır: Avatar + isim + tarih + aksiyonlar */}
          <div className="mb-2.5 flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#10b981]/12 text-[11px] font-bold text-[#10b981] ring-1 ring-[#10b981]/20">
                {comment.user.name?.charAt(0)?.toUpperCase() ?? "?"}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[13px] font-semibold text-[var(--text-contrast)]">
                    {comment.user.name}
                  </span>
                  {isPostAuthorComment && (
                    <span className="rounded bg-[#10b981]/10 px-1.5 py-0.5 text-[9px] font-semibold text-[#10b981] ring-1 ring-[#10b981]/20">
                      Yazar
                    </span>
                  )}
                  {isOwn && !isPostAuthorComment && (
                    <span className="rounded bg-[var(--surface-strong)] px-1.5 py-0.5 text-[9px] font-medium text-[var(--text-faint)] ring-1 ring-[var(--surface-strong-border)]">
                      Sen
                    </span>
                  )}
                  <span className="text-[11px] text-[var(--text-faint)]">
                    · {formatDate(comment.createdAt)}
                  </span>
                </div>
                {parentComment?.user && (
                  <span className="text-[10px] text-[var(--text-faint)]">
                    ↳{" "}
                    {parentComment.user.username
                      ? `@${parentComment.user.username}`
                      : parentComment.user.name}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-0.5">
              {canCommentOnPost && (
                <button
                  type="button"
                  onClick={() => toggleReply(comment.id)}
                  className="rounded-md px-2 py-1 text-[11px] text-[var(--text-faint)] transition-colors duration-150 hover:bg-[var(--surface-strong)] hover:text-[#10b981]"
                >
                  {isReplying ? "Vazgeç" : "Yanıtla"}
                </button>
              )}
              {isOwn && (
                <button
                  type="button"
                  onClick={() => deleteComment(comment.id)}
                  disabled={deletingCommentId === comment.id}
                  className="rounded-md px-2 py-1 text-[11px] text-[var(--text-faint)] transition-colors duration-150 hover:bg-[#e53e3e]/8 hover:text-[#e53e3e] disabled:opacity-40"
                >
                  {deletingCommentId === comment.id ? "..." : "Sil"}
                </button>
              )}
            </div>
          </div>

          {/* Yorum içeriği */}
          <p className="whitespace-pre-wrap pl-[42px] text-[13px] leading-relaxed text-[var(--text-dim)] sm:text-sm">
            {comment.content}
          </p>

          {/* Inline yanıt alanı */}
          {isReplying && (
            <div className="mt-3 pl-[42px]">
              <div className="flex gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#10b981]/10 text-[9px] font-bold text-[#10b981]">
                  {session?.user?.name?.charAt(0)?.toUpperCase() ?? "?"}
                </div>
                <div className="flex-1">
                  <textarea
                    ref={replyInputRef}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Yanıtını yaz..."
                    rows={2}
                    maxLength={1000}
                    className="w-full resize-none rounded-lg border border-[var(--surface-strong-border)] bg-[var(--surface-strong)] px-3 py-2 text-[16px] leading-6 text-[var(--text-contrast)] placeholder-[var(--text-faint)] outline-none transition-all duration-200 focus:border-[#10b981]/40 focus:ring-1 focus:ring-[#10b981]/20 sm:text-[13px]"
                  />
                  <div className="mt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setReplyingToId(null);
                        setReplyText("");
                      }}
                      className="rounded-md px-3 py-1 text-[11px] text-[var(--text-faint)] transition-colors hover:text-[var(--text-dim)]"
                    >
                      İptal
                    </button>
                    <button
                      type="button"
                      onClick={() => submitComment(comment.id)}
                      disabled={isSubmittingComment || !replyText.trim()}
                      className="rounded-lg bg-[#10b981] px-3 py-1.5 text-[11px] font-semibold text-[#0c0c0c] transition-all duration-200 hover:bg-[#34d399] active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      {isSubmittingComment ? "..." : "Yanıtla"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {hasReplies && (
          <div className="mt-1 space-y-1">
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
            <ResilientImage
              src={getPostImageSrc(post.image, post.category)}
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
          <ResilientImage
            src={getPostImageSrc(post.image, post.category)}
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
          <div className="absolute left-0 right-0 top-0 flex items-center justify-between px-4 pt-4 sm:px-5">
            {isOwnPost && (
              <>
                {/* Sol grup: Sabitle + Arşivle */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => {
                      const action = pinned ? "unpin" : "pin";
                      const res = await fetch(`/api/posts/${post.id}/actions`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action }),
                      });
                      if (res.ok) {
                        setPinned(!pinned);
                        toast.success(!pinned ? "Not sabitlendi" : "Sabitleme kaldırıldı");
                      }
                    }}
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold backdrop-blur-md transition-all duration-200 active:scale-95 ${
                      pinned
                        ? "border-[#059669] bg-[#059669] text-white shadow-[0_2px_10px_rgba(5,150,105,0.3)]"
                        : "shadow-sm hover:border-[var(--media-control-hover-border)] hover:bg-[var(--media-control-hover-bg)] hover:text-[var(--gold)]"
                    }`}
                    style={
                      pinned
                        ? undefined
                        : {
                            borderColor: "var(--media-control-border)",
                            background: "var(--media-control-bg)",
                            color: "var(--media-control-text)",
                          }
                    }
                  >
                    <PushPinIcon
                      size={12}
                      weight={pinned ? "fill" : "regular"}
                      className={`transition-transform duration-200 ${pinned ? "rotate-0" : "-rotate-45"}`}
                    />
                    {pinned ? "Sabitlendi" : "Sabitle"}
                  </button>
                  <button
                    onClick={async () => {
                      const action = archived ? "unarchive" : "archive";
                      const res = await fetch(`/api/posts/${post.id}/actions`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action }),
                      });
                      if (res.ok) {
                        setArchived(!archived);
                        toast.success(!archived ? "Arşivlendi" : "Arşivden çıkarıldı");
                      }
                    }}
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold shadow-sm backdrop-blur-md transition-all duration-200 active:scale-95 ${
                      archived
                        ? "border-[#f59e0b]/50 bg-[#f59e0b]/15 text-[#f59e0b]"
                        : "hover:border-[var(--media-control-hover-border)] hover:bg-[var(--media-control-hover-bg)] hover:text-[var(--gold)]"
                    }`}
                    style={
                      archived
                        ? undefined
                        : {
                            borderColor: "var(--media-control-border)",
                            background: "var(--media-control-bg)",
                            color: "var(--media-control-text)",
                          }
                    }
                  >
                    <ArchiveIcon size={12} weight={archived ? "fill" : "regular"} />
                    {archived ? "Arşivde" : "Arşivle"}
                  </button>
                </div>

                {/* Sağ grup: Paylaş + Düzenle + Sil */}
                <div className="flex items-center gap-2">
                  <ShareButton
                    title={post.title}
                    text={`${post.title} — DigyNotes`}
                    label="Paylaş"
                    className="font-semibold shadow-sm hover:border-[var(--media-control-hover-border)] hover:bg-[var(--media-control-hover-bg)] hover:text-[var(--gold)]"
                    style={{
                      borderColor: "var(--media-control-border)",
                      background: "var(--media-control-bg)",
                      color: "var(--media-control-text)",
                    }}
                  />
                  <Link
                    href={`/posts/${post.id}/edit`}
                    className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold shadow-sm backdrop-blur-md transition-all duration-200 active:scale-95 hover:border-[var(--media-control-hover-border)] hover:bg-[var(--media-control-hover-bg)] hover:text-[var(--gold)]"
                    style={{
                      borderColor: "var(--media-control-border)",
                      background: "var(--media-control-bg)",
                      color: "var(--media-control-text)",
                    }}
                  >
                    <PencilSimpleIcon size={11} weight="fill" /> Düzenle
                  </Link>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    disabled={isDeleting}
                    className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold shadow-sm backdrop-blur-md transition-all duration-200 active:scale-95 hover:border-[#e53e3e]/70 hover:bg-[#3a151a]/80 hover:text-[#ff9a9a] disabled:opacity-40"
                    style={{
                      borderColor: "var(--media-control-border)",
                      background: "var(--media-control-bg)",
                      color: "var(--media-control-text)",
                    }}
                  >
                    <TrashIcon size={10} weight="fill" /> Sil
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Overlaid title + meta */}
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-6 sm:px-6 sm:pb-8">
            <div className="max-w-3xl">
              <div className="mb-3 flex items-center gap-2">
                <span className="inline-block rounded-sm border border-[#10b981]/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--gold)]">
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
                {post.creator &&
                  (authorProfileHref ? (
                    <Link
                      href={authorProfileHref}
                      className="transition-colors hover:text-[var(--gold)]"
                    >
                      {displayCreator}
                    </Link>
                  ) : (
                    <span>{displayCreator}</span>
                  ))}
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
                {post.content && estimateReadingTime(post.content) > 0 && (
                  <>
                    <span className="text-white/35">•</span>
                    <span className="text-xs opacity-75">
                      {formatReadingTime(estimateReadingTime(post.content))}
                    </span>
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
              post.tags.map((tag) => (
                <TagBadge key={tag.id} tag={tag} href={`/tag/${encodeURIComponent(tag.name)}`} />
              ))}
          </div>

          {/* Like butonu — kendi notuna like yapamaz */}
          {!isOwnPost && (
            <div className="flex shrink-0 items-center gap-2">
              <BookmarkButton postId={post.id} ownerId={post.user?.id} />
              <ShareButton title={post.title} text={`${post.title} — DigyNotes`} size="sm" />
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
                  <HeartIcon
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
              <HeartIcon size={16} weight="fill" className="text-[#e53e3e]" />
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
                className="rounded-xl border border-[var(--border)] bg-[var(--bg-raised)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:border-[#10b981]/35 hover:text-[var(--text-primary)]"
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
          <div
            className={`mb-5 overflow-hidden rounded-2xl border transition-all duration-300 ${
              shouldBlurSpoiler
                ? "border-[#e53e3e]/20 bg-gradient-to-r from-[#e53e3e]/[0.06] via-[#e53e3e]/[0.03] to-transparent"
                : "border-[var(--gold)]/20 from-[var(--gold)]/[0.06] via-[var(--gold)]/[0.03] bg-gradient-to-r to-transparent"
            }`}
          >
            <div className="flex items-center gap-3 px-4 py-3">
              <div
                className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                  shouldBlurSpoiler
                    ? "border border-[#e53e3e]/25 bg-[#e53e3e]/10 text-[#ffb2b2]"
                    : "border-[var(--gold)]/25 bg-[var(--gold)]/10 border text-[var(--gold)]"
                }`}
              >
                {shouldBlurSpoiler ? (
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className={`text-[13px] font-semibold ${shouldBlurSpoiler ? "text-[#ffb2b2]" : "text-[var(--gold)]"}`}
                >
                  {shouldBlurSpoiler ? "Spoiler içerik gizlendi" : "İçerik gösteriliyor"}
                </p>
                <p className="mt-0.5 text-[11px] leading-4 text-[var(--text-muted)]">
                  {shouldBlurSpoiler
                    ? "Bu not açık detaylar içerebilir."
                    : "Spoiler içeriği görebiliyorsun."}
                </p>
                <p className="mt-1 text-[11px] leading-4 text-[var(--text-faint)]">
                  Etiketler, kategori ve topluluk bağlamı görünür kalır; yalnızca metin gizlenir.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  markSpoilerOverlayDismissed();
                  setIsSpoilerRevealed((prev) => !prev);
                }}
                className={`flex-shrink-0 rounded-xl px-4 py-2 text-xs font-bold transition-all duration-200 active:scale-95 ${
                  shouldBlurSpoiler
                    ? "bg-[var(--gold)] text-[var(--text-on-accent)] hover:bg-[var(--gold-light)]"
                    : "hover:border-[var(--gold)]/30 border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--gold)]"
                }`}
              >
                {shouldBlurSpoiler ? "Spoiler'ı Göster" : "Gizle"}
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
        </div>

        {/* ─── Ayırıcı ─── */}
        <div className="mt-14 flex items-center gap-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[var(--surface-strong-border)] to-transparent" />
          <div className="flex items-center gap-1.5">
            <span className="h-1 w-1 rounded-full bg-[#10b981]/40" />
            <span className="h-1.5 w-1.5 rounded-full bg-[#10b981]/60" />
            <span className="h-1 w-1 rounded-full bg-[#10b981]/40" />
          </div>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[var(--surface-strong-border)] to-transparent" />
        </div>

        {/* ─── Yorumlar ─── */}
        <div className="mt-10">
          {/* Başlık */}
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#10b981]/10 ring-1 ring-[#10b981]/20">
              <svg
                className="h-4 w-4 text-[#10b981]"
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
            <div className="flex items-baseline gap-2">
              <h2 className="text-base font-semibold text-[var(--text-contrast)]">
                Yorumlar
              </h2>
              {comments.length > 0 && (
                <span className="text-sm text-[var(--text-faint)]">
                  ({comments.length})
                </span>
              )}
            </div>
          </div>

          {/* Yorum Yazma Alanı — üstte */}
          {session?.user ? (
            <div className="mb-8">
              {replyingToId && (
                <div className="mb-3 flex items-center justify-between rounded-lg bg-[#10b981]/8 px-3.5 py-2.5 ring-1 ring-[#10b981]/20">
                  <span className="text-xs text-[#10b981]">Bir yoruma yanıt yazıyorsun</span>
                  <button
                    type="button"
                    onClick={() => {
                      setReplyingToId(null);
                      setReplyText("");
                    }}
                    className="text-xs font-medium text-[#10b981] transition-colors hover:text-[#34d399]"
                  >
                    İptal
                  </button>
                </div>
              )}
              <div className="flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#10b981]/12 text-xs font-bold text-[#10b981] ring-1 ring-[#10b981]/20">
                  {session.user.name?.charAt(0)?.toUpperCase() ?? "?"}
                </div>
                <div className="flex-1">
                  <textarea
                    ref={commentInputRef}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Düşüncelerini paylaş..."
                    rows={3}
                    maxLength={1000}
                    className="w-full resize-none rounded-xl border border-[var(--surface-strong-border)] bg-[var(--surface-strong)] px-4 py-3 text-[16px] leading-6 text-[var(--text-contrast)] placeholder-[var(--text-faint)] outline-none transition-all duration-200 focus:border-[#10b981]/40 focus:ring-1 focus:ring-[#10b981]/20 sm:text-sm sm:leading-relaxed"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.metaKey) submitComment();
                    }}
                  />
                  <div className="mt-2.5 flex items-center justify-between">
                    <span className="text-[10px] text-[var(--text-faint)]">
                      {commentText.length > 0 && `${commentText.length}/1000`}
                    </span>
                    <button
                      type="button"
                      onClick={() => submitComment()}
                      disabled={isSubmittingComment || !commentText.trim()}
                      className="rounded-lg bg-[#10b981] px-4 py-2 text-xs font-semibold text-[#0c0c0c] transition-all duration-200 hover:bg-[#34d399] active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 sm:py-1.5"
                    >
                      {isSubmittingComment ? "Gönderiliyor..." : "Gönder"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-8 flex items-center justify-between rounded-xl bg-[var(--surface-strong)] px-5 py-4 ring-1 ring-[var(--surface-strong-border)]">
              <p className="text-sm text-[var(--text-dim)]">Yorum yapmak için giriş yap</p>
              <Link
                href="/login"
                className="rounded-lg bg-[#10b981]/10 px-4 py-1.5 text-xs font-medium text-[#10b981] ring-1 ring-[#10b981]/20 transition-colors hover:bg-[#10b981]/20"
              >
                Giriş Yap
              </Link>
            </div>
          )}

          {/* Boş durum */}
          {comments.length === 0 && (
            <div className="flex flex-col items-center py-12 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--surface-strong)] ring-1 ring-[var(--surface-strong-border)]">
                <svg
                  className="h-6 w-6 text-[var(--text-faint)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <p className="text-sm text-[var(--text-dim)]">Henüz yorum yok</p>
              <p className="mt-1 text-xs text-[var(--text-faint)]">
                {isOwnPost
                  ? "Diğer kullanıcıların yorumları burada görünecek"
                  : "İlk yorumu sen bırak"}
              </p>
            </div>
          )}

          {/* Yorum listesi */}
          {threadedComments.length > 0 && (
            <div className="space-y-4">
              {threadedComments.map((comment) => renderCommentNode(comment))}
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
            <p className="mb-4 text-sm leading-6 text-[var(--text-muted)]">
              Aynı başlık etrafında oluşan diğer yorum yolları. Buradan farklı kullanıcıların aynı
              içerik için nasıl hafıza izleri bıraktığına dönebilirsin.
            </p>
            <div className="space-y-3">
              {communityPosts.map((cp) => (
                <Link
                  key={cp.id}
                  href={`/posts/${cp.id}`}
                  className="group block rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 transition-colors hover:border-[#10b981]/30 hover:bg-[var(--bg-raised)]"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#10b981]/10 text-[10px] font-bold text-[var(--gold)]">
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
          <div className="flex flex-wrap items-center gap-4">
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
            {post.tags?.[0] && (
              <Link
                href={`/tag/${encodeURIComponent(post.tags[0].name)}`}
                className="text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--gold)]"
              >
                #{post.tags[0].name}
              </Link>
            )}
            {authorProfileHref && (
              <Link
                href={authorProfileHref}
                className="text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--gold)]"
              >
                @{post.user?.username}
              </Link>
            )}
          </div>
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
