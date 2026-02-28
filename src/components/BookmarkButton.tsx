"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { BookmarkSimple } from "@phosphor-icons/react";
import toast from "react-hot-toast";
import { ActionTooltip } from "@/components/ActionTooltip";

interface BookmarkButtonProps {
  postId: string;
  ownerId?: string | null;
  showLabel?: boolean;
  className?: string;
}

export function BookmarkButton({
  postId,
  ownerId = null,
  showLabel = false,
  className = "",
}: BookmarkButtonProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const currentUserId = session?.user ? (session.user as { id: string }).id : null;
  const [bookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status !== "authenticated" || !currentUserId || currentUserId === ownerId) {
      return;
    }

    fetch(`/api/bookmarks?postId=${encodeURIComponent(postId)}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (data && typeof data.bookmarked === "boolean") {
          setBookmarked(data.bookmarked);
        }
      })
      .catch(() => {});
  }, [currentUserId, ownerId, postId, status]);

  if (currentUserId && ownerId && currentUserId === ownerId) {
    return null;
  }

  const handleToggle = async () => {
    if (!currentUserId) {
      router.push("/login");
      return;
    }

    if (loading) return;

    const nextState = !bookmarked;
    setBookmarked(nextState);
    setLoading(true);

    try {
      const response = await fetch("/api/bookmarks", {
        method: nextState ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.error || "İşlem başarısız");
      }

      toast.success(nextState ? "Kaydedildi" : "Kayıttan kaldırıldı");
    } catch (error) {
      setBookmarked(!nextState);
      toast.error(error instanceof Error ? error.message : "İşlem başarısız");
    } finally {
      setLoading(false);
    }
  };

  const tooltipLabel = bookmarked ? "Kaydedilenlerden kaldır" : "Kaydet";

  return (
    <ActionTooltip label={tooltipLabel}>
      <button
        type="button"
        onClick={handleToggle}
        disabled={loading}
        aria-label={tooltipLabel}
        title={tooltipLabel}
        className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all duration-200 active:scale-95 disabled:opacity-50 ${
          bookmarked
            ? "border-[var(--gold)]/40 bg-[var(--gold)]/10 text-[var(--gold)]"
            : "hover:border-[var(--gold)]/30 border-[var(--surface-strong-border)] bg-[var(--surface-strong)] text-[var(--text-dim)] hover:text-[var(--gold)]"
        } ${className}`}
      >
        <BookmarkSimple size={16} weight={bookmarked ? "fill" : "regular"} />
        {showLabel && <span>{bookmarked ? "Kaydedildi" : "Kaydet"}</span>}
      </button>
    </ActionTooltip>
  );
}
