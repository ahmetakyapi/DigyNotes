"use client";

import { useTheme } from "@/components/ThemeProvider";
import { SunIcon, MoonIcon } from "@phosphor-icons/react";

export function LandingThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={theme === "dark" ? "Açık Temaya Geç" : "Koyu Temaya Geç"}
      aria-label={theme === "dark" ? "Açık Temaya Geç" : "Koyu Temaya Geç"}
      className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-[var(--border)] bg-transparent text-[var(--text-secondary)] transition-all duration-300 hover:rotate-45 hover:border-[var(--text-primary)] hover:text-[var(--text-primary)] active:scale-95"
    >
      {theme === "dark" ? <SunIcon size={16} /> : <MoonIcon size={16} />}
    </button>
  );
}
