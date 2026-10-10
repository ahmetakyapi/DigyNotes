"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Post } from "@/types";
import { normalizeCategory } from "@/lib/categories";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";

interface WelcomeHeaderProps {
  posts: Post[];
}

function greetingFor(hour: number): string {
  if (hour < 6) return "İyi Geceler";
  if (hour < 12) return "Günaydın";
  if (hour < 18) return "İyi Günler";
  if (hour < 22) return "İyi Akşamlar";
  return "İyi Geceler";
}

/* "Son Notlar" covers every category, so the question does too: the accent verb
   cycles through them, starting from the category of the latest note. */
const VERBS = ["İzledin", "Okudun", "Oynadın", "Gezdin"] as const;
const VERB_FOR: Record<string, number> = { movies: 0, series: 0, book: 1, game: 2, travel: 3 };
const VERB_MS = 2600;

function RotatingVerb({ start }: { start: number }) {
  const reduce = useReducedMotion();
  const [i, setI] = useState(start);
  useEffect(() => setI(start), [start]);
  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => {
      if (!document.hidden) setI((v) => (v + 1) % VERBS.length);
    }, VERB_MS);
    return () => clearInterval(id);
  }, [reduce]);

  return (
    <motion.span
      layout={!reduce}
      transition={{ layout: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }}
      /* Baseline-aligned with "Bugün Ne": `align-bottom` put the serif's baseline
         ~10 px above the grotesk's at 48 px, and the İ dot touched line one. The
         top padding keeps the dot inside the clipping box. */
      className="relative inline-flex overflow-hidden pb-[0.1em] pl-[0.04em] pt-[0.26em] align-baseline"
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={VERBS[i]}
          aria-hidden
          className="dn-display inline-block text-[1.08em] !font-semibold italic tracking-[-0.025em] text-[var(--gold)]"
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          exit={{ y: "-100%", opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          {VERBS[i]}
        </motion.span>
      </AnimatePresence>
      <span className="sr-only">İzledin, Okudun, Oynadın ya da Gezdin</span>
    </motion.span>
  );
}

export function WelcomeHeader({ posts }: WelcomeHeaderProps) {
  const { data: session, status } = useSession();
  const name = session?.user?.name ?? null;

  const greeting = useMemo(() => greetingFor(new Date().getHours()), []);
  const startVerb = useMemo(() => {
    const latest = posts.reduce<Post | null>(
      (a, p) => (!a || new Date(p.createdAt) > new Date(a.createdAt) ? p : a),
      null
    );
    return VERB_FOR[normalizeCategory(latest?.category)] ?? 0;
  }, [posts]);

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

  const firstName = name?.split(" ")[0] ?? null;

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
      {/* LAYOUT: dateline → two-line greeting with a rotating verb (left) · big serif stats (right, md+) */}
      <p className="flex items-center gap-2 text-[13px] font-medium text-[var(--text-muted)]">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
        <span className="text-[var(--text-secondary)]">{greeting}</span>
        <span className="text-[var(--text-faint)]">·</span>
        {today}
      </p>
      <div className="mt-4 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        {/* Two fixed lines: the rotating verb changes width, so the break must not move. */}
        <h1 className="text-[34px] font-extrabold leading-[1.02] tracking-[-0.03em] text-[var(--text-primary)] sm:text-[48px]">
          <span className="block">{firstName ? `Merhaba ${firstName},` : "Hoş Geldin,"}</span>
          <span className="block whitespace-nowrap">
            Bugün Ne <RotatingVerb start={startVerb} />
            <span className="text-[var(--gold)]">?</span>
          </span>
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
      <span className="mt-1 text-[12px] font-medium text-[var(--text-muted)]">{label}</span>
    </span>
  );
}
