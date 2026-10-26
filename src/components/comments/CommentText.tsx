import Link from "next/link";
import { splitMentions } from "@/lib/mentions";

/** Comment text with `@username`s of real users turned into profile links (plain React, no HTML). */
export function CommentText({ content, mentions }: { content: string; mentions: string[] }) {
  const segments = mentions.length > 0 ? splitMentions(content, mentions) : null;

  return (
    <p className="whitespace-pre-wrap break-words text-[13px] leading-relaxed text-[var(--text-dim)] sm:text-sm sm:leading-5">
      {segments
        ? segments.map((segment, index) =>
            segment.type === "mention" ? (
              <Link
                key={index}
                href={`/profile/${segment.username}`}
                className="rounded-xs font-medium text-accent transition-colors hover:text-accent-light hover:underline focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent/40"
              >
                {segment.value}
              </Link>
            ) : (
              <span key={index}>{segment.value}</span>
            )
          )
        : content}
    </p>
  );
}
