"use client";
import { useEffect, useState } from "react";
import { ArrowUp } from "@phosphor-icons/react";

/**
 * Sayfa 400px+ kaydırıldığında sağ alt köşede beliren
 * "yukarı dön" butonu.
 */
export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 400);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollUp = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
      onClick={scrollUp}
      aria-label="Yukarı dön"
      className={`hover:border-[var(--gold)]/40 fixed bottom-20 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-secondary)] shadow-[var(--shadow-soft)] transition-all duration-300 hover:text-[var(--gold)] active:scale-95 sm:bottom-6 sm:right-6 sm:h-11 sm:w-11 ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
      }`}
    >
      <ArrowUp size={16} weight="bold" />
    </button>
  );
}
