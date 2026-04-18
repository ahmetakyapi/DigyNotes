"use client";

import { useMemo } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Post } from "@/types";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";

interface WelcomeHeaderProps {
  posts: Post[];
}

function greetingFor(hour: number): string {
  if (hour < 6) return "İyi geceler";
  if (hour < 12) return "İyi sabahlar";
  if (hour < 18) return "İyi öğlenler";
  if (hour < 22) return "İyi akşamlar";
  return "İyi geceler";
}

export function WelcomeHeader({ posts }: WelcomeHeaderProps) {
  const { data: session, status } = useSession();
  const name = session?.user?.name ?? null;

  const greeting = useMemo(() => greetingFor(new Date().getHours()), []);

  const stats = useMemo(() => {
    const total = posts.length;

    const ratings = posts.map((p) => p.rating).filter((r): r is number => typeof r === "number" && r > 0);
    const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const thisMonth = posts.filter((p) => {
      const created = p.createdAt ? new Date(p.createdAt).getTime() : 0;
      return created >= monthStart;
    }).length;

    return { total, avgRating, thisMonth };
  }, [posts]);

  if (status === "loading") return null;

  const firstName = name?.split(" ")[0] ?? "tekrar hoş geldin";

  return (
    <motion.header
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto max-w-5xl px-3 pb-2 pt-5 sm:px-6 sm:pt-7"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--gold)]">
        {greeting}
      </p>
      <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-[28px]">
        {name ? `${firstName}, seni görmek güzel` : "Hoş geldin"}
      </h1>

      {stats.total > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[var(--text-secondary)]">
          <Stat
            value={<AnimatedCounter value={stats.total} />}
            label={stats.total === 1 ? "not" : "not"}
          />
          {stats.avgRating > 0 && (
            <Stat
              value={
                <AnimatedCounter
                  value={stats.avgRating}
                  format={(n) => n.toFixed(1).replace(".", ",")}
                />
              }
              label="ortalama"
              suffix="/5"
            />
          )}
          {stats.thisMonth > 0 && (
            <Stat
              value={<AnimatedCounter value={stats.thisMonth} />}
              label={stats.thisMonth === 1 ? "bu ay" : "bu ay"}
            />
          )}
        </div>
      )}
    </motion.header>
  );
}

function Stat({
  value,
  label,
  suffix,
}: {
  value: React.ReactNode;
  label: string;
  suffix?: string;
}) {
  return (
    <span className="flex items-baseline gap-1.5">
      <span className="text-base font-semibold text-[var(--text-primary)]">
        {value}
        {suffix && <span className="text-[var(--text-muted)]">{suffix}</span>}
      </span>
      <span className="text-xs text-[var(--text-muted)]">{label}</span>
    </span>
  );
}
