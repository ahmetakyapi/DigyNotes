"use client";

/*
  LAYOUT: Share sheet — bottom sheet on phones, centred card (max-w-md) from sm up.
  TOP:     title "Notu Paylaş" + close button.
  PREVIEW: a chat-bubble mock of the link preview — the real 1200×630 share card the
           server renders (skeleton while it loads) + title, one line of description and
           the domain, i.e. what WhatsApp / iMessage will show.
  WARNING: when the note can't be opened by others (private profile, draft), a plain
           note explaining why, before any button is pressed.
  ACTIONS: WhatsApp · Telegram · X (+ Diğer = native share, where it exists), then the URL
           row with "Kopyala" and "Kartı Kaydet" (downloads the JPEG card).
  SPACING: p-5 sm:p-6, gap-4 between blocks, hairline borders.
*/
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckIcon,
  CopyIcon,
  DownloadSimpleIcon,
  LockSimpleIcon,
  ShareNetworkIcon,
  TelegramLogoIcon,
  WhatsappLogoIcon,
  XIcon,
  XLogoIcon,
} from "@phosphor-icons/react";
import toast from "react-hot-toast";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { modalBackdrop } from "@/lib/variants";
import { EASE_OUT_EXPO } from "@/components/landing/Motion";

export interface SharePreview {
  /** Same-origin URL of the share card image (`/posts/<id>/opengraph-image`). */
  image: string;
  description?: string;
  /** Why others can't open the link; shown as a notice when set. */
  warning?: string;
}

interface ShareSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  text: string;
  url: string;
  preview?: SharePreview;
}

