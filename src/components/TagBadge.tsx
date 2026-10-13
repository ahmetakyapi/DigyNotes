"use client";

import Link from "next/link";
import { XIcon } from "@phosphor-icons/react";
import { Tag } from "@/types";

interface TagBadgeProps {
  tag: Tag;
  onClick?: (name: string) => void;
  onRemove?: (name: string) => void;
  active?: boolean;
  href?: string;
}

export default function TagBadge({ tag, onClick, onRemove, active, href }: TagBadgeProps) {
  const className = `inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium transition-colors ${
    onClick || href ? "cursor-pointer" : ""
  } ${
    active
      ? "border border-accent/50 bg-accent/20 text-accent"
      : "border border-[var(--border)] bg-[var(--bg-raised)] text-[var(--text-secondary)] hover:border-accent/40 hover:text-accent"
  }`;

  const content = (
    <>
      <span className="text-accent/60">#</span>
      {tag.name}
    </>
  );

  if (onRemove) {
    return (
      <span className={className} onClick={() => onClick?.(tag.name)}>
        {content}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(tag.name);
          }}
          className="-mr-0.5 ml-0.5 inline-flex h-4 w-4 cursor-pointer items-center justify-center rounded-full text-[var(--text-muted)] transition-colors hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          aria-label={`${tag.name} etiketini kaldır`}
        >
          <XIcon size={10} weight="bold" aria-hidden />
        </button>
      </span>
    );
  }

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" className={className} onClick={() => onClick(tag.name)}>
        {content}
      </button>
    );
  }

  return <span className={className}>{content}</span>;
}
