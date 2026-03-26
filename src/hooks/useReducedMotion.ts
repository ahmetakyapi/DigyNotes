import { useState, useEffect } from "react";

/**
 * prefers-reduced-motion medya sorgusunu dinler.
 * Kullanıcı azaltılmış hareket tercih ediyorsa true döner.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mql = globalThis.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mql.matches);

    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  return reduced;
}
