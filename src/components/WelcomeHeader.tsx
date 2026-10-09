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

    const ratings = posts
      .map((p) => p.rating)
      .filter((r): r is number => typeof r === "number" && r > 0);
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

  const today = new Date().toLocaleDateString("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <motion.header
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto max-w-5xl px-3 pb-2 pt-5 sm:px-6 sm:pt-7"
    >
      {/* LAYOUT: mono dateline → editorial greeting (left) · big serif stats (right, md+) */}
      <p className="dn-mono flex items-center gap-2 text-[10.5px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
        {greeting} <span className="text-[var(--text-faint)]">—</span> {today}
      </p>
      <div className="mt-4 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <h1 className="max-w-[640px] text-[34px] font-extrabold leading-[0.98] tracking-[-0.03em] text-[var(--text-primary)] [text-wrap:balance] sm:text-[46px]">
          {name ? (
            <>
              Merhaba {firstName}, Bugün Ne{" "}
              <span className="dn-display font-normal italic tracking-[-0.02em]">İzledin</span>
              <span className="text-[var(--gold)]">?</span>
            </>
          ) : (
            "Hoş Geldin"
          )}
        </h1>

        {stats.total > 0 && (
          <div className="flex items-end gap-6 sm:gap-8">
            <Stat value={<AnimatedCounter value={stats.total} />} label="Not" />
            {stats.avgRating > 0 && (
              <Stat
                value={
                  <AnimatedCounter
                    value={stats.avgRating}
                    format={(n) => n.toFixed(1).replace(".", ",")}
                  />
                }
                label="Ort. Puan"
              />
            )}
            {stats.thisMonth > 0 && (
              <Stat value={<AnimatedCounter value={stats.thisMonth} />} label="Bu Ay" />
            )}
          </div>
        )}
      </div>
    </motion.header>
  );
}

function Stat({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <span className="flex flex-col">
      <span className="dn-display text-[40px] italic leading-none tracking-[-0.02em] text-[var(--text-primary)] sm:text-5xl">
        {value}
      </span>
      <span className="dn-mono mt-1 text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
        {label}
      </span>
    </span>
  );
}
