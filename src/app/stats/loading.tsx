export default function StatsLoading() {
  return (
    <div className="mx-auto max-w-5xl px-3 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 h-8 w-44 animate-pulse rounded-lg bg-[var(--bg-card)]" />

      {/* Stat cards skeleton */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4"
          >
            <div className="mb-2 h-3 w-16 rounded bg-[var(--bg-raised)]" />
            <div className="h-7 w-12 rounded bg-[var(--bg-raised)]" />
          </div>
        ))}
      </div>

      {/* Chart area skeleton */}
      <div className="mb-6 h-[260px] animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]" />

      {/* Category breakdown skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="h-[180px] animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]"
          />
        ))}
      </div>
    </div>
  );
}
