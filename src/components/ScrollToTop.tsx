"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowUpIcon } from "@phosphor-icons/react";

/**
 * Sayfa 400px+ kaydırıldığında sağ alt köşede beliren
 * "yukarı dön" butonu.
 */
export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const next = window.scrollY > 400;
      // Gizlenince buton aria-hidden olur; odak görünmez bir kontrolde kalmasın.
      // Buton atlama bağlantısından önce geldiği için sonraki Tab sayfanın başından sürer.
      if (!next && buttonRef.current && document.activeElement === buttonRef.current) {
        buttonRef.current.blur();
      }
      setVisible(next);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollUp = () => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <button
      ref={buttonRef}
      onClick={scrollUp}
      aria-label="Yukarı Dön"
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
      className={`fixed bottom-20 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-secondary)] shadow-[var(--shadow-soft)] transition-all duration-300 hover:border-accent/40 hover:text-[var(--gold)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 active:scale-95 sm:bottom-6 sm:right-6 sm:h-11 sm:w-11 ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
      }`}
    >
      <ArrowUpIcon size={16} weight="bold" />
    </button>
  );
}
