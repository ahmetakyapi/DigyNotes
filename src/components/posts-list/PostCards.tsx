"use client";

import React from "react";
import Link from "next/link";
import type { Post } from "@/types";
import StarRating from "@/components/StarRating";
import { StatusBadge } from "@/components/StatusBadge";
import TagBadge from "@/components/TagBadge";
import { ResilientImage } from "@/components/ResilientImage";
import { getCategoryLabel } from "@/lib/categories";
import { formatDisplaySentence, formatDisplayTitle } from "@/lib/display-text";
import { getPostImageSrc } from "@/lib/post-image";
import { estimateReadingTime, formatReadingTime } from "@/lib/reading-time";
import { shouldHideExcerpt } from "./posts-list-utils";

/* ── Shared date + reading-time display ── */

function PostMeta({ post }: { readonly post: Post }) {
  const rt = formatReadingTime(estimateReadingTime(post.content));
  return (
    <span className="text-[10px] text-[var(--text-muted)]">
      {rt ? `${rt} · ${post.date}` : post.date}
    </span>
  );
}

/* ── Featured card (hero, grid-only, no search) ── */

export function FeaturedCard({
  post,
  activeTab,
}: {
  readonly post: Post;
  readonly activeTab: "notlar" | "kaydedilenler";
}) {
  return (
    <Link href={`/posts/${post.id}`} className="group mb-4 block">
      <article className="relative h-[260px] overflow-hidden rounded-2xl border border-[var(--border)] transition-all duration-500 hover:border-[#10b981]/40 hover:shadow-[0_16px_56px_rgba(16,185,129,0.12)] sm:h-[340px] lg:h-[420px]">
        <ResilientImage
          src={getPostImageSrc(post.image, post.category)}
          alt={post.title}
          fill
          sizes="(max-width: 768px) 100vw, 1024px"
          className="object-cover transition-transform duration-700 group-hover:scale-[1.025]"
          priority
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, var(--media-overlay-soft) 0%, var(--media-overlay-mid) 55%, var(--media-overlay-strong) 100%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(120deg, var(--media-panel-sheen) 0%, transparent 40%, transparent 75%, var(--media-panel-sheen) 100%)",
          }}
        />

        <div className="absolute left-5 top-5 flex items-center gap-2">
          <span
            className="rounded-full border border-[#10b981]/20 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--gold)] backdrop-blur-md"
            style={{ backgroundColor: "var(--bg-overlay)" }}
          >
            {activeTab === "kaydedilenler" ? "Kaydedilen" : "Öne Çıkan"}
          </span>
          {post.status && <StatusBadge status={post.status} />}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-7 lg:p-9">
          <div className="mb-3 flex items-center gap-2.5">
            <span className="rounded-sm bg-[var(--gold)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-on-accent)]">
              {getCategoryLabel(post.category)}
            </span>
            {post.years && (
              <span className="text-sm text-[var(--media-text-secondary)]">{post.years}</span>
            )}
          </div>
          <h2 className="mb-2 text-2xl font-bold leading-tight text-[var(--media-text-primary)] transition-colors duration-300 group-hover:text-[var(--gold)] sm:text-3xl lg:text-4xl">
            {formatDisplayTitle(post.title)}
          </h2>
          {post.creator && (
            <p className="mb-4 text-sm text-[var(--media-text-secondary)]">
              {formatDisplayTitle(post.creator)}
            </p>
          )}
          <div className="flex items-center gap-3">
            <StarRating rating={post.rating} size={14} />
            {post.rating > 0 && (
              <span className="text-xs text-[var(--media-text-secondary)]">{post.rating}/5</span>
            )}
            <span className="ml-auto text-xs text-[var(--media-text-secondary)]">{post.date}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}

/* ── Grid card ── */

