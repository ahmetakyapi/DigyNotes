"use client";
import { useEffect, useState } from "react";
import { UsersThreeIcon, StarIcon } from "@phosphor-icons/react";

interface Props {
  readonly title: string;
  readonly creator?: string | null;
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
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#10b981]/10">
        <UsersThreeIcon size={16} weight="fill" className="text-[#10b981]" />
      </div>
      <div className="flex items-center gap-3 text-sm">
        <span className="text-[var(--text-secondary)]">
          Toplulukta{" "}
          <span className="font-semibold text-[var(--text-primary)]">{stats.count} kişi</span>{" "}
          notladı
        </span>
        {stats.avgRating > 0 && (
          <>
            <span className="text-[var(--border)]">•</span>
            <span className="flex items-center gap-1 text-[var(--text-secondary)]">
              <StarIcon size={14} weight="fill" className="text-[#10b981]" />
              <span className="font-semibold text-[var(--text-primary)]">{stats.avgRating}</span>
              <span className="text-[var(--text-muted)]">/ 5 ort.</span>
            </span>
          </>
        )}
      </div>
    </div>
  );
}
