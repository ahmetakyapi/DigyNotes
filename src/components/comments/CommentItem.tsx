"use client";

import type { RefObject } from "react";
import Link from "next/link";
import { ArrowBendUpLeftIcon, HeartIcon, TrashIcon } from "@phosphor-icons/react";
import { AvatarImage } from "@/components/AvatarImage";
import type { ThreadNode } from "@/lib/comment-thread";
import { formatFullDateTime, formatRelativeTime } from "@/lib/relative-time";
import { CommentText } from "./CommentText";
import { MentionTextarea } from "./MentionTextarea";
import type { CommentData } from "./types";

export type CommentNode = ThreadNode<CommentData>;

/** Everything a comment row needs from the section; one object so the tree stays readable. */
export interface CommentThreadContext {
  postId: string;
  postAuthorId: string | null;
  currentUserId: string | null;
  viewerName: string | null;
  canModerate: boolean;
  highlightedId: string | null;
  replyingToId: string | null;
  replyText: string;
  isSubmittingReply: boolean;
  deletingId: string | null;
  commentsById: Map<string, CommentData>;
  replyInputRef: RefObject<HTMLTextAreaElement>;
  onReplyTextChange: (value: string) => void;
  onToggleReply: (comment: CommentData) => void;
  onSubmitReply: (parentId: string) => void;
  onLike: (comment: CommentData) => void;
  onDelete: (comment: CommentData) => void;
}

/* Indentation stops growing after this many levels so deep threads stay readable. */
const MAX_INDENT_DEPTH = 3;

const ghostButton =
  "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full px-2.5 text-[12px] font-medium text-[var(--text-muted)] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-40";

