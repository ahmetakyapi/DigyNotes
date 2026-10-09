"use client";
import { useEffect, useState } from "react";
import { Wordmark } from "@/components/Wordmark";

interface Props {
  show: boolean;
  message?: string;
}

/* LAYOUT: Full-viewport ink curtain.
   CENTER: typographic wordmark, a hairline track with a sweeping accent segment below it,
           mono status message. Fades out over 700ms when `show` turns false. */
export function FullScreenLoader({ show, message = "Notlarınız yükleniyor" }: Props) {
  const [mounted, setMounted] = useState(show);

  useEffect(() => {
    if (show) {
      setMounted(true);
    } else {
      const t = setTimeout(() => setMounted(false), 700);
      return () => clearTimeout(t);
    }
  }, [show]);

  if (!mounted) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[var(--bg-base)] transition-opacity duration-700 ease-out-expo ${
        show ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <Wordmark size="lg" />
      <div className="relative mt-6 h-px w-40 overflow-hidden bg-[var(--border)]">
        <span className="dn-loader-sweep absolute inset-y-0 left-0 w-1/3 bg-[var(--gold)]" />
      </div>
      <p className="dn-mono mt-5 text-[10.5px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
        {message}
      </p>
    </div>
  );
}
