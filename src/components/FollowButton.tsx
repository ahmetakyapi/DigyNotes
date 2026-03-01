"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  getClientErrorMessage,
  isAuthenticationError,
  requestJson,
} from "@/lib/client-api";

interface Props {
  username: string;
  initialIsFollowing: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
  size?: "md" | "sm";
}

export default function FollowButton({
  username,
  initialIsFollowing,
  onFollowChange,
  size = "md",
}: Props) {
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsFollowing(initialIsFollowing);
  }, [initialIsFollowing]);

  const handleClick = async () => {
    setLoading(true);
    try {
      const method = isFollowing ? "DELETE" : "POST";
      await requestJson<{ success: boolean }>(
        "/api/follows",
        {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username }),
        },
        "Takip işlemi tamamlanamadı."
      );

      const next = !isFollowing;
      setIsFollowing(next);
      onFollowChange?.(next);
      toast.success(next ? `@${username} takip edildi` : `@${username} takipten çıkarıldı`);
    } catch (error) {
      toast.error(getClientErrorMessage(error, "Takip işlemi tamamlanamadı."));
      if (isAuthenticationError(error)) {
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const sizeClassName = size === "sm" ? "px-3 py-1.5 text-xs" : "px-5 py-2 text-sm";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={`rounded-lg border font-semibold transition-all disabled:opacity-50 ${sizeClassName} ${
        isFollowing
          ? "border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:border-[#e53e3e]/60 hover:text-[#e53e3e]"
          : "border-[#c4a24b]/60 bg-[#c4a24b]/10 text-[#c4a24b] hover:bg-[#c4a24b]/20"
      }`}
    >
      {loading ? (
        <span className="flex items-center gap-1.5">
          <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          {isFollowing ? "Bırakılıyor..." : "Takip ediliyor..."}
        </span>
      ) : isFollowing ? (
        "Takipte"
      ) : (
        "Takip Et"
      )}
    </button>
  );
}
