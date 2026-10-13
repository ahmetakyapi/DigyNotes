"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useReducedMotion } from "framer-motion";
import toast from "react-hot-toast";
import { ChatCircleIcon, CircleNotchIcon, PaperPlaneRightIcon } from "@phosphor-icons/react";
import { AvatarImage } from "@/components/AvatarImage";
import { ConfirmModal } from "@/components/ConfirmModal";
import { getClientErrorMessage, isAuthenticationError, requestJson } from "@/lib/client-api";
import { buildCommentTree, collectCommentBranchIds, mergeComments } from "@/lib/comment-thread";
import { CommentItem, type CommentThreadContext } from "./CommentItem";
import { MentionTextarea } from "./MentionTextarea";
import type { CommentData, CommentPage } from "./types";

/* Root comments per page; their replies always come along. */
const PAGE_SIZE = 20;
/* Pages fetched while looking for a `?comment=` deep-link target before giving up. */
const DEEP_LINK_MAX_PAGES = 5;
const HIGHLIGHT_MS = 2800;

type ScrollRequest = { id: string; block: ScrollLogicalPosition };

async function fetchCommentPage(postId: string, cursor: string | null) {
  const query = new URLSearchParams({ limit: String(PAGE_SIZE) });
  if (cursor) query.set("cursor", cursor);
  const response = await fetch(`/api/posts/${postId}/comments?${query}`, { cache: "no-store" });
  if (!response.ok) throw new Error("comments");
  const data = (await response.json()) as Partial<CommentPage>;
  return {
    items: Array.isArray(data.items) ? data.items : [],
    nextCursor: data.nextCursor ?? null,
    total: typeof data.total === "number" ? data.total : 0,
  };
}

const textareaClass =
  "w-full resize-none rounded-2xl border border-[var(--surface-strong-border)] bg-[var(--surface-strong)] px-4 py-3 text-[16px] leading-6 text-[var(--text-contrast)] placeholder-[var(--text-faint)] outline-none transition-colors duration-200 focus:border-accent/40 focus:ring-1 focus:ring-accent/20 sm:text-sm sm:leading-relaxed";

/**
 * The note's conversation: composer on top, newest threads first (older ones behind
 * "Daha Fazla Yorum"), replies under their parent, likes, @mentions and moderation.
 */
