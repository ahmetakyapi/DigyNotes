import { FeedSkeleton } from "@/components/feed/FeedSkeleton";

/* LAYOUT: Header placeholder (title + description + hairline) → tab bar → feed cards. */
export default function FeedLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-12 pt-8 sm:px-6 sm:pt-10">
      <div className="mb-8 animate-pulse sm:mb-10">
        <div className="h-14 w-3/4 max-w-[560px] rounded-xl bg-[var(--bg-card)]" />
        <div className="mt-4 h-4 w-2/3 max-w-[420px] rounded-sm bg-[var(--bg-card)]" />
        <div className="mt-6 h-px w-full bg-[var(--border)]" />
      </div>
      <div className="mb-6 h-11 w-[300px] max-w-full animate-pulse rounded-full bg-[var(--bg-card)]" />
      <FeedSkeleton count={3} />
    </div>
  );
}
