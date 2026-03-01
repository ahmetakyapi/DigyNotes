"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { BookmarkSimple } from "@phosphor-icons/react";
import toast from "react-hot-toast";
import { ActionTooltip } from "@/components/ActionTooltip";
import {
  getClientErrorMessage,
  isAuthenticationError,
  requestJson,
} from "@/lib/client-api";
import { ORGANIZATION_SURFACES } from "@/lib/organization";

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
      toast.error("Bu işlem için giriş yapman gerekiyor.");
      router.push("/login");
      return;
    }

    if (loading) return;

    const nextState = !bookmarked;
    setBookmarked(nextState);
    setLoading(true);

    try {
      await requestJson<{ bookmarked: boolean }>(
        "/api/bookmarks",
        {
          method: nextState ? "POST" : "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postId }),
        },
        `${ORGANIZATION_SURFACES.bookmarks.label} işlemi tamamlanamadı.`
      );

      toast.success(
        nextState
          ? `${ORGANIZATION_SURFACES.bookmarks.label} alanına eklendi`
          : `${ORGANIZATION_SURFACES.bookmarks.label} alanından çıkarıldı`
      );
    } catch (error) {
      setBookmarked(!nextState);
      const fallbackMessage = `${ORGANIZATION_SURFACES.bookmarks.label} işlemi tamamlanamadı.`;
      toast.error(getClientErrorMessage(error, fallbackMessage));
      if (isAuthenticationError(error)) {
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const tooltipLabel = bookmarked
    ? `${ORGANIZATION_SURFACES.bookmarks.label} alanından çıkar`
    : `${ORGANIZATION_SURFACES.bookmarks.label} alanına ekle`;

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
        {showLabel && (
          <span>
            {bookmarked
              ? `${ORGANIZATION_SURFACES.bookmarks.label}de`
              : ORGANIZATION_SURFACES.bookmarks.label}
          </span>
        )}
      </button>
    </ActionTooltip>
  );
}
