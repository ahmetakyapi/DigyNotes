export default function NotesLoading() {
  return (
    <div className="mx-auto max-w-5xl px-3 py-6 sm:px-6 sm:py-8">
      {/* Tab switcher skeleton */}
      <div className="mb-4 flex items-center gap-3">
        <div className="h-10 w-56 animate-pulse rounded-xl bg-[var(--bg-card)]" />
        <div className="hidden h-4 w-24 animate-pulse rounded bg-[var(--bg-card)] sm:block" />
      </div>

      {/* Category pills skeleton */}
      <div className="mb-4 flex gap-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="h-8 animate-pulse rounded-full bg-[var(--bg-card)]"
            style={{ width: `${52 + i * 8}px` }}
          />
        ))}
      </div>

      {/* Featured card skeleton */}
      <div className="mb-4 h-[260px] animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] sm:h-[340px]" />

      {/* Grid cards skeleton */}
      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-[200px] animate-pulse rounded-xl border border-[var(--border)] bg-[var(--bg-card)]"
          />
        ))}
      </div>
    </div>
  );
}
