export default function PostDetailLoading() {
  return (
    <div className="mx-auto max-w-4xl px-3 py-6 sm:px-6 sm:py-8">
      {/* Cover image skeleton */}
      <div className="mb-6 h-[280px] animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] sm:h-[380px]" />

      {/* Title + meta */}
      <div className="mb-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-5 w-16 animate-pulse rounded-sm bg-[var(--bg-raised)]" />
          <div className="h-5 w-12 animate-pulse rounded bg-[var(--bg-raised)]" />
        </div>
        <div className="h-8 w-4/5 animate-pulse rounded-lg bg-[var(--bg-card)]" />
        <div className="h-5 w-1/3 animate-pulse rounded bg-[var(--bg-card)]" />
      </div>

      {/* Rating + status */}
      <div className="mb-6 flex items-center gap-4">
        <div className="h-5 w-28 animate-pulse rounded bg-[var(--bg-raised)]" />
        <div className="h-6 w-20 animate-pulse rounded-full bg-[var(--bg-raised)]" />
      </div>

      {/* Content skeleton */}
      <div className="space-y-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded bg-[var(--bg-card)]"
            style={{ height: "16px", width: `${85 - i * 8}%` }}
          />
        ))}
      </div>
    </div>
  );
}