export function CommentItem({
  comment,
  depth = 0,
  ctx,
}: {
  comment: CommentNode;
  depth?: number;
  ctx: CommentThreadContext;
}) {
  const isOwn = comment.user.id === ctx.currentUserId;
  const isAuthor = comment.user.id === ctx.postAuthorId;
  const isReplying = ctx.replyingToId === comment.id;
  const isHighlighted = ctx.highlightedId === comment.id;
  const parent = comment.parentId ? ctx.commentsById.get(comment.parentId) : null;
  const canDelete = isOwn || ctx.canModerate;
  const profileHref = comment.user.username ? `/profile/${comment.user.username}` : null;

  return (
    <div
      id={`comment-${comment.id}`}
      className={
        depth > 0 && depth <= MAX_INDENT_DEPTH
          ? "ml-4 scroll-mt-24 border-l border-[var(--border)] pl-4 sm:ml-6 sm:pl-5"
          : "scroll-mt-24"
      }
    >
      {/* LAYOUT: avatar · (name, badges, relative time / reply target) → text → heart, reply, delete → inline reply box → replies. */}
      <div
        className={`rounded-2xl p-3.5 transition-colors duration-500 sm:p-4 ${
          isHighlighted
            ? "bg-accent/[0.07] ring-1 ring-accent/30"
            : "hover:bg-[color-mix(in_srgb,var(--surface-strong)_50%,transparent)]"
        }`}
      >
        <div className="flex gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent/10 ring-1 ring-accent/20">
            <AvatarImage
              src={comment.user.avatarUrl}
              alt={comment.user.name}
              name={comment.user.name}
              size={32}
              className="h-full w-full object-cover"
              textClassName="text-[11px] font-bold text-accent"
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
              {profileHref ? (
                <Link
                  href={profileHref}
                  className="text-[13px] font-semibold text-[var(--text-contrast)] transition-colors hover:text-accent"
                >
                  {comment.user.name}
                </Link>
              ) : (
                <span className="text-[13px] font-semibold text-[var(--text-contrast)]">
                  {comment.user.name}
                </span>
              )}
              {isAuthor && (
                <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-semibold text-accent ring-1 ring-accent/20">
                  Yazar
                </span>
              )}
              {isOwn && !isAuthor && (
                <span className="rounded-full bg-[var(--surface-strong)] px-2 py-0.5 text-[11px] font-medium text-[var(--text-muted)] ring-1 ring-[var(--surface-strong-border)]">
                  Sen
                </span>
              )}
              <time
                dateTime={comment.createdAt}
                title={formatFullDateTime(comment.createdAt)}
                className="text-[12px] font-medium text-[var(--text-muted)]"
              >
                · {formatRelativeTime(comment.createdAt)}
              </time>
            </div>
            {parent?.user && (
              <p className="mt-0.5 flex items-center gap-1 text-[12px] font-medium text-[var(--text-muted)]">
                <ArrowBendUpLeftIcon size={12} weight="bold" aria-hidden />
                {parent.user.username ? `@${parent.user.username}` : parent.user.name} yanıtlandı
              </p>
            )}

            <div className="mt-1.5">
              <CommentText content={comment.content} mentions={comment.mentions} />
            </div>

            <div className="-ml-2.5 mt-1.5 flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => ctx.onLike(comment)}
                aria-pressed={comment.likedByMe}
                aria-label={
                  comment.likedByMe
                    ? `Beğeniyi geri al (${comment.likeCount} beğeni)`
                    : `Yorumu beğen (${comment.likeCount} beğeni)`
                }
                className={`${ghostButton} ${
                  comment.likedByMe
                    ? "text-danger hover:bg-danger/10"
                    : "hover:bg-[var(--surface-strong)] hover:text-danger"
                }`}
              >
                <HeartIcon size={15} weight={comment.likedByMe ? "fill" : "regular"} aria-hidden />
                {comment.likeCount > 0 && <span className="dn-mono">{comment.likeCount}</span>}
              </button>
              <button
                type="button"
                onClick={() => ctx.onToggleReply(comment)}
                aria-expanded={isReplying}
                className={`${ghostButton} hover:bg-[var(--surface-strong)] hover:text-accent`}
              >
                <ArrowBendUpLeftIcon size={14} aria-hidden />
                {isReplying ? "Vazgeç" : "Yanıtla"}
              </button>
              {canDelete && (
                <button
                  type="button"
                  onClick={() => ctx.onDelete(comment)}
                  disabled={ctx.deletingId === comment.id}
                  aria-label={isOwn ? "Yorumunu sil" : "Yorumu kaldır"}
                  className={`${ghostButton} hover:bg-danger/10 hover:text-danger`}
                >
                  <TrashIcon size={14} aria-hidden />
                  <span className="sr-only sm:not-sr-only">Sil</span>
                </button>
              )}
            </div>

            {isReplying && (
              <div className="mt-2 flex gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent/10">
                  <AvatarImage
                    src={null}
                    alt={ctx.viewerName ?? ""}
                    name={ctx.viewerName ?? "?"}
                    size={28}
                    className="h-full w-full object-cover"
                    textClassName="text-[11px] font-bold text-accent"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <MentionTextarea
                    postId={ctx.postId}
                    textareaRef={ctx.replyInputRef}
                    value={ctx.replyText}
                    onChange={ctx.onReplyTextChange}
                    onSubmit={() => ctx.onSubmitReply(comment.id)}
                    placeholder="Yanıtını yaz, @ ile birini etiketle..."
                    ariaLabel={`${comment.user.name} adlı kişiye yanıt`}
                    rows={2}
                    className="w-full resize-none rounded-xl border border-[var(--surface-strong-border)] bg-[var(--surface-strong)] px-3 py-2 text-[16px] leading-6 text-[var(--text-contrast)] placeholder-[var(--text-faint)] outline-none transition-colors duration-200 focus:border-accent/40 focus:ring-1 focus:ring-accent/20 sm:text-[13px]"
                  />
                  <div className="mt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => ctx.onToggleReply(comment)}
                      className="h-8 cursor-pointer rounded-full px-3 text-[12px] font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                    >
                      İptal
                    </button>
                    <button
                      type="button"
                      onClick={() => ctx.onSubmitReply(comment.id)}
                      disabled={ctx.isSubmittingReply || !ctx.replyText.trim()}
                      className="h-8 cursor-pointer rounded-full bg-accent px-4 text-[12px] font-semibold text-[var(--text-on-accent)] transition-colors duration-200 hover:bg-accent-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {ctx.isSubmittingReply ? "Gönderiliyor..." : "Yanıtla"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {comment.replies.length > 0 && (
        <div className="mt-1 space-y-1">
          {comment.replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} depth={depth + 1} ctx={ctx} />
          ))}
        </div>
      )}
    </div>
  );
}