export default function ShareSheet({ open, onClose, title, text, url, preview }: ShareSheetProps) {
  const trapRef = useFocusTrap(open);
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [imageReady, setImageReady] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCanNativeShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  useEffect(() => {
    if (!open) return;
    setImageReady(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
    // onClose is a fresh closure every render; re-binding on it would reset the image.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const message = `${text}\n${url}`;
  const host = (() => {
    try {
      return new URL(url).host;
    } catch {
      return "";
    }
  })();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Bağlantı kopyalandı");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Bağlantı kopyalanamadı");
    }
  };

  const nativeShare = async () => {
    try {
      await navigator.share({ title, text, url });
    } catch (err) {
      if ((err as Error)?.name !== "AbortError") toast.error("Paylaşım açılamadı");
    }
  };

  const saveCard = async () => {
    if (!preview) return;
    try {
      const blob = await (await fetch(preview.image)).blob();
      const file = new File([blob], `${slugify(title)}-digynotes.jpg`, { type: "image/jpeg" });
      // Phones: hand the card to the share sheet (Instagram story, WhatsApp status…).
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title, text: url });
        return;
      }
      const href = URL.createObjectURL(blob);
      const a = Object.assign(document.createElement("a"), { href, download: file.name });
      a.click();
      URL.revokeObjectURL(href);
      toast.success("Kart kaydedildi");
    } catch (err) {
      if ((err as Error)?.name !== "AbortError") toast.error("Kart kaydedilemedi");
    }
  };

  const targets = [
    {
      label: "WhatsApp",
      icon: <WhatsappLogoIcon size={22} weight="fill" />,
      href: `https://wa.me/?text=${encodeURIComponent(message)}`,
    },
    {
      label: "Telegram",
      icon: <TelegramLogoIcon size={22} weight="fill" />,
      href: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
    },
    {
      label: "X",
      icon: <XLogoIcon size={20} weight="bold" />,
      href: `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
    },
  ];

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="share-sheet-title"
        >
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={modalBackdrop}
            aria-hidden
            onMouseDown={onClose}
          />

          <motion.div
            ref={trapRef}
            className="relative flex max-h-[92svh] w-full flex-col gap-4 overflow-y-auto rounded-t-[28px] border border-[var(--border)] bg-[var(--bg-card)] p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-[var(--shadow-deep)] sm:max-w-md sm:rounded-[28px] sm:p-6"
            initial={{ y: "100%", opacity: 0.6 }}
            animate={{ y: 0, opacity: 1, transition: { duration: 0.5, ease: EASE_OUT_EXPO } }}
            exit={{ y: "100%", opacity: 0, transition: { duration: 0.25 } }}
          >
            <span
              aria-hidden
              className="mx-auto -mt-1 h-1 w-10 shrink-0 rounded-full bg-[var(--border)] sm:hidden"
            />
            <div className="flex items-center justify-between">
              <h2
                id="share-sheet-title"
                className="text-lg font-bold tracking-[-0.02em] text-[var(--text-primary)]"
              >
                Notu Paylaş
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Kapat"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-[var(--text-secondary)] transition-colors duration-200 hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)]"
              >
                <XIcon size={18} />
              </button>
            </div>

            {preview && (
              <figure className="flex flex-col gap-2">
                <figcaption className="text-[12.5px] font-medium text-[var(--text-muted)]">
                  Bağlantı sohbette böyle görünecek
                </figcaption>
                <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-raised)]">
                  <div className="relative aspect-[1200/630] w-full bg-[var(--bg-base)]">
                    {!imageReady && (
                      <span className="absolute inset-0 animate-pulse bg-[var(--bg-raised)]" />
                    )}
                    {/* eslint-disable-next-line @next/next/no-img-element -- same-origin JPEG card, already sized */}
                    <img
                      src={preview.image}
                      alt={`${title} paylaşım kartı`}
                      width={1200}
                      height={630}
                      onLoad={() => setImageReady(true)}
                      className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${imageReady ? "opacity-100" : "opacity-0"}`}
                    />
                  </div>
                  <div className="flex flex-col gap-0.5 px-3.5 py-3">
                    <p className="line-clamp-1 text-[14px] font-semibold text-[var(--text-primary)]">
                      {title}
                    </p>
                    {preview.description && (
                      <p className="line-clamp-2 text-[12.5px] leading-snug text-[var(--text-secondary)]">
                        {preview.description}
                      </p>
                    )}
                    {host && (
                      <p className="dn-mono mt-0.5 text-[11px] text-[var(--text-muted)]">{host}</p>
                    )}
                  </div>
                </div>
              </figure>
            )}

            {preview?.warning && (
              <p className="flex gap-2.5 rounded-2xl border border-accent-2/30 bg-accent-2/10 px-3.5 py-3 text-[13px] leading-snug text-[var(--text-primary)]">
                <LockSimpleIcon
                  size={16}
                  weight="bold"
                  className="mt-0.5 shrink-0 text-[var(--accent-2)]"
                />
                <span>{preview.warning}</span>
              </p>
            )}

            <div className={`grid gap-2 ${canNativeShare ? "grid-cols-4" : "grid-cols-3"}`}>
              {targets.map((t) => (
                <a
                  key={t.label}
                  href={t.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex cursor-pointer flex-col items-center gap-1.5 rounded-2xl py-2 text-[12px] font-medium text-[var(--text-secondary)] transition-colors duration-200 hover:text-[var(--text-primary)]"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-raised)] text-[var(--text-primary)] transition-[transform,border-color,color] duration-300 ease-out-expo group-hover:-translate-y-0.5 group-hover:border-accent/40 group-hover:text-[var(--gold)] group-active:scale-95">
                    {t.icon}
                  </span>
                  {t.label}
                </a>
              ))}
              {canNativeShare && (
                <button
                  type="button"
                  onClick={nativeShare}
                  className="group flex cursor-pointer flex-col items-center gap-1.5 rounded-2xl py-2 text-[12px] font-medium text-[var(--text-secondary)] transition-colors duration-200 hover:text-[var(--text-primary)]"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-raised)] text-[var(--text-primary)] transition-[transform,border-color,color] duration-300 ease-out-expo group-hover:-translate-y-0.5 group-hover:border-accent/40 group-hover:text-[var(--gold)] group-active:scale-95">
                    <ShareNetworkIcon size={20} weight="bold" />
                  </span>
                  Diğer
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-base)] py-1.5 pl-4 pr-1.5">
              <span className="dn-mono min-w-0 flex-1 truncate text-[12px] text-[var(--text-secondary)]">
                {url.replace(/^https?:\/\//, "")}
              </span>
              <button
                type="button"
                onClick={copy}
                className="flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-[var(--gold)] px-4 text-[13px] font-semibold text-[var(--text-on-accent)] transition-transform duration-200 active:scale-95"
              >
                {copied ? (
                  <CheckIcon size={14} weight="bold" />
                ) : (
                  <CopyIcon size={14} weight="bold" />
                )}
                {copied ? "Kopyalandı" : "Kopyala"}
              </button>
            </div>

            {preview && (
              <button
                type="button"
                onClick={saveCard}
                className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full border border-[var(--border)] text-[13.5px] font-medium text-[var(--text-primary)] transition-colors duration-200 hover:border-accent/40 hover:text-[var(--gold)] active:scale-[0.98]"
              >
                <DownloadSimpleIcon size={16} weight="bold" />
                Kartı Görsel Olarak Kaydet
              </button>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

function slugify(s: string) {
  return (
    s
      .toLocaleLowerCase("tr-TR")
      .replace(/[çğıöşü]/g, (c) => ({ ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u" })[c] ?? c)
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "not"
  );
}
