import Link from "next/link";
import Image from "next/image";

interface UserCardProps {
  user: {
    id: string;
    name: string;
    username: string | null;
    bio: string | null;
    avatarUrl: string | null;
    postCount: number;
  };
}

export default function UserCard({ user }: UserCardProps) {
  const href = user.username ? `/profile/${user.username}` : "#";

  return (
    <Link
      href={href}
      className="group block rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 transition-all hover:border-[#c4a24b]/40"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--border)] bg-[var(--bg-raised)]">
          {user.avatarUrl ? (
            <Image
              src={user.avatarUrl}
              alt={user.name}
              width={48}
              height={48}
              className="h-full w-full object-cover"
              unoptimized
            />
          ) : (
            <span className="text-lg font-semibold text-[#c4a24b]">
              {user.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-[var(--text-primary)] transition-colors group-hover:text-[#c4a24b]">
            {user.name}
          </p>
          {user.username && <p className="text-xs text-[var(--text-muted)]">@{user.username}</p>}
          {user.bio && <p className="mt-1 line-clamp-2 text-xs text-[var(--text-secondary)]">{user.bio}</p>}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1.5 border-t border-[var(--border)] pt-3">
        <span className="text-xs font-medium text-[#c4a24b]">{user.postCount}</span>
        <span className="text-xs text-[var(--text-muted)]">not</span>
      </div>
    </Link>
  );
}
