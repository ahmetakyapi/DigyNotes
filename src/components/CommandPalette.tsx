"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  MagnifyingGlassIcon,
  FileTextIcon,
  NavigationArrowIcon,
  StarIcon,
  UsersThreeIcon,
  PencilSimpleIcon,
  GearIcon,
  BookmarkSimpleIcon,
  HeartIcon,
  SunIcon,
  MoonIcon,
  ArrowRightIcon,
} from "@phosphor-icons/react";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useTheme } from "@/components/ThemeProvider";
import { modalBackdrop, modalPanel } from "@/lib/variants";
import { getCategoryLabel } from "@/lib/categories";

interface CommandItem {
  id: string;
  label: string;
  keywords?: string;
  hint?: string;
  icon: React.ReactNode;
  action: () => void;
  section: "Notlar" | "Git" | "Eylem";
}

interface NoteHit {
  id: string;
  title: string;
  category: string;
  image?: string | null;
  creator?: string | null;
  years?: string | null;
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const trapRef = useFocusTrap(open);
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const theme = useTheme();
  const [noteHits, setNoteHits] = useState<NoteHit[]>([]);
  const [searching, setSearching] = useState(false);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
  }, []);

  const run = useCallback(
    (action: () => void) => {
      action();
      close();
    },
    [close]
  );

  const items: CommandItem[] = useMemo(() => {
    const base: CommandItem[] = [
      {
        id: "new-post",
        label: "Yeni Not Oluştur",
        keywords: "ekle yeni not post",
        hint: "N",
        icon: <PencilSimpleIcon size={16} weight="duotone" />,
        action: () => router.push("/new-post"),
        section: "Eylem",
      },
      {
        id: "notes",
        label: "Notlarım",
        keywords: "ana sayfa anasayfa notlar home",
        hint: "H",
        icon: <FileTextIcon size={16} weight="duotone" />,
        action: () => router.push("/notes"),
        section: "Git",
      },
      {
        id: "feed",
        label: "Akış",
        keywords: "takip feed stream",
        hint: "F",
        icon: <NavigationArrowIcon size={16} weight="duotone" />,
        action: () => router.push("/feed"),
        section: "Git",
      },
      {
        id: "recommended",
        label: "Öneriler",
        keywords: "tavsiye öneri recommended",
        icon: <StarIcon size={16} weight="duotone" />,
        action: () => router.push("/recommended"),
        section: "Git",
      },
      {
        id: "discover",
        label: "Keşfet",
        keywords: "discover kullanıcı arama",
        hint: "D",
        icon: <UsersThreeIcon size={16} weight="duotone" />,
        action: () => router.push("/discover"),
        section: "Git",
      },
      {
        id: "watchlist",
        label: "İzleme Listesi",
        keywords: "izlenecek kaydet watchlist",
        icon: <BookmarkSimpleIcon size={16} weight="duotone" />,
        action: () => router.push("/watchlist"),
        section: "Git",
      },
      {
        id: "collections",
        label: "Koleksiyonlar",
        keywords: "koleksiyon collections",
        icon: <HeartIcon size={16} weight="duotone" />,
        action: () => router.push("/collections"),
        section: "Git",
      },
      {
        id: "settings",
        label: "Profil Ayarları",
        keywords: "settings ayar profil hesap",
        icon: <GearIcon size={16} weight="duotone" />,
        action: () => router.push("/profile/settings"),
        section: "Git",
      },
      {
        id: "toggle-theme",
        label: theme.theme === "dark" ? "Açık Temaya Geç" : "Koyu Temaya Geç",
        keywords: "tema theme light dark açık koyu",
        icon:
          theme.theme === "dark" ? (
            <SunIcon size={16} weight="duotone" />
          ) : (
            <MoonIcon size={16} weight="duotone" />
          ),
        action: () => theme.toggleTheme(),
        section: "Eylem",
      },
    ];
    return base;
  }, [router, theme]);

  // Debounced note search (own notes) once the query has 2+ characters
  useEffect(() => {
    const q = query.trim();
    if (!open || q.length < 2) {
      setNoteHits([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const ctrl = new AbortController();
    const t = window.setTimeout(() => {
      fetch(`/api/posts?paginate=1&limit=6&q=${encodeURIComponent(q)}`, { signal: ctrl.signal })
        .then((r) => (r.ok ? r.json() : { items: [] }))
        .then((data: { items?: NoteHit[] }) =>
          setNoteHits(Array.isArray(data.items) ? data.items : [])
        )
        .catch(() => {})
        .finally(() => setSearching(false));
    }, 180);
    return () => {
      ctrl.abort();
      window.clearTimeout(t);
    };
  }, [query, open]);

  const noteItems: CommandItem[] = useMemo(
    () =>
      noteHits.map((n) => ({
        id: `note-${n.id}`,
        label: n.title,
        hint: [getCategoryLabel(n.category), n.years].filter(Boolean).join(" · "),
        icon:
          n.image && /^(https?:)?\//.test(n.image) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={n.image} alt="" className="h-full w-full object-cover" />
          ) : (
            <FileTextIcon size={16} weight="duotone" />
          ),
        action: () => router.push(`/posts/${n.id}`),
        section: "Notlar" as const,
      })),
    [noteHits, router]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      const haystack = `${item.label} ${item.keywords ?? ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [items, query]);

  const grouped = useMemo(() => {
    const groups: Record<CommandItem["section"], CommandItem[]> = {
      Notlar: noteItems,
      Git: [],
      Eylem: [],
    };
    filtered.forEach((item) => groups[item.section].push(item));
    return groups;
  }, [filtered, noteItems]);

  const flatList = useMemo(
    () => [...grouped["Notlar"], ...grouped["Eylem"], ...grouped["Git"]],
    [grouped]
  );

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  // Cmd+K / Ctrl+K global trigger
  useEffect(() => {
    const suppressed = pathname === "/" || pathname === "/login" || pathname === "/register";
    if (suppressed) return;
    if (!session?.user) return;

    const handler = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if ((e.metaKey || e.ctrlKey) && key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [pathname, session]);

  // Arrow / Enter / Esc while open
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, Math.max(0, flatList.length - 1)));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const item = flatList[activeIndex];
        if (item) run(item.action);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, flatList, activeIndex, close, run]);

  // Focus input on open
  useEffect(() => {
    if (open) {
      const id = window.setTimeout(() => inputRef.current?.focus(), 50);
      return () => window.clearTimeout(id);
    }
  }, [open]);

  // Scroll active into view
  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(`[data-idx="${activeIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-[110] flex items-start justify-center px-4 pt-[14vh]"
          role="dialog"
          aria-modal="true"
          aria-label="Komut paleti"
          onMouseDown={close}
        >
          <motion.div
            className="absolute inset-0 bg-[rgb(var(--ink-rgb)/0.6)] backdrop-blur-md"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={modalBackdrop}
            aria-hidden
          />

          <motion.div
            ref={trapRef}
            className="relative w-full max-w-2xl overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--bg-card)] shadow-[var(--shadow-deep)]"
            onMouseDown={(e) => e.stopPropagation()}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={modalPanel}
          >
            <div className="flex items-center gap-3 border-b border-[var(--border-subtle)] px-5 py-4">
              <MagnifyingGlassIcon
                size={20}
                className={`shrink-0 ${searching ? "animate-pulse text-[var(--gold)]" : "text-[var(--text-muted)]"}`}
              />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Not, sayfa ya da eylem ara…"
                className="w-full bg-transparent text-lg tracking-[-0.01em] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
                autoComplete="off"
                spellCheck={false}
              />
              <kbd className="hidden h-6 items-center rounded-md border border-[var(--border)] bg-[var(--bg-raised)] px-1.5 font-mono text-[11px] text-[var(--text-muted)] sm:flex">
                Esc
              </kbd>
            </div>

            <ul ref={listRef} className="max-h-[52vh] overflow-y-auto py-2">
              {flatList.length === 0 ? (
                <li className="px-4 py-12 text-center">
                  <p className="dn-display text-2xl italic text-[var(--text-secondary)]">
                    {searching ? "Arşivde aranıyor…" : "Eşleşen bir şey yok."}
                  </p>
                  <p className="mt-2 text-[12px] text-[var(--text-muted)] font-medium">
                    Başlık, yönetmen, yazar ya da etiket dene
                  </p>
                </li>
              ) : (
                (["Notlar", "Eylem", "Git"] as const).map((section) => {
                  const sectionItems = grouped[section];
                  if (sectionItems.length === 0) return null;
                  return (
                    <li key={section}>
                      <div className="px-5 pb-1.5 pt-3 text-[12px] text-[var(--text-muted)] font-medium">
                        {section}
                      </div>
                      <ul>
                        {sectionItems.map((item) => {
                          const flatIdx = flatList.indexOf(item);
                          const active = flatIdx === activeIndex;
                          return (
                            <li key={item.id}>
                              <button
                                type="button"
                                data-idx={flatIdx}
                                onMouseEnter={() => setActiveIndex(flatIdx)}
                                onClick={() => run(item.action)}
                                className={`relative flex w-full cursor-pointer items-center gap-3 px-5 py-2.5 text-left text-sm transition-colors duration-150 ${
                                  active
                                    ? "bg-[var(--bg-raised)] text-[var(--text-primary)] before:absolute before:inset-y-2 before:left-0 before:w-[2px] before:rounded-full before:bg-[var(--gold)]"
                                    : "text-[var(--text-secondary)]"
                                }`}
                              >
                                <span
                                  className={`flex shrink-0 items-center justify-center overflow-hidden ${
                                    item.section === "Notlar"
                                      ? "h-10 w-7 rounded-md"
                                      : "h-7 w-7 rounded-lg"
                                  } ${
                                    active
                                      ? "bg-accent/12 text-[var(--gold)]"
                                      : "bg-[var(--bg-raised)] text-[var(--text-muted)]"
                                  }`}
                                >
                                  {item.icon}
                                </span>
                                <span className="flex-1">{item.label}</span>
                                {item.hint &&
                                  (item.section === "Notlar" ? (
                                    <span className="text-[12px] text-[var(--text-muted)] font-medium">
                                      {item.hint}
                                    </span>
                                  ) : (
                                    <kbd className="rounded-md border border-[var(--border)] bg-[var(--bg-raised)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-muted)]">
                                      {item.hint}
                                    </kbd>
                                  ))}
                                {active && (
                                  <ArrowRightIcon size={14} className="text-[var(--text-muted)]" />
                                )}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </li>
                  );
                })
              )}
            </ul>

            <div className="flex items-center justify-between border-t border-[var(--border-subtle)] px-5 py-2.5 text-[12px] text-[var(--text-muted)] font-medium">
              <span>
                <kbd className="font-mono">↑↓</kbd> gezin · <kbd className="font-mono">↵</kbd> seç
              </span>
              <span>
                <kbd className="font-mono">⌘K</kbd> kapat
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
