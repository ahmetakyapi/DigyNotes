"use client";
import { useEffect, useState } from "react";

interface Props {
  title: string;
  creator?: string | null;
}

export default function CommunityStatsCard({ title, creator }: Props) {
  const [stats, setStats] = useState<{ count: number; avgRating: number } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams({ title });
    if (creator) params.set("creator", creator);
    fetch(`/api/community/stats?${params}`)
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, [title, creator]);

  if (!stats || stats.count < 2) return null;

  return (
    <div className="mb-6 flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#c9a84c]/10">
        <svg className="h-4 w-4 text-[#c9a84c]" fill="currentColor" viewBox="0 0 20 20">
          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v1h8v-1zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-1a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v1h-3zM4.75 12.094A5.973 5.973 0 004 15v1H1v-1a3 3 0 013.75-2.906z" />
        </svg>
      </div>
      <div className="flex items-center gap-3 text-sm">
        <span className="text-[var(--text-secondary)]">
          Toplulukta{" "}
          <span className="font-semibold text-[var(--text-primary)]">{stats.count} kişi</span> notladı
        </span>
        {stats.avgRating > 0 && (
          <>
            <span className="text-[var(--border)]">•</span>
            <span className="flex items-center gap-1 text-[var(--text-secondary)]">
              <svg className="h-3.5 w-3.5 text-[#c9a84c]" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="font-semibold text-[var(--text-primary)]">{stats.avgRating}</span>
              <span className="text-[var(--text-muted)]">/ 5 ort.</span>
            </span>
          </>
        )}
      </div>
    </div>
  );
}
