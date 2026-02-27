"use client";

import { Tag } from "@/types";

interface TagBadgeProps {
  tag: Tag;
  onClick?: (name: string) => void;
  onRemove?: (name: string) => void;
  active?: boolean;
}

export default function TagBadge({ tag, onClick, onRemove, active }: TagBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium transition-colors ${
        onClick ? "cursor-pointer" : ""
      } ${
        active
          ? "border border-[#c4a24b]/50 bg-[#c4a24b]/20 text-[#c4a24b]"
          : "border border-[var(--border)] bg-[var(--bg-raised)] text-[var(--text-secondary)] hover:border-[#c4a24b]/40 hover:text-[#c4a24b]"
      }`}
      onClick={() => onClick?.(tag.name)}
    >
      <span className="text-[#c4a24b]/60">#</span>
      {tag.name}
      {onRemove && (
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
      )}
    </span>
  );
}
