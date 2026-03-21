export default function DiscoverLoading() {
  return (
    <div className="mx-auto max-w-5xl px-3 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 h-8 w-36 animate-pulse rounded-lg bg-[var(--bg-card)]" />

      {/* Search bar skeleton */}
      <div className="mb-6 h-11 animate-pulse rounded-xl border border-[var(--border)] bg-[var(--bg-card)]" />

      {/* User cards skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5"
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="h-11 w-11 rounded-full bg-[var(--bg-raised)]" />
              <div className="space-y-1.5">
                <div className="h-4 w-24 rounded bg-[var(--bg-raised)]" />
                <div className="h-3 w-16 rounded bg-[var(--bg-raised)]" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 w-full rounded bg-[var(--bg-raised)]" />
              <div className="h-3 w-2/3 rounded bg-[var(--bg-raised)]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
