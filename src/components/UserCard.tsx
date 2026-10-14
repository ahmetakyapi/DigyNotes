"use client";

import Link from "next/link";
import { ArrowRightIcon } from "@phosphor-icons/react";
import { AvatarImage } from "@/components/AvatarImage";
import { formatFullDateTime, formatRelativeTime } from "@/lib/relative-time";

interface UserCardProps {
  user: {
    id: string;
    name: string;
    username: string | null;
    bio: string | null;
    avatarUrl: string | null;
    /** Newest published note; replaces the exact last sign-in the card used to show. */
    lastNoteAt: string | null;
    postCount: number;
  };
}

export default function UserCard({ user }: UserCardProps) {
  const href = user.username ? `/profile/${user.username}` : "#";
  const hasProfile = Boolean(user.username);
  const content = (
    <>
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-raised)]">
          <AvatarImage
            src={user.avatarUrl}
            alt={user.name}
            name={user.name}
            size={56}
            className="h-full w-full object-cover"
            textClassName="text-xl font-semibold text-accent"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-[var(--text-primary)] transition-colors group-hover:text-accent">
            {user.name}
          </p>
          {user.username && (
            <p className="mt-1 text-sm text-[var(--text-muted)]">@{user.username}</p>
          )}
          {user.bio && (
            <p className="mt-2 line-clamp-3 text-sm leading-6 text-[var(--text-secondary)]">
              {user.bio}
            </p>
          )}
        </div>
      </div>

      {/* LAYOUT: one meta row — note count pill · last note (relative) · arrow. */}
      <div className="mt-4 flex items-center gap-3 border-t border-[var(--border)] pt-4">
        <span className="inline-flex shrink-0 rounded-full border border-[var(--border)] bg-[var(--bg-base)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)]">
          <span className="mr-1 text-[var(--gold)]">{user.postCount}</span>
          Not
        </span>
        <span
          suppressHydrationWarning
          title={user.lastNoteAt ? formatFullDateTime(user.lastNoteAt) : undefined}
          className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-[var(--text-muted)]"
        >
          {user.lastNoteAt
            ? `Son not ${formatRelativeTime(user.lastNoteAt).toLocaleLowerCase("tr-TR")}`
            : "Henüz not yok"}
        </span>
        {hasProfile && (
          <ArrowRightIcon
            size={15}
            weight="bold"
            aria-hidden
            className="shrink-0 text-[var(--text-muted)] transition-all duration-300 ease-out-expo group-hover:translate-x-1 group-hover:text-[var(--gold)]"
          />
        )}
      </div>
    </>
  );

  if (hasProfile) {
    return (
      <Link
        href={href}
        className="group block rounded-[26px] border border-[var(--border)] bg-[image:var(--card-surface)] p-5 shadow-[var(--shadow-soft)] transition-all duration-200 hover:-translate-y-1 hover:border-accent/24 hover:shadow-[var(--shadow-card)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)]"
      >
        {content}
      </Link>
    );
  }

  return (
    <article className="rounded-[26px] border border-[var(--border)] bg-[image:var(--card-surface)] p-5 shadow-[var(--shadow-soft)]">
      {content}
    </article>
  );
}
