"use client";
import { useState, useCallback } from "react";
import { ShareNetworkIcon, CheckIcon, Link as LinkIcon } from "@phosphor-icons/react";
import toast from "react-hot-toast";

interface ShareButtonProps {
  title: string;
  text?: string;
  url?: string;
  className?: string;
  size?: "sm" | "md";
  /** When provided, renders as a rectangular button with icon + label instead of a square icon button */
  label?: string;
  style?: React.CSSProperties;
}

/**
 * Not paylaşma butonu.
 * Mobilde Web Share API, masaüstünde clipboard'a kopyalama.
 */
export default function ShareButton({
  title,
  text,
  url,
  className = "",
  size = "md",
  label,
  style,
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl = url ?? (typeof window !== "undefined" ? window.location.href : "");

  const handleShare = useCallback(async () => {
    // Web Share API destekleniyorsa (genelde mobil)
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title,
          text: text ?? title,
          url: shareUrl,
        });
        return;
      } catch (err) {
        // User iptal etti veya API hatası — clipboard'a düş
        if ((err as Error)?.name === "AbortError") return;
      }
    }

    // Fallback: clipboard'a kopyala
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link kopyalandı");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Link kopyalanamadı");
    }
  }, [title, text, shareUrl]);

  const iconSize = label ? 12 : size === "sm" ? 14 : 16;

  if (label) {
    return (
      <button
        onClick={handleShare}
        title="Paylaş"
        className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs backdrop-blur-md transition-all duration-200 active:scale-95 ${className}`}
        style={style}
      >
        {copied ? (
          <CheckIcon size={iconSize} weight="bold" className="text-[#48bb78]" />
        ) : (
          <ShareNetworkIcon size={iconSize} weight="regular" />
        )}
        {copied ? "Kopyalandı" : label}
      </button>
    );
  }

  const btnClass = size === "sm" ? "h-8 w-8 rounded-lg" : "h-9 w-9 rounded-xl sm:h-10 sm:w-10";

  return (
    <button
      onClick={handleShare}
      title="Paylaş"
      className={`hover:border-[var(--gold)]/30 flex items-center justify-center border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-secondary)] transition-all duration-200 hover:text-[var(--gold)] active:scale-95 ${btnClass} ${className}`}
      style={style}
    >
      {copied ? (
        <CheckIcon size={iconSize} weight="bold" className="text-[#48bb78]" />
      ) : (
        <ShareNetworkIcon size={iconSize} weight="regular" />
      )}
    </button>
  );
}
