"use client";

import { memo, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRightIcon, ChatCircleIcon, HeartIcon } from "@phosphor-icons/react";
import { getCategoryLabel } from "@/lib/categories";
import { formatDisplaySentence, formatDisplayTitle } from "@/lib/display-text";
import { formatRelativeTime, type FeedPost } from "@/lib/feed";
import { getPostImageSrc } from "@/lib/post-image";
import { categorySupportsSpoiler } from "@/lib/post-config";
import { AvatarImage } from "@/components/AvatarImage";
import { BookmarkButton } from "@/components/BookmarkButton";
import FollowButton from "@/components/FollowButton";
import { ResilientImage } from "@/components/ResilientImage";
import StarRating from "@/components/StarRating";
import { StatusBadge } from "@/components/StatusBadge";
import TagBadge from "@/components/TagBadge";

const DATE_FORMAT = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

interface FeedCardProps {
  post: FeedPost;
  /** Show the inline follow button (popular / latest tabs, authors not followed). */
  showFollow: boolean;
  onToggleLike: (post: FeedPost) => void;
  onFollowChange: (authorId: string, isFollowing: boolean) => void;
}

/** Memoized: liking or following patches one post, so only that card re-renders. */
export const FeedCard = memo(function FeedCard({
  post,
  showFollow,
  onToggleLike,
  onFollowChange,
}: FeedCardProps) {
  const displayTitle = formatDisplayTitle(post.title);
  const displayCreator = formatDisplayTitle(post.creator);
  const displayExcerpt = formatDisplaySentence(post.excerpt);
  const author = post.user;
  const profileHref = author?.username ? `/profile/${author.username}` : null;
  const createdAt = new Date(post.createdAt);
  const likeLabel = post.likedByMe ? "Beğeniyi geri al" : "Beğen";

  return (
    /* LAYOUT: Author strip (avatar · name · chips · follow · relative time) → cover + text
       grid (one link to the note) → action row (like · comments · bookmark · open). */
    <article className="group overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--bg-card)] transition-colors duration-300 ease-out-expo hover:border-[var(--text-faint)]">
      {author && (
        <div className="flex items-center gap-3 border-b border-[var(--border)] px-5 py-3.5">
          <AuthorLink
            href={profileHref}
            className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent/15 text-sm font-bold text-accent"
          >
            <AvatarImage
              src={author.avatarUrl}
              alt={author.name}
              name={author.name}
              size={36}
              className="h-full w-full object-cover"
              textClassName="text-sm font-bold text-accent"
            />
          </AuthorLink>
          <div className="min-w-0">
            <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
              <AuthorLink
                href={profileHref}
                className="truncate text-sm font-semibold text-[var(--text-primary)] transition-colors duration-200 hover:text-[var(--gold)]"
              >
                {author.name}
              </AuthorLink>
              {post.isOwn && (
                <span className="rounded-full border border-accent-2/30 bg-accent-2/10 px-2 py-0.5 text-[11px] font-medium text-accent-2">
                  Senin Notun
                </span>
              )}
            </div>
            {author.username && (
              <span className="block truncate text-[12px] font-medium text-[var(--text-muted)]">
                @{author.username}
              </span>
            )}
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-3">
            {showFollow && author.username && (
              <FollowButton
                username={author.username}
                initialIsFollowing={post.isFollowing}
                onFollowChange={(next) => onFollowChange(author.id, next)}
                size="sm"
              />
            )}
            <time
              dateTime={post.createdAt}
              title={Number.isNaN(createdAt.getTime()) ? undefined : DATE_FORMAT.format(createdAt)}
              className="hidden text-[12px] font-medium text-[var(--text-muted)] sm:inline"
            >
              {formatRelativeTime(post.createdAt)}
            </time>
          </div>
        </div>
      )}

      <Link href={`/posts/${post.id}`} className="block p-5 pb-4">
        <div className="grid gap-5 lg:grid-cols-[240px_1fr]">
          <div className="relative h-52 overflow-hidden rounded-[18px] bg-[var(--bg-raised)]">
            <ResilientImage
              src={getPostImageSrc(post.image, post.category)}
              alt={displayTitle}
              fill
              className="object-cover transition-transform duration-[1200ms] ease-out-expo group-hover:scale-[1.06]"
              style={{ objectPosition: post.imagePosition ?? "center" }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[rgb(var(--ink-rgb)/0.82)] via-transparent to-transparent" />
            <div className="absolute left-3 top-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-accent/20 bg-ink/70 px-2.5 py-1 text-[12px] font-medium text-[var(--gold)]">
                {getCategoryLabel(post.category)}
              </span>
              {post.status && <StatusBadge status={post.status} />}
            </div>
          </div>

          <div className="min-w-0">
            <h3 className="line-clamp-2 text-lg font-bold tracking-[-0.02em] text-[var(--text-primary)] transition-colors duration-200 group-hover:text-[var(--gold)] sm:text-xl">
              {displayTitle}
            </h3>
            {post.creator && (
              <p className="mt-2 text-[12px] font-medium text-[var(--text-muted)]">
                {displayCreator}
              </p>
            )}
            {post.excerpt && !(post.hasSpoiler && categorySupportsSpoiler(post.category)) && (
              <p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--text-secondary)]">
                {displayExcerpt}
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-3">
              {post.rating > 0 && <StarRating rating={post.rating} size={12} />}
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {post.tags.slice(0, 3).map((tag) => (
                    <TagBadge key={tag.id} tag={tag} />
                  ))}
                </div>
              )}
            </div>
            <time
              dateTime={post.createdAt}
              className="mt-3 block text-[12px] font-medium text-[var(--text-muted)] sm:hidden"
            >
              {formatRelativeTime(post.createdAt)}
            </time>
          </div>
        </div>
      </Link>

      <div className="mx-5 flex items-center gap-2 border-t border-[var(--border)] py-3">
        <button
          type="button"
          onClick={() => onToggleLike(post)}
          aria-label={likeLabel}
          aria-pressed={post.likedByMe}
          title={likeLabel}
          className={`inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold transition-colors duration-200 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent/50 active:scale-95 ${
            post.likedByMe
              ? "bg-danger/10 text-danger"
              : "text-[var(--text-muted)] hover:bg-[var(--bg-raised)] hover:text-danger"
          }`}
        >
          <HeartIcon size={17} weight={post.likedByMe ? "fill" : "regular"} />
          <span className="dn-mono tabular-nums">{post.likeCount}</span>
        </button>
        <Link
          href={`/posts/${post.id}#comments`}
          aria-label={`${post.commentCount} yorum`}
          title="Yorumlar"
          className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold text-[var(--text-muted)] transition-colors duration-200 hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent/50"
        >
          <ChatCircleIcon size={17} />
          <span className="dn-mono tabular-nums">{post.commentCount}</span>
        </Link>
        <BookmarkButton
          postId={post.id}
          ownerId={author?.id ?? null}
          initialBookmarked={post.bookmarkedByMe}
          className="!rounded-full"
        />
        <Link
          href={`/posts/${post.id}`}
          className="group/open ml-auto inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold text-[var(--gold)] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent/50"
        >
          Notu Aç
          <ArrowRightIcon
            size={12}
            weight="bold"
            className="transition-transform duration-300 ease-out-expo group-hover/open:translate-x-1"
          />
        </Link>
      </div>
    </article>
  );
});

function AuthorLink({
  href,
  className,
  children,
}: Readonly<{ href: string | null; className: string; children: ReactNode }>) {
  if (!href) return <span className={className}>{children}</span>;
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
