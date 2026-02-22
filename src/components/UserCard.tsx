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
      className="block bg-[#161616] border border-[#2a2a2a] rounded-xl p-4 hover:border-[#c9a84c]/40 transition-all group"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-12 h-12 rounded-full overflow-hidden bg-[#1e1e1e] border border-[#2a2a2a] flex items-center justify-center">
          {user.avatarUrl ? (
            <Image
              src={user.avatarUrl}
              alt={user.name}
              width={48}
              height={48}
              className="w-full h-full object-cover"
              unoptimized
            />
          ) : (
            <span className="text-[#c9a84c] font-semibold text-lg">
              {user.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[#f0ede8] font-medium text-sm group-hover:text-[#c9a84c] transition-colors truncate">
            {user.name}
          </p>
          {user.username && (
            <p className="text-[#555555] text-xs">@{user.username}</p>
          )}
          {user.bio && (
            <p className="text-[#888888] text-xs mt-1 line-clamp-2">{user.bio}</p>
          )}
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-[#2a2a2a] flex items-center gap-1.5">
        <span className="text-[#c9a84c] text-xs font-medium">{user.postCount}</span>
        <span className="text-[#555555] text-xs">not</span>
      </div>
    </Link>
  );
}
