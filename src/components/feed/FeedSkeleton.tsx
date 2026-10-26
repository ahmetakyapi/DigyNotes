/* LAYOUT: Placeholder feed cards — author strip, cover + text grid, action row. */
export function FeedSkeleton({ count = 3 }: Readonly<{ count?: number }>) {
  return (
    <div className="space-y-4" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--bg-card)]"
        >
          <div className="flex items-center gap-3 border-b border-[var(--border)] px-5 py-3.5">
            <div className="h-9 w-9 rounded-full bg-[var(--bg-raised)]" />
            <div className="space-y-1.5">
              <div className="h-3.5 w-28 rounded-sm bg-[var(--bg-raised)]" />
              <div className="h-3 w-20 rounded-sm bg-[var(--bg-raised)]" />
            </div>
            <div className="ml-auto h-3 w-16 rounded-sm bg-[var(--bg-raised)]" />
          </div>
          <div className="grid gap-5 p-5 lg:grid-cols-[240px_1fr]">
            <div className="h-52 rounded-[18px] bg-[var(--bg-raised)]" />
            <div className="space-y-3 pt-1">
              <div className="h-5 w-3/4 rounded-sm bg-[var(--bg-raised)]" />
              <div className="h-3 w-1/3 rounded-sm bg-[var(--bg-raised)]" />
              <div className="h-3 w-full rounded-sm bg-[var(--bg-raised)]" />
              <div className="h-3 w-5/6 rounded-sm bg-[var(--bg-raised)]" />
            </div>
          </div>
          <div className="mx-5 flex gap-2 border-t border-[var(--border)] py-3">
            <div className="h-9 w-16 rounded-full bg-[var(--bg-raised)]" />
            <div className="h-9 w-16 rounded-full bg-[var(--bg-raised)]" />
            <div className="h-9 w-11 rounded-full bg-[var(--bg-raised)]" />
          </div>
        </div>
      ))}
    </div>
  );
}
