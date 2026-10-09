"use client";

import Link from "next/link";
import { ArrowUpRightIcon } from "@phosphor-icons/react";
import { Collection } from "@/types";
import { formatDisplaySentence, formatDisplayTitle } from "@/lib/display-text";
import { getPostImageSrc } from "@/lib/post-image";
import { ResilientImage } from "@/components/ResilientImage";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/*
  LAYOUT: Cinematic collection cover.
  TOP: poster mosaic (up to 3 posters, hairline gutters) filling a 4:3-ish frame, fading into
       the card surface at the bottom; mono count pill pinned top-right.
  BODY: big tight grotesk title, muted description, optional owner line.
  FOOTER: hairline, mono "updated" meta + arrow that nudges on hover.
*/
export default function CollectionCard({
  collection,
  href,
  showOwner = false,
}: {
  collection: Collection;
  href: string;
  showOwner?: boolean;
}) {
  const previewPosts = collection.posts.slice(0, 3);
  const displayTitle = formatDisplayTitle(collection.title);
  const displayDescription = formatDisplaySentence(collection.description);

  return (
    <Link
      href={href}
      className="group flex h-full flex-col overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--bg-card)] transition-colors duration-500 ease-out-expo hover:border-[var(--text-faint)]"
    >
      <div className="relative h-52 overflow-hidden bg-[var(--bg-raised)]">
        {previewPosts.length > 0 ? (
          <div
            className={`grid h-full gap-px bg-[var(--border)] ${
              previewPosts.length === 1
                ? "grid-cols-1"
                : previewPosts.length === 2
                  ? "grid-cols-2"
                  : "grid-cols-[1.4fr_1fr] grid-rows-2"
            }`}
          >
            {previewPosts.map((post, index) => (
              <div
                key={post.id}
                className={`relative h-full overflow-hidden bg-[var(--bg-raised)] ${
                  previewPosts.length === 3 && index === 0 ? "row-span-2" : ""
                }`}
              >
                <ResilientImage
                  src={getPostImageSrc(post.image, post.category)}
                  alt={formatDisplayTitle(post.title)}
                  fill
                  sizes="(max-width: 768px) 60vw, 280px"
                  className="object-cover transition-transform duration-[1400ms] ease-out-expo group-hover:scale-[1.06]"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_top,rgb(var(--gold-rgb)/0.14),transparent_60%)] text-[12.5px] text-[var(--text-muted)] font-medium">
            Boş Koleksiyon
          </div>
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[var(--bg-card)] to-transparent" />
        <span className="absolute right-3 top-3 rounded-full border border-[var(--border)] bg-[var(--bg-overlay)] px-2.5 py-1 text-[12.5px] text-[var(--text-primary)] font-medium">
          {collection.postCount} not
        </span>
      </div>

      <div className="flex flex-1 flex-col px-5 pb-5 pt-1">
        <h3 className="line-clamp-2 text-xl font-extrabold leading-tight tracking-[-0.03em] text-[var(--text-primary)]">
          {displayTitle}
        </h3>
        {collection.description && (
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--text-muted)]">
            {displayDescription}
          </p>
        )}

        {showOwner && collection.owner && (
          <p className="mt-3 text-[12.5px] text-[var(--text-muted)] font-medium">
            {collection.owner.name}
            {collection.owner.username ? ` · @${collection.owner.username}` : ""}
          </p>
        )}

        <div className="mt-auto pt-4">
          <div className="flex items-center justify-between border-t border-[var(--border)] pt-4">
            <span className="text-[12.5px] text-[var(--text-muted)] font-medium">
              Güncellendi {formatDate(collection.updatedAt)}
            </span>
            <ArrowUpRightIcon
              size={16}
              weight="bold"
              className="text-[var(--text-muted)] transition-all duration-500 ease-out-expo group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--gold)]"
            />
          </div>
        </div>
      </div>
    </Link>
  );
}
