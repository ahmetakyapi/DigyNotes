import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/**
 * true on the server and while React hydrates this component (in any Suspense boundary),
 * false for client-only renders (client navigations, later mounts). Entrance animations
 * skip their `initial` state while it is true, so server HTML is never shipped hidden
 * (opacity 0 / translated out) until the JS hydrates.
 */
export function useIsHydrating(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => false,
    () => true
  );
}
