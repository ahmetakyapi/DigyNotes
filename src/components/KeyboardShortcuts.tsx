"use client";
import { useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

/**
 * Global klavye kısayolları.
 *
 *   N  → Yeni not oluştur
 *   S  → Arama kutusuna odaklan
 *   H  → Ana sayfa (/notes)
 *   F  → Akış (/feed)
 *   D  → Keşfet (/discover)
 *   ?  → Kısayol yardımını göster/gizle
 *
 * Input/textarea/contenteditable içindeyken devre dışı kalır.
 */

const SHORTCUT_HELP_EVENT = "dn:shortcut-help";

export function dispatchShortcutHelp() {
  window.dispatchEvent(new CustomEvent(SHORTCUT_HELP_EVENT));
}

export default function KeyboardShortcuts() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();

  const isEditable = useCallback((target: EventTarget | null) => {
    if (!target || !(target instanceof HTMLElement)) return false;
    const tag = target.tagName.toLowerCase();
    if (tag === "input" || tag === "textarea" || tag === "select") return true;
    if (target.isContentEditable) return true;
    if (target.closest(".ql-editor")) return true;
    return false;
  }, []);

  useEffect(() => {
    // Landing, login, register sayfalarında devre dışı
    if (pathname === "/" || pathname === "/login" || pathname === "/register") return;
    if (!session?.user) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Meta/Ctrl/Alt kombinasyonlarını yoksay
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      // Düzenleme alanlarında yoksay
      if (isEditable(e.target)) return;

      switch (e.key.toLowerCase()) {
        case "n":
          e.preventDefault();
          router.push("/new-post");
          break;
        case "s": {
          e.preventDefault();
          // Arama kutusuna odaklan
          const searchInput =
            document.querySelector<HTMLInputElement>('[data-search-input="true"]') ??
            document.querySelector<HTMLInputElement>('input[type="search"]') ??
            document.querySelector<HTMLInputElement>('input[placeholder*="Ara"]');
          if (searchInput) {
            searchInput.focus();
            searchInput.select();
          }
          break;
        }
        case "h":
          e.preventDefault();
          router.push("/notes");
          break;
        case "f":
          e.preventDefault();
          router.push("/feed");
          break;
        case "d":
          e.preventDefault();
          router.push("/discover");
          break;
        case "/":
        case "?":
          e.preventDefault();
          dispatchShortcutHelp();
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pathname, session, router, isEditable]);

  return null;
}
