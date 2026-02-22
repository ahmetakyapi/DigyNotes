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
      className="group block rounded-xl border border-[#1a1e2e] bg-[#0d0f1a] p-4 transition-all hover:border-[#c9a84c]/40"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#1a1e2e] bg-[#111828]">
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
            <span className="text-lg font-semibold text-[#c9a84c]">
              {user.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-[#f0ede8] transition-colors group-hover:text-[#c9a84c]">
            {user.name}
          </p>
          {user.username && <p className="text-xs text-[#555555]">@{user.username}</p>}
          {user.bio && <p className="mt-1 line-clamp-2 text-xs text-[#888888]">{user.bio}</p>}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1.5 border-t border-[#1a1e2e] pt-3">
        <span className="text-xs font-medium text-[#c9a84c]">{user.postCount}</span>
        <span className="text-xs text-[#555555]">not</span>
      </div>
    </Link>
  );
}
