"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Sayfanın en üstünde ince bir altın çizgi gösterir.
 * Link tıklamalarını dinler → navigasyon başladığında çizgiyi başlatır,
 * pathname değişince (yeni sayfa render) tamamlar ve gizler.
 */
export function RouteProgressBar() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const [width, setWidth] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pathnameRef = useRef(pathname);
  const widthRef = useRef(0);

  const startProgress = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    widthRef.current = 0;
    setWidth(0);
    setActive(true);

    // İlerlemeyi simüle et — 85%'e kadar artır, sonraki adımda tamamlanacak
    intervalRef.current = setInterval(() => {
      widthRef.current = Math.min(widthRef.current + Math.random() * 10 + 3, 85);
      setWidth(widthRef.current);
    }, 120);
  }, []);

  const completeProgress = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setWidth(100);
    setTimeout(() => {
      setActive(false);
      setWidth(0);
      widthRef.current = 0;
    }, 350);
  }, []);

  // Pathname değişince navigasyon tamamlandı
  useEffect(() => {
    if (pathnameRef.current !== pathname) {
      pathnameRef.current = pathname;
      completeProgress();
    }
  }, [pathname, completeProgress]);

  // Sayfa içi link tıklamalarını dinle
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      // Dış linkler, hash linkler, protokol linkleri atla
      if (
        href.startsWith("http") ||
        href.startsWith("//") ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:")
      )
        return;

      // Yeni sekmede açılanlar atla
      if (anchor.target === "_blank") return;

      // Aynı sayfa ise atla
      const targetPath = href.split("?")[0];
      if (targetPath === pathname) return;

      startProgress();
    };

    document.addEventListener("click", handleClick);
    return () => {
      document.removeEventListener("click", handleClick);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [pathname, startProgress]);

  if (!active && width === 0) return null;

  return (
    <div
      className="pointer-events-none fixed left-0 top-0 z-[10000] h-[2px]"
      style={{
        width: `${width}%`,
        background: "linear-gradient(90deg, #c4a24b 0%, #d7ba68 60%, #c4a24b 100%)",
        transition: active ? "width 0.12s linear" : "width 0.3s ease-out, opacity 0.25s ease",
        opacity: active ? 1 : width >= 100 ? 0 : 1,
        boxShadow: "0 0 8px rgba(201,168,76,0.65), 0 0 2px rgba(224,192,104,0.8)",
      }}
    />
  );
}
