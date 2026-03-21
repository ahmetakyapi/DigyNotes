"use client";

import dynamic from "next/dynamic";
import { useTheme } from "@/components/ThemeProvider";

const Inner = dynamic(
  () => import("./remotion/DigyNotesPlayerInner"),
  {
    ssr: false,
    loading: () => (
      <div style={{ width: "100%", aspectRatio: "4/3" }} />
    ),
  }
);

export function DigyNotesPlayer() {
  const { theme } = useTheme();
  const resolvedTheme = theme === "light" ? "light" : "dark";
  return <Inner theme={resolvedTheme} />;
}
