"use client";

import { ReactNode, useEffect, useRef, useState } from "react";

interface ActionTooltipProps {
  label: string;
  children: ReactNode;
}

export function ActionTooltip({ label, children }: ActionTooltipProps) {
  const [isTouchOpen, setIsTouchOpen] = useState(false);
  const hideTimeoutRef = useRef<number | null>(null);

  const clearHideTimeout = () => {
    if (hideTimeoutRef.current) {
      window.clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  };

  const showTouchTooltip = () => {
    clearHideTimeout();
    setIsTouchOpen(true);
    hideTimeoutRef.current = window.setTimeout(() => {
      setIsTouchOpen(false);
      hideTimeoutRef.current = null;
    }, 1400);
  };

  useEffect(() => {
    return () => clearHideTimeout();
  }, []);

  return (
    <span
      className="group/tooltip relative inline-flex"
      onTouchStartCapture={showTouchTooltip}
      onBlurCapture={() => setIsTouchOpen(false)}
    >
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 inline-flex -translate-x-1/2 whitespace-nowrap rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-2.5 py-1 text-[11px] font-medium text-[var(--text-primary)] shadow-[var(--shadow-soft)] transition-all duration-150 group-hover/tooltip:translate-y-0 group-hover/tooltip:opacity-100 group-focus-within/tooltip:translate-y-0 group-focus-within/tooltip:opacity-100 ${
          isTouchOpen ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
        }`}
      >
        {label}
      </span>
    </span>
  );
}
