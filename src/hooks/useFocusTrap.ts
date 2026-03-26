import { useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Modal/dialog gibi overlay bileşenlerinde Tab döngüsünü sınırlar.
 * Açıldığında ilk focusable elemana odaklanır, kapandığında trigger'a döner.
 */
export function useFocusTrap(isOpen: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Açılmadan önceki aktif elemanı kaydet
    previousFocusRef.current = document.activeElement as HTMLElement | null;

    const container = containerRef.current;
    if (!container) return;

    // İlk focusable elemana odaklan
    const focusableElements = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    // Küçük gecikme ile odaklan (DOM render tamamlansın)
    const focusTimer = globalThis.setTimeout(() => {
      firstFocusable?.focus();
    }, 10);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      // Güncel focusable listesini her Tab'da yeniden al (dinamik içerik için)
      const currentFocusable = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      const first = currentFocusable[0];
      const last = currentFocusable[currentFocusable.length - 1];

      if (!first || !last) return;

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);

      // Focus'u önceki elemana geri döndür
      previousFocusRef.current?.focus();
    };
  }, [isOpen]);

  return containerRef;
}
