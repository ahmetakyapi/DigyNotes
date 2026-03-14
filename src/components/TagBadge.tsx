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
      ? "border border-[#6366f1]/50 bg-[#6366f1]/20 text-[#6366f1]"
      : "border border-[var(--border)] bg-[var(--bg-raised)] text-[var(--text-secondary)] hover:border-[#6366f1]/40 hover:text-[#6366f1]"
  }`;

  const content = (
    <>
      <span className="text-[#6366f1]/60">#</span>
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
          className="ml-0.5 leading-none text-[var(--text-muted)] transition-colors hover:text-[#e53e3e]"
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
