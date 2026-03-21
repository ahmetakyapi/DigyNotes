export default function RecommendedLoading() {
  return (
    <div className="mx-auto max-w-5xl px-3 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 h-8 w-40 animate-pulse rounded-lg bg-[var(--bg-card)]" />

      {/* Recommendation cards skeleton */}
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex animate-pulse gap-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4"
          >
            <div className="h-28 w-20 flex-shrink-0 rounded-lg bg-[var(--bg-raised)]" />
            <div className="flex-1 space-y-2.5">
              <div className="h-4 w-3/4 rounded bg-[var(--bg-raised)]" />
              <div className="h-3 w-1/2 rounded bg-[var(--bg-raised)]" />
              <div className="h-3 w-full rounded bg-[var(--bg-raised)]" />
              <div className="h-3 w-2/3 rounded bg-[var(--bg-raised)]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