export function PostGridCard({
  post,
  index,
  showIndex,
  activeTags,
  onToggleTag,
}: {
  readonly post: Post;
  readonly index: number;
  readonly showIndex: boolean;
  readonly activeTags: readonly string[];
  readonly onToggleTag: (name: string) => void;
}) {
  const displayTitle = formatDisplayTitle(post.title);
  const displayCreator = formatDisplayTitle(post.creator);
  const displayExcerpt = formatDisplaySentence(post.excerpt);

  return (
    <Link href={`/posts/${post.id}`} className="group block">
      <article className="flex h-full flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-card)] transition-all duration-300 hover:border-[#10b981]/30 hover:shadow-[0_4px_24px_rgba(16,185,129,0.08)] sm:flex-row">
        {showIndex && (
          <div className="flex h-9 flex-shrink-0 items-center justify-center border-b border-[var(--border)] sm:h-auto sm:w-9 sm:border-b-0 sm:border-r">
            <span className="text-[10px] font-bold tabular-nums text-[var(--text-muted)] transition-colors group-hover:text-[#10b981]/60">
              {String(index + 2).padStart(2, "0")}
            </span>
          </div>
        )}

        <div className="relative h-48 min-h-[148px] flex-shrink-0 sm:h-auto sm:min-h-[160px] sm:w-[34%]">
          <ResilientImage
            src={getPostImageSrc(post.image, post.category)}
            alt={displayTitle}
            fill
            variant="wide"
            sizes="(max-width: 768px) 36vw, 200px"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
          <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[var(--image-edge-fade)] to-transparent sm:inset-y-0 sm:left-auto sm:right-0 sm:h-auto sm:w-8 sm:bg-gradient-to-l" />
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-between p-3.5 sm:p-4">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
              <span className="flex-shrink-0 rounded-sm border border-[#10b981]/25 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--gold)]">
                {getCategoryLabel(post.category)}
              </span>
              {post.years && (
                <span className="text-[11px] text-[var(--text-muted)]">{post.years}</span>
              )}
              {post.status && <StatusBadge status={post.status} />}
            </div>

            <h2 className="mb-1 line-clamp-2 text-[15px] font-bold leading-snug text-[var(--text-primary)] transition-colors duration-200 group-hover:text-[var(--gold)] sm:text-base">
              {displayTitle}
            </h2>

            {post.creator && (
              <p className="mb-1.5 text-xs text-[var(--text-muted)]">{displayCreator}</p>
            )}

            {post.tags && post.tags.length > 0 && (
              // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
              <div className="mb-1.5 flex flex-wrap gap-1" onClick={(e) => e.preventDefault()}>
                {post.tags.slice(0, 3).map((tag) => (
                  <TagBadge
                    key={tag.id}
                    tag={tag}
                    active={activeTags.includes(tag.name)}
                    onClick={onToggleTag}
                  />
                ))}
                {post.tags.length > 3 && (
                  <span className="self-center text-[10px] text-[var(--text-muted)]">
                    +{post.tags.length - 3}
                  </span>
                )}
              </div>
            )}

            {!shouldHideExcerpt(post) && (
              <p className="line-clamp-2 text-xs leading-relaxed text-[var(--text-muted)]">
                {displayExcerpt}
              </p>
            )}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-[var(--border)] pt-2.5">
            <StarRating rating={post.rating} size={11} />
            <PostMeta post={post} />
          </div>
        </div>
      </article>
    </Link>
  );
}

/* ── List card ── */

export function PostListCard({
  post,
  activeTags,
  onToggleTag,
}: {
  readonly post: Post;
  readonly activeTags: readonly string[];
  readonly onToggleTag: (name: string) => void;
}) {
  const displayTitle = formatDisplayTitle(post.title);
  const displayCreator = formatDisplayTitle(post.creator);
  const displayExcerpt = formatDisplaySentence(post.excerpt);

  return (
    <Link href={`/posts/${post.id}`} className="group block">
      <article className="flex items-center gap-3 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-3 transition-all duration-300 hover:border-[#10b981]/30 hover:shadow-[0_4px_24px_rgba(16,185,129,0.08)] sm:px-4">
        <div className="relative h-20 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-[var(--border)]">
          <ResilientImage
            src={getPostImageSrc(post.image, post.category)}
            alt={displayTitle}
            fill
            variant="tall"
            sizes="64px"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-1.5">
            <span className="rounded-sm border border-[#10b981]/25 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--gold)]">
              {getCategoryLabel(post.category)}
            </span>
            {post.years && (
              <span className="text-[11px] text-[var(--text-muted)]">{post.years}</span>
            )}
            {post.status && <StatusBadge status={post.status} />}
          </div>

          <h2 className="line-clamp-1 text-sm font-bold text-[var(--text-primary)] transition-colors duration-200 group-hover:text-[var(--gold)] sm:text-[15px]">
            {displayTitle}
          </h2>

          <p className="mt-1 line-clamp-1 text-xs text-[var(--text-muted)]">
            {[displayCreator, shouldHideExcerpt(post) ? null : displayExcerpt]
              .filter(Boolean)
              .join(" • ")}
          </p>

          <div className="mt-2 flex items-center justify-between gap-3">
            <StarRating rating={post.rating} size={10} />
            <PostMeta post={post} />
          </div>
        </div>
      </article>
    </Link>
  );
}
