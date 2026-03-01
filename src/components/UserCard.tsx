import Link from "next/link";
import { AvatarImage } from "@/components/AvatarImage";

interface UserCardProps {
  user: {
    id: string;
    name: string;
    username: string | null;
    bio: string | null;
    avatarUrl: string | null;
    lastSeenAt: string | null;
    postCount: number;
  };
}

export default function UserCard({ user }: UserCardProps) {
  const href = user.username ? `/profile/${user.username}` : "#";
  const hasProfile = Boolean(user.username);
  const lastSeenLabel = user.lastSeenAt
    ? new Date(user.lastSeenAt).toLocaleString("tr-TR", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;
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
            textClassName="text-xl font-semibold text-[#c4a24b]"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-[var(--text-primary)] transition-colors group-hover:text-[#c4a24b]">
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

      <div className="mt-4 flex flex-col items-start gap-2 border-t border-[var(--border)] pt-4 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <span className="inline-flex rounded-full border border-[var(--border)] bg-[var(--bg-base)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)]">
          <span className="mr-1 text-[var(--gold)]">{user.postCount}</span>
          Not
        </span>
        {lastSeenLabel && (
          <span className="bg-[#c4a24b]/8 inline-flex overflow-hidden rounded-full border border-[#c4a24b]/20 text-[11px]">
            <span className="border-[#c4a24b]/18 border-r px-2.5 py-1.5 font-medium text-[var(--text-faint)]">
              Son Giriş
            </span>
            <span className="px-3 py-1.5 font-medium text-[var(--gold)]">{lastSeenLabel}</span>
          </span>
        )}
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-[var(--text-faint)]">
        <span>Profili açıp arşivi incele</span>
        <span className="font-medium text-[var(--gold)]">Git →</span>
      </div>
    </>
  );

  if (hasProfile) {
    return (
      <Link
        href={href}
        className="hover:border-[#c4a24b]/24 group block rounded-[26px] border border-[var(--border)] bg-[linear-gradient(180deg,rgba(18,26,45,0.94),rgba(11,18,32,0.92))] p-5 shadow-[var(--shadow-soft)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[var(--shadow-card)]"
      >
        {content}
      </Link>
    );
  }

  return (
    <article className="rounded-[26px] border border-[var(--border)] bg-[linear-gradient(180deg,rgba(18,26,45,0.94),rgba(11,18,32,0.92))] p-5 shadow-[var(--shadow-soft)]">
      {content}
    </article>
  );
}
