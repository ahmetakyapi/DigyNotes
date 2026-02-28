"use client";

import Image from "next/image";
import Link from "next/link";
import { Collection } from "@/types";
import { formatDisplaySentence, formatDisplayTitle } from "@/lib/display-text";
import { getPostImageSrc } from "@/lib/post-image";

const customLoader = ({ src }: { src: string }) => src;

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

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
      className="group block overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] transition-all duration-200 hover:border-[#c4a24b]/35 hover:shadow-[var(--shadow-soft)]"
    >
      <div className="relative h-32 border-b border-[var(--border)] bg-[var(--bg-raised)]">
        {previewPosts.length > 0 ? (
          <div className="grid h-full grid-cols-3 gap-px bg-[var(--border)]">
            {previewPosts.map((post) => (
              <div key={post.id} className="relative h-full overflow-hidden bg-[var(--bg-raised)]">
                <Image
                  loader={customLoader}
                  src={getPostImageSrc(post.image)}
                  alt={formatDisplayTitle(post.title)}
                  fill
                  sizes="240px"
                  className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  unoptimized
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(196,162,75,0.16),_transparent_60%)] text-[11px] uppercase tracking-[0.18em] text-[var(--text-faint)]">
            Boş Koleksiyon
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[rgba(4,10,22,0.72)] to-transparent" />
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-sm font-semibold text-[var(--text-primary)] transition-colors group-hover:text-[var(--gold)]">
              {displayTitle}
            </h3>
            {collection.description && (
              <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--text-muted)]">
                {displayDescription}
              </p>
            )}
          </div>
          <span className="bg-[#c4a24b]/8 rounded-full border border-[#c4a24b]/25 px-2 py-1 text-[10px] font-semibold text-[var(--gold)]">
            {collection.postCount} not
          </span>
        </div>

        {showOwner && collection.owner && (
          <p className="text-[11px] text-[var(--text-faint)]">
            {collection.owner.name}
            {collection.owner.username ? ` · @${collection.owner.username}` : ""}
          </p>
        )}

        {previewPosts.length > 0 && (
          <div className="space-y-1.5">
            {previewPosts.map((post) => (
              <div
                key={post.id}
                className="flex items-center gap-2 text-[11px] text-[var(--text-secondary)]"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[#c4a24b]/70" />
                <span className="line-clamp-1">{formatDisplayTitle(post.title)}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between border-t border-[var(--border)] pt-3 text-[10px] text-[var(--text-faint)]">
          <span>Güncellendi {formatDate(collection.updatedAt)}</span>
          <span className="font-medium text-[var(--gold)] transition-colors group-hover:text-[var(--gold-light)]">
            Aç →
          </span>
        </div>
      </div>
    </Link>
  );
}