export function PostComments({
  postId,
  postAuthorId,
  isOwnPost,
}: {
  postId: string;
  postAuthorId: string | null;
  isOwnPost: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetCommentId = searchParams.get("comment");
  const { data: session } = useSession();
  const currentUserId = session?.user ? (session.user as { id: string }).id : null;
  const viewerName = session?.user?.name ?? null;
  const reduceMotion = useReducedMotion();

  const [comments, setComments] = useState<CommentData[]>([]);
  const [total, setTotal] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [loadingMore, setLoadingMore] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [replyText, setReplyText] = useState("");
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<"root" | "reply" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CommentData | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [scrollRequest, setScrollRequest] = useState<ScrollRequest | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const replyInputRef = useRef<HTMLTextAreaElement>(null);
  const highlightTimerRef = useRef<number | null>(null);
  const pendingLikesRef = useRef(new Set<string>());
  const handledTargetRef = useRef<string | null>(null);

  const flash = useCallback((id: string, block: ScrollLogicalPosition) => {
    setHighlightedId(id);
    setScrollRequest({ id, block });
    if (highlightTimerRef.current) window.clearTimeout(highlightTimerRef.current);
    highlightTimerRef.current = window.setTimeout(() => {
      setHighlightedId((current) => (current === id ? null : current));
    }, HIGHLIGHT_MS);
  }, []);

  useEffect(
    () => () => {
      if (highlightTimerRef.current) window.clearTimeout(highlightTimerRef.current);
    },
    []
  );

  /* First page; with a `?comment=` target keep paging (bounded) until it shows up. */
  useEffect(() => {
    let cancelled = false;
    setStatus("loading");

    (async () => {
      try {
        let page = await fetchCommentPage(postId, null);
        let items = page.items;
        for (
          let fetched = 1;
          targetCommentId &&
          page.nextCursor &&
          fetched < DEEP_LINK_MAX_PAGES &&
          !items.some((item) => item.id === targetCommentId);
          fetched += 1
        ) {
          page = await fetchCommentPage(postId, page.nextCursor);
          items = mergeComments(items, page.items);
        }
        if (cancelled) return;
        setComments(items);
        setTotal(page.total);
        setNextCursor(page.nextCursor);
        setStatus("ready");
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [postId, targetCommentId, reloadKey]);

  useEffect(() => {
    if (status !== "ready" || !targetCommentId || handledTargetRef.current === targetCommentId) {
      return;
    }
    handledTargetRef.current = targetCommentId;
    if (comments.some((comment) => comment.id === targetCommentId)) {
      flash(targetCommentId, "center");
    }
  }, [comments, flash, status, targetCommentId]);

  useEffect(() => {
    if (!scrollRequest) return;
    document
      .getElementById(`comment-${scrollRequest.id}`)
      ?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: scrollRequest.block });
    setScrollRequest(null);
  }, [reduceMotion, scrollRequest]);

  useEffect(() => {
    if (replyingToId) {
      window.requestAnimationFrame(() => {
        const element = replyInputRef.current;
        if (!element) return;
        element.focus();
        element.setSelectionRange(element.value.length, element.value.length);
      });
    }
  }, [replyingToId]);

  const threads = useMemo(() => buildCommentTree(comments), [comments]);
  const commentsById = useMemo(
    () => new Map(comments.map((comment) => [comment.id, comment])),
    [comments]
  );

  const requireSession = (message: string) => {
    if (session?.user) return true;
    toast.error(message);
    router.push("/login");
    return false;
  };

  const handleRequestError = (error: unknown, fallback: string) => {
    toast.error(getClientErrorMessage(error, fallback));
    if (isAuthenticationError(error)) router.push("/login");
  };

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await fetchCommentPage(postId, nextCursor);
      setComments((prev) => mergeComments(prev, page.items));
      setNextCursor(page.nextCursor);
      setTotal(page.total);
    } catch {
      toast.error("Yorumlar yüklenemedi.");
    } finally {
      setLoadingMore(false);
    }
  };

  const submitComment = async (parentId: string | null) => {
    if (!requireSession("Yorum yapmak için giriş yapman gerekiyor.")) return;
    const text = (parentId ? replyText : commentText).trim();
    if (!text || submitting) return;

    setSubmitting(parentId ? "reply" : "root");
    try {
      const created = await requestJson<CommentData>(
        `/api/posts/${postId}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: text, parentId }),
        },
        "Yorum eklenemedi."
      );
      setComments((prev) => mergeComments(prev, [created]));
      setTotal((prev) => prev + 1);
      if (parentId) {
        setReplyText("");
        setReplyingToId(null);
        flash(created.id, "nearest");
      } else {
        setCommentText("");
        flash(created.id, "nearest");
      }
    } catch (error) {
      handleRequestError(error, "Yorum eklenemedi.");
    } finally {
      setSubmitting(null);
    }
  };

  const updateLike = (id: string, update: (comment: CommentData) => Partial<CommentData>) =>
    setComments((prev) =>
      prev.map((comment) => (comment.id === id ? { ...comment, ...update(comment) } : comment))
    );

  const toggleLike = async (comment: CommentData) => {
    if (!requireSession("Beğenmek için giriş yapman gerekiyor.")) return;
    if (pendingLikesRef.current.has(comment.id)) return;
    pendingLikesRef.current.add(comment.id);

    const flip = (current: CommentData) => ({
      likedByMe: !current.likedByMe,
      likeCount: Math.max(0, current.likeCount + (current.likedByMe ? -1 : 1)),
    });
    updateLike(comment.id, flip);

    try {
      const data = await requestJson<{ count: number; liked: boolean }>(
        `/api/posts/${postId}/comments/${comment.id}/likes`,
        { method: "POST" },
        "Beğeni güncellenemedi."
      );
      updateLike(comment.id, () => ({ likedByMe: data.liked, likeCount: data.count }));
    } catch (error) {
      updateLike(comment.id, flip);
      handleRequestError(error, "Beğeni güncellenemedi.");
    } finally {
      pendingLikesRef.current.delete(comment.id);
    }
  };

  const toggleReply = (comment: CommentData) => {
    if (!requireSession("Yanıt yazmak için giriş yapman gerekiyor.")) return;
    if (replyingToId === comment.id) {
      setReplyingToId(null);
      setReplyText("");
      return;
    }
    setReplyingToId(comment.id);
    setReplyText(
      comment.user.username && comment.user.id !== currentUserId ? `@${comment.user.username} ` : ""
    );
  };

  const confirmDelete = async () => {
    const target = deleteTarget;
    if (!target) return;
    setDeleteTarget(null);
    setDeletingId(target.id);
    try {
      await requestJson<{ success: boolean }>(
        `/api/posts/${postId}/comments/${target.id}`,
        { method: "DELETE" },
        "Yorum silinemedi."
      );
      const branchIds = collectCommentBranchIds(comments, target.id);
      setComments((prev) => prev.filter((comment) => !branchIds.has(comment.id)));
      setTotal((prev) => Math.max(0, prev - branchIds.size));
      if (replyingToId && branchIds.has(replyingToId)) {
        setReplyingToId(null);
        setReplyText("");
      }
      toast.success("Yorum silindi");
    } catch (error) {
      handleRequestError(error, "Yorum silinemedi.");
    } finally {
      setDeletingId(null);
    }
  };

  const ctx: CommentThreadContext = {
    postId,
    postAuthorId,
    currentUserId,
    viewerName,
    canModerate: isOwnPost,
    highlightedId,
    replyingToId,
    replyText,
    isSubmittingReply: submitting === "reply",
    deletingId,
    commentsById,
    replyInputRef,
    onReplyTextChange: setReplyText,
    onToggleReply: toggleReply,
    onSubmitReply: (parentId) => void submitComment(parentId),
    onLike: (comment) => void toggleLike(comment),
    onDelete: setDeleteTarget,
  };

  const deleteHasReplies = deleteTarget
    ? comments.some((comment) => comment.parentId === deleteTarget.id)
    : false;

  return (
    /* LAYOUT: Heading + total → composer (or sign-in prompt) → newest threads → "Daha Fazla Yorum". */
    <section id="comments" className="mt-10 scroll-mt-24" aria-labelledby="comments-heading">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 ring-1 ring-accent/20">
          <ChatCircleIcon size={18} className="text-accent" aria-hidden />
        </div>
        <div className="flex items-baseline gap-2">
          <h2 id="comments-heading" className="text-base font-semibold text-[var(--text-contrast)]">
            Yorumlar
          </h2>
          {total > 0 && <span className="dn-mono text-sm text-[var(--text-muted)]">{total}</span>}
        </div>
      </div>

      {session?.user ? (
        <div className="mb-8 flex gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent/10 ring-1 ring-accent/20">
            <AvatarImage
              src={null}
              alt={viewerName ?? ""}
              name={viewerName ?? "?"}
              size={36}
              className="h-full w-full object-cover"
              textClassName="text-xs font-bold text-accent"
            />
          </div>
          <div className="min-w-0 flex-1">
            <MentionTextarea
              postId={postId}
              value={commentText}
              onChange={setCommentText}
              onSubmit={() => void submitComment(null)}
              placeholder="Düşüncelerini paylaş, @ ile birini etiketle..."
              ariaLabel="Yorum yaz"
              rows={3}
              className={textareaClass}
            />
            <div className="mt-2.5 flex items-center justify-between gap-3">
              <span className="text-[12px] font-medium text-[var(--text-muted)]">
                {commentText.length > 0 ? (
                  <span className="dn-mono">{commentText.length}/1000</span>
                ) : (
                  "Göndermek için ⌘/Ctrl + Enter"
                )}
              </span>
              <button
                type="button"
                onClick={() => void submitComment(null)}
                disabled={submitting === "root" || !commentText.trim()}
                className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full bg-accent px-4 text-xs font-semibold text-[var(--text-on-accent)] transition-colors duration-200 hover:bg-accent-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {submitting === "root" ? (
                  <CircleNotchIcon size={14} className="animate-spin" aria-hidden />
                ) : (
                  <PaperPlaneRightIcon size={14} weight="bold" aria-hidden />
                )}
                {submitting === "root" ? "Gönderiliyor..." : "Gönder"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-8 flex items-center justify-between gap-3 rounded-2xl bg-[var(--surface-strong)] px-5 py-4 ring-1 ring-[var(--surface-strong-border)]">
          <p className="text-sm text-[var(--text-dim)]">Yorum yapmak için giriş yap</p>
          <Link
            href="/login"
            className="rounded-full bg-accent/10 px-4 py-1.5 text-xs font-medium text-accent ring-1 ring-accent/20 transition-colors hover:bg-accent/20"
          >
            Giriş Yap
          </Link>
        </div>
      )}

      {status === "loading" && (
        <div className="space-y-4" aria-busy="true" aria-label="Yorumlar yükleniyor">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex gap-3 p-4">
              <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-[var(--bg-raised)]" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-32 animate-pulse rounded bg-[var(--bg-raised)]" />
                <div className="h-3 w-full animate-pulse rounded bg-[var(--bg-raised)]" />
                <div className="h-3 w-2/3 animate-pulse rounded bg-[var(--bg-raised)]" />
              </div>
            </div>
          ))}
        </div>
      )}

      {status === "error" && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-danger/20 bg-danger/5 px-5 py-4">
          <p className="text-sm text-[var(--text-secondary)]">Yorumlar yüklenemedi.</p>
          <button
            type="button"
            onClick={() => setReloadKey((key) => key + 1)}
            className="h-8 cursor-pointer rounded-full border border-[var(--border)] px-4 text-xs font-semibold text-[var(--text-secondary)] transition-colors hover:border-[var(--text-faint)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          >
            Tekrar Dene
          </button>
        </div>
      )}

      {status === "ready" && threads.length === 0 && (
        <div className="flex flex-col items-center py-12 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--surface-strong)] ring-1 ring-[var(--surface-strong-border)]">
            <ChatCircleIcon size={24} className="text-[var(--text-muted)]" aria-hidden />
          </div>
          <p className="text-sm text-[var(--text-dim)]">Henüz yorum yok</p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            {isOwnPost ? "Diğer kullanıcıların yorumları burada görünecek" : "İlk yorumu sen bırak"}
          </p>
        </div>
      )}

      {status === "ready" && threads.length > 0 && (
        <div className="space-y-3">
          {threads.map((comment) => (
            <CommentItem key={comment.id} comment={comment} ctx={ctx} />
          ))}
        </div>
      )}

      {status === "ready" && nextCursor && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => void loadMore()}
            disabled={loadingMore}
            className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-card)] px-5 text-[13px] font-semibold text-[var(--text-secondary)] transition-colors duration-200 hover:border-accent/40 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingMore && <CircleNotchIcon size={14} className="animate-spin" aria-hidden />}
            {loadingMore ? "Yükleniyor..." : "Daha Fazla Yorum"}
          </button>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
        title={
          deleteTarget && deleteTarget.user.id !== currentUserId ? "Yorumu Kaldır" : "Yorumu Sil"
        }
        message={
          deleteHasReplies
            ? "Bu yorum ve altındaki yanıtlar kalıcı olarak silinecek. Bu işlem geri alınamaz."
            : "Bu yorum kalıcı olarak silinecek. Bu işlem geri alınamaz."
        }
      />
    </section>
  );
}
