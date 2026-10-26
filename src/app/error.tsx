"use client";

/*
  LAYOUT: Root route error boundary. Next renders it inside the root layout, so a page
  error keeps the header and tab bar, and it resets on its own after a route change.
  Centered icon tile · heading · one line of copy · retry pill.
*/
import { WarningCircleIcon } from "@phosphor-icons/react";

export default function AppError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]">
        <WarningCircleIcon size={24} weight="duotone" color="var(--danger)" />
      </div>
      <h2 className="mb-2 text-lg font-semibold text-[var(--text-primary)]">
        Bir Şeyler Ters Gitti
      </h2>
      <p className="mb-6 max-w-sm text-sm text-[var(--text-muted)]">
        Sayfa beklenmedik bir hatayla karşılaştı. Tekrar deneyebilirsin.
      </p>
      <button
        type="button"
        onClick={reset}
        className="cursor-pointer rounded-full border border-[var(--border)] bg-[var(--bg-card)] px-5 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent/50"
      >
        Tekrar Dene
      </button>
    </div>
  );
}
