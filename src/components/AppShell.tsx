"use client";
import React, { useRef, useState, useEffect, Suspense } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Toaster } from "react-hot-toast";
import { useSession, signOut } from "next-auth/react";
import { Bell } from "@phosphor-icons/react";
import { SearchBar } from "@/components/SearchBar";
import { FIXED_CATEGORIES, getCategoryLabel, normalizeCategory } from "@/lib/categories";
import { useTheme } from "@/components/ThemeProvider";

const NEW_NOTE_HINT_KEY = "dn_new_note_hint_count";

export default function AppShell({ children }: { children: React.ReactNode }) {
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
        const timer = window.setTimeout(() => setShowNewNoteHint(false), 5000);
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
    window.addEventListener("notifications:refresh", handleRefresh);
    return () => {
      active = false;
      window.removeEventListener("notifications:refresh", handleRefresh);
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
    const match = pathname.match(/^\/category\/(.+)/);
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
                className={`relative hidden h-10 w-10 items-center justify-center rounded-lg border-transparent bg-transparent text-[var(--text-secondary)] shadow-none transition-colors duration-200 hover:text-[var(--gold)] sm:flex ${
                  isNotifications ? "text-[var(--gold)]" : ""
                }`}
              >
                <Bell
                  size={16}
                  weight={notificationCount > 0 || isNotifications ? "fill" : "regular"}
                />
                {notificationCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex min-w-[18px] items-center justify-center rounded-full border border-[var(--bg-header)] bg-[var(--gold)] px-1 text-[10px] font-bold leading-[18px] text-[var(--text-on-accent)]">
                    {notificationCount > 9 ? "9+" : notificationCount}
                  </span>
                )}
              </Link>

              {/* Theme toggle — hidden on mobile, moved to settings */}
              <button
                onClick={toggleTheme}
                title={theme === "dark" ? "Açık temaya geç" : "Koyu temaya geç"}
                className="hidden h-10 w-10 items-center justify-center rounded-lg border-transparent bg-transparent text-[var(--text-secondary)] shadow-none transition-colors duration-200 hover:text-[var(--gold)] sm:flex"
              >
                {theme === "dark" ? (
                  /* Sun icon */
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="4" />
                    <line x1="12" y1="2" x2="12" y2="4" />
                    <line x1="12" y1="20" x2="12" y2="22" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="2" y1="12" x2="4" y2="12" />
                    <line x1="20" y1="12" x2="22" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                  </svg>
                ) : (
                  /* Moon icon */
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                )}
              </button>

              {/* + Yeni Not */}
              <div className="relative">
                {showNewNoteHint && (
                  <div
                    id="new-note-mobile-hint"
                    className="bg-[var(--bg-card)]/95 absolute right-0 top-full z-50 mt-2 w-[182px] rounded-lg border border-[#c4a24b]/40 px-2.5 py-2 text-[11px] leading-relaxed text-[var(--text-secondary)] shadow-[0_10px_28px_rgba(3,8,20,0.4)] backdrop-blur-md sm:hidden"
                  >
                    Yeni not eklemek için + düğmesine dokun.
                    <div className="bg-[var(--bg-card)]/95 absolute -top-1.5 right-3 h-3 w-3 rotate-45 border-l border-t border-[#c4a24b]/40" />
                  </div>
                )}
                <Link
                  href="/new-post"
                  onClick={handleNewNoteClick}
                  aria-label="Yeni not ekle"
                  aria-describedby={showNewNoteHint ? "new-note-mobile-hint" : undefined}
                  title="Yeni not ekle"
                  className="dn-new-note-soft-glow dn-new-note-animate group flex h-10 items-center justify-center gap-1 rounded-xl border border-[#e6c976]/45 px-3 text-[var(--text-on-accent)] transition-all duration-150 active:scale-[0.97] sm:h-auto sm:min-w-0 sm:gap-1.5 sm:rounded-lg sm:border-0 sm:bg-[var(--gold)] sm:px-3 sm:py-1.5 sm:text-[13px] sm:font-medium sm:hover:bg-[var(--gold-light)]"
                  style={{
                    background:
                      "linear-gradient(145deg, var(--gold-light) 0%, var(--gold) 64%, #a98030 100%)",
                  }}
                >
                  {/* Plus icon */}
                  <span className="flex items-center justify-center">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 12 12"
                      fill="currentColor"
                      className="flex-shrink-0 transition-transform duration-150 group-active:scale-90"
                    >
                      <path d="M6.75 1.25a.75.75 0 0 0-1.5 0V5.25H1.25a.75.75 0 0 0 0 1.5H5.25v4a.75.75 0 0 0 1.5 0V6.75h4a.75.75 0 0 0 0-1.5H6.75V1.25Z" />
                    </svg>
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
                    className={`flex h-10 w-10 flex-shrink-0 select-none items-center justify-center rounded-full text-[12px] font-bold text-[var(--gold)] transition-all duration-150 sm:h-10 sm:w-10 sm:text-[13px] sm:shadow-none ${
                      showUserMenu
                        ? "bg-[var(--bg-raised)] shadow-[0_0_0_2px_var(--gold),0_8px_20px_rgba(3,8,20,0.28)]"
                        : "bg-[var(--bg-raised)] shadow-[0_0_0_1px_var(--border),0_6px_18px_rgba(3,8,20,0.24)] hover:shadow-[0_0_0_1px_var(--gold),0_8px_20px_rgba(3,8,20,0.28)]"
                    }`}
                  >
                    {userInitial}
                  </button>

                  {/* ── Dropdown menu ── */}
                  {showUserMenu && (
                    <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-56 overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-header)] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.4),0_20px_50px_-8px_rgba(0,0,0,0.6)]">
                      {/* User info */}
                      <div className="flex items-center gap-3 border-b border-[var(--border-header)] px-3.5 py-3">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-[#c4a24b]/20 bg-[#c4a24b]/10">
                          <span className="text-xs font-bold text-[var(--gold)]">
                            {userInitial}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold leading-tight text-[var(--text-primary)]">
                            {session.user?.name}
                          </p>
                          <p className="mt-0.5 truncate text-[10px] leading-tight text-[var(--text-muted)]">
                            {session.user?.email}
                          </p>
                        </div>
                      </div>

                      {/* Nav items */}
                      <div className="py-1">
                        {userUsername && (
                          <Link
                            href={`/profile/${userUsername}`}
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-2.5 px-3.5 py-3 text-[13px] text-[var(--text-secondary)] transition-colors duration-100 hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)]"
                          >
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                            >
                              <circle cx="12" cy="8" r="4" />
                              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                            </svg>
                            Profilim
                          </Link>
                        )}
                        <Link
                          href="/profile/settings"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-[var(--text-secondary)] transition-colors duration-100 hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)]"
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                          >
                            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                          Ayarlar
                        </Link>
                      </div>

                      {/* Mobile-only: Bildirimler & Tema — compact row */}
                      <div className="flex items-center border-b border-t border-[var(--border-header)] sm:hidden">
                        <Link
                          href="/notifications"
                          onClick={() => setShowUserMenu(false)}
                          className="flex flex-1 items-center justify-center gap-2 py-2.5 text-[13px] text-[var(--text-secondary)] transition-colors duration-100 hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)]"
                        >
                          <span className="relative">
                            <Bell size={15} weight={notificationCount > 0 ? "fill" : "regular"} />
                            {notificationCount > 0 && (
                              <span className="absolute -right-1.5 -top-1.5 flex min-w-[14px] items-center justify-center rounded-full bg-[var(--gold)] px-0.5 text-[8px] font-bold leading-[14px] text-[var(--text-on-accent)]">
                                {notificationCount > 9 ? "9+" : notificationCount}
                              </span>
                            )}
                          </span>
                          Bildirimler
                        </Link>
                        <div className="h-5 w-px bg-[var(--border-header)]" />
                        <button
                          onClick={() => {
                            toggleTheme();
                            setShowUserMenu(false);
                          }}
                          className="flex flex-1 items-center justify-center gap-2 py-2.5 text-[13px] text-[var(--text-secondary)] transition-colors duration-100 hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)]"
                        >
                          {theme === "dark" ? (
                            <svg
                              width="15"
                              height="15"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <circle cx="12" cy="12" r="4" />
                              <line x1="12" y1="2" x2="12" y2="4" />
                              <line x1="12" y1="20" x2="12" y2="22" />
                              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                              <line x1="2" y1="12" x2="4" y2="12" />
                              <line x1="20" y1="12" x2="22" y2="12" />
                              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                            </svg>
                          ) : (
                            <svg
                              width="15"
                              height="15"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                            </svg>
                          )}
                          {theme === "dark" ? "Açık Tema" : "Koyu Tema"}
                        </button>
                      </div>

                      {/* Nav items continued */}
                      <div className="py-1">
                        <Link
                          href="/collections"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-[var(--text-secondary)] transition-colors duration-100 hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)]"
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                          </svg>
                          Koleksiyonlar
                        </Link>
                        <Link
                          href="/watchlist"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-[var(--text-secondary)] transition-colors duration-100 hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)]"
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                          </svg>
                          İstek Listesi
                        </Link>
                        <Link
                          href="/stats"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-[var(--text-secondary)] transition-colors duration-100 hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)]"
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M4 19V10" />
                            <path d="M10 19V5" />
                            <path d="M16 19v-7" />
                            <path d="M22 19v-3" />
                          </svg>
                          İstatistikler
                        </Link>
                        <Link
                          href="/stats/year-in-review"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-[var(--text-secondary)] transition-colors duration-100 hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)]"
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <rect x="3" y="4" width="18" height="18" rx="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                          Yılın Özeti
                        </Link>
                      </div>

                      {isAdmin && (
                        <>
                          <div className="border-t border-[var(--border-header)]" />
                          <div className="py-1">
                            <Link
                              href="/admin"
                              onClick={() => setShowUserMenu(false)}
                              className="bg-[#c4a24b]/8 hover:bg-[#c4a24b]/14 mx-1 flex items-center gap-2.5 rounded-lg border border-[#c4a24b]/25 px-3 py-2 text-[13px] font-semibold text-[var(--gold)] transition-colors duration-100 hover:border-[#c4a24b]/40 hover:text-[var(--gold-light)]"
                            >
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                              >
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                              </svg>
                              Admin Paneli
                              <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[var(--gold)] opacity-85 shadow-[0_0_0_3px_rgba(196,162,75,0.14)]" />
                            </Link>
                          </div>
                        </>
                      )}

                      <div className="border-t border-[var(--border-header)]" />

                      <div className="py-1">
                        <button
                          onClick={() => {
                            localStorage.removeItem("dn_username");
                            signOut({ callbackUrl: "/" });
                          }}
                          className="hover:bg-[var(--danger)]/5 flex w-full items-center gap-2.5 px-3.5 py-3 text-left text-[13px] text-[var(--text-muted)] transition-colors duration-100 hover:text-[var(--danger)]"
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                          >
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                          </svg>
                          Çıkış Yap
                        </button>
                      </div>
                    </div>
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
                      ? "bg-[var(--gold)] text-[var(--text-on-accent)] shadow-[0_3px_14px_rgba(196,162,75,0.28)]"
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
                          ? "bg-[var(--gold)] text-[var(--text-on-accent)] shadow-[0_3px_14px_rgba(196,162,75,0.28)]"
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
            <div className="flex flex-shrink-0 items-center gap-0.5 px-1">
              <Link
                href="/feed"
                className={`flex flex-shrink-0 items-center gap-1 whitespace-nowrap border-b-2 px-2.5 pb-[11px] pt-[10px] text-[13px] font-semibold transition-all duration-150 ${
                  isFeed
                    ? "border-[var(--gold)] text-[var(--text-primary)]"
                    : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 11l19-9-9 19-2-8-8-2z" />
                </svg>
                Akış
              </Link>
              <Link
                href="/recommended"
                className={`flex flex-shrink-0 items-center gap-1 whitespace-nowrap border-b-2 px-2.5 pb-[11px] pt-[10px] text-[13px] font-semibold transition-all duration-150 ${
                  isRecommended
                    ? "border-[var(--gold)] text-[var(--text-primary)]"
                    : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                Öneriler
              </Link>
              <Link
                href="/discover"
                className={`flex flex-shrink-0 items-center gap-1 whitespace-nowrap border-b-2 px-2.5 pb-[11px] pt-[10px] text-[13px] font-semibold transition-all duration-150 ${
                  isDiscover
                    ? "border-[var(--gold)] text-[var(--text-primary)]"
                    : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                Keşfet
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ─── MAIN ─── */}
      <main className={hideMobileBottomTabs ? "pb-0" : "pb-20 sm:pb-0"}>{children}</main>

      {/* ─── MOBILE BOTTOM TAB BAR ─── */}
      {!hideMobileBottomTabs && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border-header)] bg-[var(--bg-header)] backdrop-blur-xl sm:hidden">
          <div
            className="mx-auto flex max-w-xl items-center gap-1 px-1.5"
            style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
          >
            <Link
              href="/notes"
              className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-2.5 transition-all duration-150 ${
                isNotes ? "bg-[#c4a24b]/14 text-[var(--gold)]" : "text-[var(--text-secondary)]"
              }`}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="9" y1="13" x2="15" y2="13" />
                <line x1="9" y1="17" x2="13" y2="17" />
              </svg>
              <span className="text-[10px] font-medium">Notlarım</span>
            </Link>
            <Link
              href="/feed"
              className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-2.5 transition-all duration-150 ${
                isFeed ? "bg-[#c4a24b]/14 text-[var(--gold)]" : "text-[var(--text-secondary)]"
              }`}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 11l19-9-9 19-2-8-8-2z" />
              </svg>
              <span className="text-[10px] font-medium">Akış</span>
            </Link>
            <Link
              href="/recommended"
              className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-2.5 transition-all duration-150 ${
                isRecommended
                  ? "bg-[#c4a24b]/14 text-[var(--gold)]"
                  : "text-[var(--text-secondary)]"
              }`}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <span className="text-[10px] font-medium">Öneriler</span>
            </Link>
            <Link
              href="/discover"
              className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-2.5 transition-all duration-150 ${
                isDiscover ? "bg-[#c4a24b]/14 text-[var(--gold)]" : "text-[var(--text-secondary)]"
              }`}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span className="text-[10px] font-medium">Keşfet</span>
            </Link>
            <button
              onClick={() =>
                router.push(userUsername ? `/profile/${userUsername}` : "/profile/settings")
              }
              className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-2.5 transition-all duration-150 ${
                isProfile ? "bg-[#c4a24b]/14 text-[var(--gold)]" : "text-[var(--text-secondary)]"
              }`}
            >
              <div
                className={`flex h-[18px] w-[18px] items-center justify-center rounded-full text-[9px] font-bold transition-colors duration-150 ${
                  isProfile
                    ? "bg-[#c4a24b]/20 text-[var(--gold)] ring-1 ring-[#c4a24b]/50"
                    : "bg-[var(--bg-raised)] text-[var(--text-muted)] ring-1 ring-[var(--border)]"
                }`}
              >
                {userInitial}
              </div>
              <span className="text-[10px] font-medium">Profil</span>
            </button>
          </div>
        </nav>
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
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 whitespace-nowrap border-b-2 px-3.5 pb-[11px] pt-[10px] text-[13px] font-semibold transition-all duration-150 ${
        active
          ? "border-[var(--gold)] text-[var(--text-primary)]"
          : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      }`}
    >
      {children}
    </button>
  );
}
