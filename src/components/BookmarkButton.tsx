"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { BookmarkSimpleIcon } from "@phosphor-icons/react";
import toast from "react-hot-toast";
import { ActionTooltip } from "@/components/ActionTooltip";
import { getClientErrorMessage, isAuthenticationError, requestJson } from "@/lib/client-api";
import { ORGANIZATION_SURFACES } from "@/lib/organization";

interface BookmarkButtonProps {
  postId: string;
  ownerId?: string | null;
  /** Known state (e.g. from the feed API): skips the per-button status request. */
  initialBookmarked?: boolean;
  showLabel?: boolean;
  className?: string;
}

export function BookmarkButton({
  postId,
  ownerId = null,
  initialBookmarked,
  showLabel = false,
  className = "",
}: BookmarkButtonProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const currentUserId = session?.user ? (session.user as { id: string }).id : null;
  const [bookmarked, setBookmarked] = useState(initialBookmarked ?? false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (
      initialBookmarked !== undefined ||
      status !== "authenticated" ||
      !currentUserId ||
      currentUserId === ownerId
    ) {
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
  }, [currentUserId, initialBookmarked, ownerId, postId, status]);

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

      if (nextState) {
        toast.success(
          (t) => (
            <span className="flex items-center gap-3">
              <span>Kaydettiklerine eklendi</span>
              <Link
                href={ORGANIZATION_SURFACES.bookmarks.href}
                onClick={() => toast.dismiss(t.id)}
                className="shrink-0 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-[12.5px] font-semibold text-accent transition-colors hover:bg-accent/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              >
                Görüntüle
              </Link>
            </span>
          ),
          { duration: 5000 }
        );
      } else {
        toast.success("Kaydettiklerinden çıkarıldı");
      }
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

  const tooltipLabel = bookmarked ? "Kaydettiklerinden çıkar" : "Kaydettiklerine ekle";

  return (
    <ActionTooltip label={tooltipLabel}>
      <button
        type="button"
        onClick={handleToggle}
        disabled={loading}
        aria-label={tooltipLabel}
        aria-pressed={bookmarked}
        title={tooltipLabel}
        className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all duration-200 active:scale-95 disabled:opacity-50 ${
          bookmarked
            ? "border-accent/40 bg-accent/10 text-accent-light"
            : "border-[var(--surface-strong-border)] bg-[var(--surface-strong)] text-[var(--text-dim)] hover:border-accent/30 hover:text-accent-light"
        } ${className}`}
      >
        <BookmarkSimpleIcon size={16} weight={bookmarked ? "fill" : "regular"} />
        {showLabel && <span>{bookmarked ? "Kaydedildi" : "Kaydet"}</span>}
      </button>
    </ActionTooltip>
  );
}
