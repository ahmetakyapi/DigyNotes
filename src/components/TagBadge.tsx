"use client";

import Link from "next/link";
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
          className="ml-0.5 leading-none text-[var(--text-muted)] transition-colors hover:text-danger"
          aria-label={`${tag.name} etiketini kaldır`}
        >
          ×
        </button>
      </span>
    );
  }

  if (href) {
    return <Link href={href} className={className}>{content}</Link>;
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
