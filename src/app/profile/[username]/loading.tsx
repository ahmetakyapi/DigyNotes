export default function ProfileLoading() {
  return (
    <div className="mx-auto max-w-4xl px-3 py-6 sm:px-6 sm:py-8">
      {/* Profile header skeleton */}
      <div className="mb-8 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <div className="h-20 w-20 animate-pulse rounded-full bg-[var(--bg-card)]" />
        <div className="flex-1 space-y-2.5 text-center sm:text-left">
          <div className="mx-auto h-6 w-40 animate-pulse rounded-lg bg-[var(--bg-card)] sm:mx-0" />
          <div className="mx-auto h-4 w-28 animate-pulse rounded bg-[var(--bg-card)] sm:mx-0" />
          <div className="flex justify-center gap-4 sm:justify-start">
            <div className="h-4 w-20 animate-pulse rounded bg-[var(--bg-raised)]" />
            <div className="h-4 w-20 animate-pulse rounded bg-[var(--bg-raised)]" />
          </div>
        </div>
      </div>

      {/* Posts grid skeleton */}
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
