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
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium transition-colors ${
        onClick ? "cursor-pointer" : ""
      } ${
        active
          ? "bg-[#c9a84c]/20 text-[#c9a84c] border border-[#c9a84c]/50"
          : "bg-[#1e1e1e] text-[#888888] border border-[#2a2a2a] hover:border-[#c9a84c]/40 hover:text-[#c9a84c]"
      }`}
      onClick={() => onClick?.(tag.name)}
    >
      <span className="text-[#c9a84c]/60">#</span>
      {tag.name}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(tag.name);
          }}
          className="ml-0.5 text-[#555555] hover:text-[#e53e3e] transition-colors leading-none"
          aria-label={`${tag.name} etiketini kaldır`}
        >
          ×
        </button>
      )}
    </span>
  );
}
