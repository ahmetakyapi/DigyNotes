"use client";

import dynamic from "next/dynamic";
import { useTheme } from "@/components/ThemeProvider";

const Inner = dynamic(
  () => import("./remotion/DigyNotesPlayerInner"),
  {
    ssr: false,
    loading: () => (
      <div
        className="relative w-full overflow-hidden"
        style={{ aspectRatio: "4/3" }}
      >
        {/* Pulsing skeleton */}
        <div className="absolute inset-0 animate-pulse bg-[var(--bg-card)]" />
        {/* Faux content lines */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8">
          <div className="h-3 w-2/3 rounded bg-[var(--border)]" />
          <div className="h-3 w-1/2 rounded bg-[var(--border)]" />
          <div className="h-3 w-1/3 rounded bg-[var(--border)]" />
        </div>
      </div>
    ),
  }
);

export function DigyNotesPlayer() {
  const { theme } = useTheme();
  const resolvedTheme = theme === "light" ? "light" : "dark";
  return <Inner theme={resolvedTheme} />;
}
