export default function WatchlistLoading() {
  return (
    <div className="mx-auto max-w-5xl px-3 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="h-8 w-36 animate-pulse rounded-lg bg-[var(--bg-card)]" />
        <div className="h-9 w-28 animate-pulse rounded-lg bg-[var(--bg-card)]" />
      </div>

      {/* Watchlist items skeleton */}
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="flex animate-pulse items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-3.5"
          >
            <div className="h-16 w-12 flex-shrink-0 rounded-lg bg-[var(--bg-raised)]" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-2/3 rounded bg-[var(--bg-raised)]" />
              <div className="h-3 w-1/3 rounded bg-[var(--bg-raised)]" />
            </div>
            <div className="h-7 w-20 rounded-full bg-[var(--bg-raised)]" />
          </div>
        ))}
      </div>
    </div>
  );
}
