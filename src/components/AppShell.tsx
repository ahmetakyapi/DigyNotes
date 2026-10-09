"use client";
import React, { useRef, useState, useEffect, Suspense } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Toaster } from "react-hot-toast";
import { useSession } from "next-auth/react";
import { BellIcon, SunIcon, MoonIcon, PlusIcon } from "@phosphor-icons/react";
import { SearchBar } from "@/components/SearchBar";
import { FIXED_CATEGORIES, getCategoryLabel, normalizeCategory } from "@/lib/categories";
import { useTheme } from "@/components/ThemeProvider";
import { UserDropdownMenu } from "@/components/appshell/UserDropdownMenu";
import { MobileTabBar } from "@/components/appshell/MobileTabBar";
import { DesktopGlobalNav } from "@/components/appshell/DesktopGlobalNav";
import { AvatarImage } from "@/components/AvatarImage";
import { Wordmark } from "@/components/Wordmark";
import { WelcomeReveal } from "@/components/intro/Welcome";

const NEW_NOTE_HINT_KEY = "dn_new_note_hint_count";

export default function AppShell({ children }: { readonly children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const { theme, toggleTheme } = useTheme();
  const reduceMotion = useReducedMotion();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [userUsername, setUserUsername] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showNewNoteHint, setShowNewNoteHint] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Önce cache'ten hemen yükle
    const cached = localStorage.getItem("dn_username");
    if (cached) setUserUsername(cached);

    // Sonra API'dan doğrula/güncelle
    fetch("/api/users/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.username) {
          setUserUsername(data.username);
          localStorage.setItem("dn_username", data.username);
        }
        if (data?.isAdmin) setIsAdmin(true);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    try {
      const shownCount = Number(localStorage.getItem(NEW_NOTE_HINT_KEY) ?? "0");
      if (shownCount < 2) {
        setShowNewNoteHint(true);
        localStorage.setItem(NEW_NOTE_HINT_KEY, String(shownCount + 1));
        const timer = globalThis.setTimeout(() => setShowNewNoteHint(false), 5000);
        return () => clearTimeout(timer);
      }
    } catch {
      setShowNewNoteHint(false);
    }
  }, []);

  useEffect(() => {
    if (!session?.user) {
      setNotificationCount(0);
      return;
    }

    let active = true;

    const loadNotifications = async () => {
      try {
        const response = await fetch("/api/notifications?limit=1");
        if (!response.ok) return;
        const data = await response.json();
        if (active && typeof data?.unreadCount === "number") {
          setNotificationCount(data.unreadCount);
        }
      } catch {
        if (active) setNotificationCount(0);
      }
    };

    const handleRefresh = () => {
      void loadNotifications();
    };

    void loadNotifications();
    globalThis.addEventListener("notifications:refresh", handleRefresh);
    return () => {
      active = false;
      globalThis.removeEventListener("notifications:refresh", handleRefresh);
    };
  }, [session?.user]);

  const handleNewNoteClick = () => {
    setShowNewNoteHint(false);
    try {
      localStorage.setItem(NEW_NOTE_HINT_KEY, "2");
    } catch {
      // noop
    }
  };

  const getActiveCategory = () => {
    if (pathname === "/notes") return "all";
    const match = /^\/category\/(.+)/.exec(pathname);
    return match ? normalizeCategory(decodeURIComponent(match[1])) : "";
  };
  const activeCategory = getActiveCategory();
  const isDiscover = pathname === "/discover";
  const isFeed = pathname === "/feed";
  const isRecommended = pathname === "/recommended";
  const isNotifications = pathname === "/notifications";
  const isComposerRoute = pathname === "/new-post" || /^\/posts\/[^/]+\/edit$/.test(pathname);
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
  const hideMobileBottomTabs = isComposerRoute || isAdminRoute;
  const isNotes =
    pathname === "/notes" ||
    pathname.startsWith("/category/") ||
    pathname.startsWith("/posts/") ||
    pathname === "/new-post";
  const isProfile = pathname.startsWith("/profile");
  const userInitial = session?.user?.name?.charAt(0)?.toUpperCase() ?? "?";
  const userAvatarUrl = session?.user?.avatarUrl ?? null;

  return (
    <>
      <WelcomeReveal />

      {/* ─── SKIP LINK ─── */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-[var(--bg-card)] focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-[var(--gold)] focus:shadow-lg focus:ring-1 focus:ring-[var(--border)]"
      >
        Ana İçeriğe Geç
      </a>

      {/* ─── HEADER ─── */}
      <header className="sticky top-0 z-40 border-b border-[var(--border-header)] bg-[var(--header-glass)] backdrop-blur-2xl backdrop-saturate-150">
        <div className="mx-auto max-w-5xl pl-0 pr-2.5 sm:px-6">
          {/* ══ TOP ROW ══ */}
          <div className="flex h-[58px] items-center justify-between sm:h-[60px]">
            {/* Logo */}
            <Link
              href="/notes"
              aria-label="DigyNotes ana sayfa"
              className="group flex flex-shrink-0 items-center gap-3 pl-3.5 transition-opacity duration-200 hover:opacity-80 sm:pl-0"
            >
              <Wordmark size="md" />
              <span className="dn-mono hidden border-l border-[var(--border)] pl-3 text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)] lg:inline">
                Not Defterin
              </span>
            </Link>

            {/* Actions */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              {/* Search */}
              <Suspense>
                <SearchBar />
              </Suspense>

              <Link
                href="/notifications"
                title="Bildirimler"
                className={`relative hidden h-10 w-10 items-center justify-center rounded-lg border-transparent bg-transparent text-[var(--text-secondary)] shadow-none transition-colors duration-200 hover:text-accent-light sm:flex ${
                  isNotifications ? "text-accent-light" : ""
                }`}
              >
                <BellIcon
                  size={16}
                  weight={notificationCount > 0 || isNotifications ? "fill" : "regular"}
                />
                {notificationCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex min-w-[18px] items-center justify-center rounded-full border border-[var(--bg-header)] bg-accent px-1 text-[10px] font-bold leading-[18px] text-[var(--text-on-accent)]">
                    {notificationCount > 9 ? "9+" : notificationCount}
                  </span>
                )}
              </Link>

              {/* Theme toggle — hidden on mobile, moved to settings */}
              <button
                onClick={toggleTheme}
                title={theme === "dark" ? "Açık Temaya Geç" : "Koyu Temaya Geç"}
                aria-label={theme === "dark" ? "Açık Temaya Geç" : "Koyu Temaya Geç"}
                className="hidden h-10 w-10 items-center justify-center rounded-lg border-transparent bg-transparent text-[var(--text-secondary)] shadow-none transition-colors duration-200 hover:text-accent-light sm:flex"
              >
                {theme === "dark" ? <SunIcon size={16} /> : <MoonIcon size={16} />}
              </button>

              {/* + Yeni Not */}
              <div className="relative">
                {showNewNoteHint && (
                  <div
                    id="new-note-mobile-hint"
                    className="absolute right-0 top-full z-50 mt-2 w-[182px] rounded-lg border border-accent/40 bg-[color-mix(in_srgb,var(--bg-card)_95%,transparent)] px-2.5 py-2 text-[11px] leading-relaxed text-[var(--text-secondary)] shadow-[0_10px_28px_rgb(var(--ink-rgb)/0.4)] backdrop-blur-md sm:hidden"
                  >
                    Yeni not eklemek için + düğmesine dokun.
                    <div className="absolute -top-1.5 right-3 h-3 w-3 rotate-45 border-l border-t border-accent/40 bg-[color-mix(in_srgb,var(--bg-card)_95%,transparent)]" />
                  </div>
                )}
                <Link
                  href="/new-post"
                  onClick={handleNewNoteClick}
                  aria-label="Yeni Not Ekle"
                  aria-describedby={showNewNoteHint ? "new-note-mobile-hint" : undefined}
                  title="Yeni Not Ekle"
                  className="dn-new-note-soft-glow group flex h-10 items-center justify-center gap-1.5 rounded-full bg-[var(--gold)] px-3.5 text-[var(--text-on-accent)] transition-all duration-300 ease-out-expo hover:-translate-y-px hover:bg-[var(--gold-light)] active:scale-[0.96] sm:h-9 sm:px-4 sm:text-[13px] sm:font-semibold"
                >
                  {/* Plus icon */}
                  <span className="flex items-center justify-center">
                    <PlusIcon
                      size={14}
                      weight="bold"
                      className="flex-shrink-0 transition-transform duration-500 ease-out-expo group-hover:rotate-90"
                    />
                  </span>
                  <span className="text-[12px] font-semibold sm:text-[13px]">
                    <span className="sm:hidden">Not</span>
                    <span className="hidden sm:inline">Yeni Not</span>
                  </span>
                </Link>
              </div>

              {/* Avatar */}
              {session && (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    aria-label={`Kullanıcı menüsü — ${session.user?.name ?? ""}`}
                    aria-expanded={showUserMenu}
                    aria-haspopup="true"
                    className={`flex h-10 w-10 flex-shrink-0 select-none items-center justify-center overflow-hidden rounded-full transition-all duration-150 sm:h-10 sm:w-10 sm:shadow-none ${
                      showUserMenu
                        ? "bg-[var(--bg-raised)] shadow-[0_0_0_2px_var(--gold),0_8px_20px_rgb(var(--ink-rgb)/0.28)]"
                        : "bg-[var(--bg-raised)] shadow-[0_0_0_1px_var(--border),0_6px_18px_rgb(var(--ink-rgb)/0.24)] hover:shadow-[0_0_0_1px_var(--gold),0_8px_20px_rgb(var(--ink-rgb)/0.28)]"
                    }`}
                  >
                    <AvatarImage
                      src={userAvatarUrl}
                      alt={session.user?.name ?? "Avatar"}
                      name={session.user?.name ?? ""}
                      size={40}
                      className="h-full w-full object-cover"
                      textClassName="text-[12px] font-bold text-accent-light sm:text-[13px]"
                    />
                  </button>

                  {/* ── Dropdown menu ── */}
                  {showUserMenu && (
                    <UserDropdownMenu
                      session={session}
                      userUsername={userUsername}
                      userAvatarUrl={userAvatarUrl}
                      isAdmin={isAdmin}
                      notificationCount={notificationCount}
                      theme={theme}
                      toggleTheme={toggleTheme}
                      onClose={() => setShowUserMenu(false)}
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ══ CATEGORY STRIP ══ */}

          {/* ── Mobile: yatay kategori chipleri ── */}
          {(pathname === "/notes" || pathname.startsWith("/category/")) && (
            <div className="pb-3 pt-2.5 sm:hidden">
              <div className="scrollbar-hide flex items-center gap-2 overflow-x-auto px-2 py-0.5">
                <button
                  onClick={() => router.push("/notes")}
                  className={`flex h-9 shrink-0 snap-start items-center justify-center rounded-full px-4 text-[13px] font-medium transition-all duration-200 active:scale-95 ${
                    activeCategory === "all"
                      ? "bg-accent text-[var(--text-on-accent)]"
                      : "bg-[var(--bg-card)] text-[var(--text-secondary)] ring-1 ring-[var(--border)]"
                  }`}
                >
                  Son Notlar
                </button>
                {FIXED_CATEGORIES.map((cat) => {
                  const isActive = activeCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => router.push(`/category/${encodeURIComponent(cat)}`)}
                      className={`flex h-9 shrink-0 snap-start items-center justify-center rounded-full px-3.5 text-[13px] font-medium transition-all duration-200 active:scale-95 ${
                        isActive
                          ? "bg-accent text-[var(--text-on-accent)]"
                          : "bg-[var(--bg-card)] text-[var(--text-secondary)] ring-1 ring-[var(--border)]"
                      }`}
                    >
                      {getCategoryLabel(cat)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Desktop: scrollable single row ── */}
          <div
            ref={scrollRef}
            className="scrollbar-hide hidden items-center overflow-x-auto sm:flex"
          >
            <NavTab
              index={0}
              active={activeCategory === "all"}
              onClick={() => router.push("/notes")}
            >
              Son Notlar
            </NavTab>
            {FIXED_CATEGORIES.map((cat, i) => (
              <NavTab
                key={cat}
                index={i + 1}
                active={activeCategory === cat}
                onClick={() => router.push(`/category/${encodeURIComponent(cat)}`)}
              >
                {getCategoryLabel(cat)}
              </NavTab>
            ))}

            {/* spacer + ayraç + global nav */}
            <div className="min-w-[24px] flex-1" />
            <div className="mx-2 flex flex-shrink-0 items-center self-stretch">
              <div className="h-4 w-px bg-[var(--border)]" />
            </div>
            <DesktopGlobalNav
              isFeed={isFeed}
              isRecommended={isRecommended}
              isDiscover={isDiscover}
            />
          </div>
        </div>
      </header>

      {/* ─── MAIN ─── */}
      <main id="main-content" className={hideMobileBottomTabs ? "pb-0" : "pb-24 sm:pb-0"}>
        <motion.div
          key={pathname}
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          {children}
        </motion.div>
      </main>

      {/* ─── MOBILE BOTTOM TAB BAR ─── */}
      {!hideMobileBottomTabs && (
        <MobileTabBar
          isNotes={isNotes}
          isFeed={isFeed}
          isRecommended={isRecommended}
          isDiscover={isDiscover}
          isProfile={isProfile}
          userInitial={userInitial}
          userUsername={userUsername}
        />
      )}

      {/* ─── TOAST ─── */}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "var(--bg-card)",
            color: "var(--text-primary)",
            border: "1px solid var(--border)",
            fontSize: "14px",
            borderRadius: "10px",
          },
          success: { iconTheme: { primary: "var(--gold)", secondary: "var(--text-on-accent)" } },
        }}
      />
    </>
  );
}

/* ── Reusable nav tab ── */
function NavTab({
  index,
  active,
  onClick,
  children,
}: {
  readonly index: number;
  readonly active: boolean;
  readonly onClick: () => void;
  readonly children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`group relative flex flex-shrink-0 cursor-pointer items-baseline gap-1.5 whitespace-nowrap px-3 pb-[12px] pt-[9px] text-[13px] font-medium transition-colors duration-200 first:pl-0 ${
        active
          ? "text-[var(--text-primary)]"
          : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
      }`}
    >
      <span
        className={`dn-mono text-[9.5px] transition-colors duration-200 ${
          active
            ? "text-[var(--gold)]"
            : "text-[var(--text-faint)] group-hover:text-[var(--text-muted)]"
        }`}
      >
        {String(index).padStart(2, "0")}
      </span>
      {children}
      {active && (
        <motion.span
          layoutId="dn-nav-underline"
          className="absolute inset-x-3 -bottom-px h-[2px] rounded-full bg-[var(--gold)] group-first:left-0"
          transition={{ type: "spring", stiffness: 420, damping: 36 }}
        />
      )}
    </button>
  );
}
