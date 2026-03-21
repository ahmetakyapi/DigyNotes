"use client";
import React, { useRef, useState, useEffect, Suspense } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Toaster } from "react-hot-toast";
import { useSession } from "next-auth/react";
import { BellIcon, SunIcon, MoonIcon, PlusIcon } from "@phosphor-icons/react";
import { SearchBar } from "@/components/SearchBar";
import { FIXED_CATEGORIES, getCategoryLabel, normalizeCategory } from "@/lib/categories";
import { useTheme } from "@/components/ThemeProvider";
import { UserDropdownMenu } from "@/components/appshell/UserDropdownMenu";
import { MobileTabBar } from "@/components/appshell/MobileTabBar";
import { DesktopGlobalNav } from "@/components/appshell/DesktopGlobalNav";

const NEW_NOTE_HINT_KEY = "dn_new_note_hint_count";

export default function AppShell({ children }: { readonly children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const { theme, toggleTheme } = useTheme();
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

  return (
    <>
      {/* ─── HEADER ─── */}
      <header className="sticky top-0 z-40 border-b border-[var(--border-header)] bg-[var(--bg-header)] backdrop-blur-xl">
        <div className="mx-auto max-w-5xl pl-0 pr-2.5 sm:px-6">
          {/* ══ TOP ROW ══ */}
          <div className="flex h-[58px] items-center justify-between sm:h-[60px]">
            {/* Logo */}
            <Link href="/notes" className="flex-shrink-0 leading-[0]">
              <Image
                src="/app-logo.png"
                alt="DigyNotes"
                width={190}
                height={56}
                className="block h-auto w-[146px] object-contain sm:w-[215px]"
                priority
                unoptimized
              />
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
                className={`relative hidden h-10 w-10 items-center justify-center rounded-lg border-transparent bg-transparent text-[var(--text-secondary)] shadow-none transition-colors duration-200 hover:text-[#34d399] sm:flex ${
                  isNotifications ? "text-[#34d399]" : ""
                }`}
              >
                <BellIcon
                  size={16}
                  weight={notificationCount > 0 || isNotifications ? "fill" : "regular"}
                />
                {notificationCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex min-w-[18px] items-center justify-center rounded-full border border-[var(--bg-header)] bg-[#10b981] px-1 text-[10px] font-bold leading-[18px] text-white">
                    {notificationCount > 9 ? "9+" : notificationCount}
                  </span>
                )}
              </Link>

              {/* Theme toggle — hidden on mobile, moved to settings */}
              <button
                onClick={toggleTheme}
                title={theme === "dark" ? "Açık temaya geç" : "Koyu temaya geç"}
                aria-label={theme === "dark" ? "Açık temaya geç" : "Koyu temaya geç"}
                className="hidden h-10 w-10 items-center justify-center rounded-lg border-transparent bg-transparent text-[var(--text-secondary)] shadow-none transition-colors duration-200 hover:text-[#34d399] sm:flex"
              >
                {theme === "dark" ? <SunIcon size={16} /> : <MoonIcon size={16} />}
              </button>

              {/* + Yeni Not */}
              <div className="relative">
                {showNewNoteHint && (
                  <div
                    id="new-note-mobile-hint"
                    className="bg-[var(--bg-card)]/95 absolute right-0 top-full z-50 mt-2 w-[182px] rounded-lg border border-[#10b981]/40 px-2.5 py-2 text-[11px] leading-relaxed text-[var(--text-secondary)] shadow-[0_10px_28px_rgba(3,8,20,0.4)] backdrop-blur-md sm:hidden"
                  >
                    Yeni not eklemek için + düğmesine dokun.
                    <div className="bg-[var(--bg-card)]/95 absolute -top-1.5 right-3 h-3 w-3 rotate-45 border-l border-t border-[#10b981]/40" />
                  </div>
                )}
                <Link
                  href="/new-post"
                  onClick={handleNewNoteClick}
                  aria-label="Yeni not ekle"
                  aria-describedby={showNewNoteHint ? "new-note-mobile-hint" : undefined}
                  title="Yeni not ekle"
                  className="dn-new-note-soft-glow dn-new-note-animate group flex h-10 items-center justify-center gap-1 rounded-xl border border-[#10b981]/45 px-3 text-white transition-all duration-150 active:scale-[0.97] sm:h-auto sm:min-w-0 sm:gap-1.5 sm:rounded-lg sm:border-0 sm:px-3 sm:py-1.5 sm:text-[13px] sm:font-medium"
                  style={{
                    background: "linear-gradient(145deg, #34d399 0%, #10b981 55%, #059669 100%)",
                  }}
                >
                  {/* Plus icon */}
                  <span className="flex items-center justify-center">
                    <PlusIcon
                      size={14}
                      weight="bold"
                      className="flex-shrink-0 transition-transform duration-150 group-active:scale-90"
                    />
                  </span>
                  <span className="text-[12px] font-medium sm:text-[13px]">
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
                    title={session.user?.name ?? ""}
                    className={`flex h-10 w-10 flex-shrink-0 select-none items-center justify-center rounded-full text-[12px] font-bold text-[#34d399] transition-all duration-150 sm:h-10 sm:w-10 sm:text-[13px] sm:shadow-none ${
                      showUserMenu
                        ? "bg-[var(--bg-raised)] shadow-[0_0_0_2px_#10b981,0_8px_20px_rgba(3,8,20,0.28)]"
                        : "bg-[var(--bg-raised)] shadow-[0_0_0_1px_var(--border),0_6px_18px_rgba(3,8,20,0.24)] hover:shadow-[0_0_0_1px_#10b981,0_8px_20px_rgba(3,8,20,0.28)]"
                    }`}
                  >
                    {userInitial}
                  </button>

                  {/* ── Dropdown menu ── */}
                  {showUserMenu && (
                    <UserDropdownMenu
                      session={session}
                      userUsername={userUsername}
                      userInitial={userInitial}
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
                  className={`flex h-9 shrink-0 snap-start items-center justify-center rounded-lg px-4 text-[13px] font-medium transition-all duration-150 active:scale-95 ${
                    activeCategory === "all"
                      ? "bg-gradient-to-r from-[#10b981] to-[#059669] text-white shadow-[0_3px_14px_rgba(16,185,129,0.28)]"
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
                      className={`flex h-9 shrink-0 snap-start items-center justify-center rounded-lg px-3.5 text-[13px] font-medium transition-all duration-150 active:scale-95 ${
                        isActive
                          ? "bg-gradient-to-r from-[#10b981] to-[#059669] text-white shadow-[0_3px_14px_rgba(16,185,129,0.28)]"
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
            <NavTab active={activeCategory === "all"} onClick={() => router.push("/notes")}>
              Son Notlar
            </NavTab>
            {FIXED_CATEGORIES.map((cat) => (
              <NavTab
                key={cat}
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
      <main className={hideMobileBottomTabs ? "pb-0" : "pb-20 sm:pb-0"}>{children}</main>

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
  active,
  onClick,
  children,
}: {
  readonly active: boolean;
  readonly onClick: () => void;
  readonly children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 whitespace-nowrap border-b-2 px-3.5 pb-[11px] pt-[10px] text-[13px] font-semibold transition-all duration-150 ${
        active
          ? "border-[#10b981] text-[var(--text-primary)]"
          : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      }`}
    >
      {children}
    </button>
  );
}
