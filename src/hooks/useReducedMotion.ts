import { useSyncExternalStore } from "react";

/* ── Reduced motion that hydrates cleanly ──
   framer's useReducedMotion is null on the server but already true on the client's
   hydration render, so markup that branches on it fails hydration and React rebuilds
   the whole page. This one reads false during SSR + hydration (markup matches) and
   React re-renders with the real value right after. Pair it with
   <MotionConfig reducedMotion="user"> so reveals that mounted with their `initial`
   state finish without movement. */
const RM_QUERY = "(prefers-reduced-motion: reduce)";

const subscribeReducedMotion = (onChange: () => void) => {
  const mq = window.matchMedia(RM_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
};

export function useHydratedReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(RM_QUERY).matches,
    () => false
  );
}

/** The file's older name for the same value; prefer useHydratedReducedMotion (framer
    exports a different useReducedMotion). */
export const useReducedMotion = useHydratedReducedMotion;
