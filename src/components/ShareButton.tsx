"use client";
import { useState } from "react";
import { ShareNetworkIcon } from "@phosphor-icons/react";
import ShareSheet, { type SharePreview } from "@/components/ShareSheet";

interface ShareButtonProps {
  title: string;
  text?: string;
  url?: string;
  className?: string;
  size?: "sm" | "md";
  /** When provided, renders as a rectangular button with icon + label instead of a square icon button */
  label?: string;
  style?: React.CSSProperties;
  /** Link-preview card shown in the share sheet (what WhatsApp etc. will display). */
  preview?: SharePreview;
}

/**
 * Not paylaşma butonu: paylaşım penceresini açar (önizleme kartı, WhatsApp / Telegram /
 * X, bağlantıyı kopyala, kartı görsel olarak kaydet).
 */
export default function ShareButton({
  title,
  text,
  url,
  className = "",
  size = "md",
  label,
  style,
  preview,
}: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState(url ?? "");

  const openSheet = () => {
    // Share the clean note URL, without any query or hash the page picked up.
    if (!url) setShareUrl(`${window.location.origin}${window.location.pathname}`);
    setOpen(true);
  };

  const iconSize = label ? 12 : size === "sm" ? 14 : 16;
  const btnClass = size === "sm" ? "h-8 w-8 rounded-lg" : "h-9 w-9 rounded-xl sm:h-10 sm:w-10";

  return (
    <>
      {label ? (
        <button
          type="button"
          onClick={openSheet}
          title="Paylaş"
          aria-label={label}
          aria-haspopup="dialog"
          className={`flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs backdrop-blur-md transition-all duration-200 active:scale-95 ${className}`}
          style={style}
        >
          <ShareNetworkIcon size={iconSize} weight="regular" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={openSheet}
          title="Paylaş"
          aria-label="Paylaş"
          aria-haspopup="dialog"
          className={`flex items-center justify-center border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-secondary)] transition-all duration-200 hover:border-accent/30 hover:text-[var(--gold)] active:scale-95 ${btnClass} ${className}`}
          style={style}
        >
          <ShareNetworkIcon size={iconSize} weight="regular" />
        </button>
      )}
      <ShareSheet
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        text={text ?? title}
        url={url ?? shareUrl}
        preview={preview}
      />
    </>
  );
}
