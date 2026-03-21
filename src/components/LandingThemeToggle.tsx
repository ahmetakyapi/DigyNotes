"use client";

import { useTheme } from "@/components/ThemeProvider";
import { SunIcon, MoonIcon } from "@phosphor-icons/react";

export function LandingThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={theme === "dark" ? "Açık temaya geç" : "Koyu temaya geç"}
      aria-label={theme === "dark" ? "Açık temaya geç" : "Koyu temaya geç"}
      className="dn-landing-toggle flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-secondary)] shadow-[var(--shadow-soft)] transition-colors duration-200 hover:text-[var(--gold)]"
    >
      {theme === "dark" ? <SunIcon size={16} /> : <MoonIcon size={16} />}
    </button>
  );
}
