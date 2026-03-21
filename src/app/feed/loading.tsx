export default function FeedLoading() {
  return (
    <div className="mx-auto max-w-3xl px-3 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 h-8 w-40 animate-pulse rounded-lg bg-[var(--bg-card)]" />

      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4"
          >
            <div className="mb-3 flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-[var(--bg-raised)]" />
              <div className="space-y-1.5">
                <div className="h-3.5 w-28 rounded bg-[var(--bg-raised)]" />
                <div className="h-2.5 w-20 rounded bg-[var(--bg-raised)]" />
              </div>
            </div>
            <div className="h-[180px] rounded-xl bg-[var(--bg-raised)]" />
            <div className="mt-3 space-y-2">
              <div className="h-4 w-3/4 rounded bg-[var(--bg-raised)]" />
              <div className="h-3 w-1/2 rounded bg-[var(--bg-raised)]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
