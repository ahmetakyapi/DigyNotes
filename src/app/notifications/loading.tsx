export default function NotificationsLoading() {
  return (
    <div className="mx-auto max-w-3xl px-3 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="h-8 w-36 animate-pulse rounded-lg bg-[var(--bg-card)]" />
        <div className="h-8 w-28 animate-pulse rounded-lg bg-[var(--bg-card)]" />
      </div>

      {/* Notification items skeleton */}
      <div className="space-y-2">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div
            key={i}
            className="flex animate-pulse items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-3.5"
          >
            <div className="h-9 w-9 flex-shrink-0 rounded-full bg-[var(--bg-raised)]" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-4/5 rounded bg-[var(--bg-raised)]" />
              <div className="h-3 w-1/3 rounded bg-[var(--bg-raised)]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
