export default function CollectionsLoading() {
  return (
    <div className="mx-auto max-w-5xl px-3 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-[var(--bg-card)]" />
        <div className="h-9 w-36 animate-pulse rounded-lg bg-[var(--bg-card)]" />
      </div>

      {/* Collection cards skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5"
          >
            <div className="mb-3 flex gap-1.5">
              {[1, 2, 3].map((j) => (
                <div key={j} className="h-14 w-10 rounded bg-[var(--bg-raised)]" />
              ))}
            </div>
            <div className="mb-2 h-5 w-3/4 rounded bg-[var(--bg-raised)]" />
            <div className="h-3 w-1/2 rounded bg-[var(--bg-raised)]" />
          </div>
        ))}
      </div>
    </div>
  );
}
