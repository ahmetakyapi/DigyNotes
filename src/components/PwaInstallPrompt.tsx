"use client";

import { useEffect, useMemo, useState } from "react";

interface DeferredBeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const PWA_DISMISS_KEY = "dn_pwa_prompt_dismissed_at";
const DISMISS_TTL = 7 * 24 * 60 * 60 * 1000;

function isStandaloneMode() {
  if (typeof window === "undefined") return false;

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<DeferredBeforeInstallPromptEvent | null>(
    null
  );
  const [dismissedAt, setDismissedAt] = useState<number | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const saved = window.localStorage.getItem(PWA_DISMISS_KEY);
      if (saved) setDismissedAt(Number(saved));
    } catch {
      setDismissedAt(null);
    }

    setInstalled(isStandaloneMode());

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as DeferredBeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
      try {
        window.localStorage.removeItem(PWA_DISMISS_KEY);
      } catch {
        // noop
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const isDismissed = useMemo(() => {
    if (!dismissedAt) return false;
    return Date.now() - dismissedAt < DISMISS_TTL;
  }, [dismissedAt]);

  const hidePrompt = installed || !deferredPrompt || isDismissed;

  const handleDismiss = () => {
    const now = Date.now();
    setDismissedAt(now);
    try {
      window.localStorage.setItem(PWA_DISMISS_KEY, String(now));
    } catch {
      // noop
    }
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setDeferredPrompt(null);
        return;
      }
    } catch {
      // noop
    }
  };

  if (hidePrompt) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[70] flex justify-center px-4">
      <div className="border-[#c4a24b]/24 bg-[var(--bg-card)]/94 pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl border px-4 py-3 shadow-[0_18px_48px_rgba(3,8,20,0.38)] backdrop-blur-xl">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border border-[#c4a24b]/25 bg-[#c4a24b]/10 text-[var(--gold)]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              d="M12 16V4m0 0-4 4m4-4 4 4M4 14v3a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-3"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[var(--text-primary)]">Ana ekrana ekle</p>
          <p className="mt-0.5 text-xs leading-5 text-[var(--text-muted)]">
            DigyNotes&apos;u uygulama gibi aç ve zayıf bağlantıda offline ekrana düşebil.
          </p>
        </div>

        <div className="flex flex-shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={handleDismiss}
            className="rounded-lg px-2.5 py-2 text-xs font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
          >
            Sonra
          </button>
          <button
            type="button"
            onClick={() => void handleInstall()}
            className="rounded-lg bg-[var(--gold)] px-3 py-2 text-xs font-semibold text-[var(--text-on-accent)] transition-colors hover:bg-[var(--gold-light)]"
          >
            Yükle
          </button>
        </div>
      </div>
    </div>
  );
}
