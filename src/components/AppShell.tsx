"use client";
import React, { useRef, useState, useEffect, Suspense } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Toaster } from "react-hot-toast";
import { useSession, signOut } from "next-auth/react";
import { SearchBar } from "@/components/SearchBar";
import { FIXED_CATEGORIES } from "@/lib/categories";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [userUsername, setUserUsername] = useState<string | null>(null);
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

  const getActiveCategory = () => {
    if (pathname === "/notes") return "all";
    const match = pathname.match(/^\/category\/(.+)/);
    return match ? decodeURIComponent(match[1]) : "";
  };
  const activeCategory = getActiveCategory();
  const isDiscover = pathname === "/discover";
  const isFeed = pathname === "/feed";
  const isRecommended = pathname === "/recommended";
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
      <header className="sticky top-0 z-40 border-b border-[#1a1e2e] bg-[#0c0e16]">
        <div className="mx-auto max-w-5xl pl-0 pr-3 sm:px-6">
          {/* ══ TOP ROW ══ */}
          <div className="flex h-[60px] items-center justify-between">
            {/* Logo */}
            <Link href="/notes" className="flex-shrink-0 leading-[0]">
              <Image
                src="/app-logo.png"
                alt="DigyNotes"
                width={190}
                height={56}
                className="block h-auto w-[168px] object-contain sm:w-[215px]"
                priority
                unoptimized
              />
            </Link>

            {/* Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Search */}
              <Suspense>
                <SearchBar />
              </Suspense>

              {/* + Yeni Not */}
              <Link
                href="/new-post"
                className="flex items-center gap-2 whitespace-nowrap rounded-lg bg-[#c9a84c] px-4 py-2 text-sm font-semibold text-[#0c0c0c] shadow-[0_0_0_1px_rgba(201,168,76,0.3),0_4px_16px_rgba(201,168,76,0.15)] transition-all duration-150 hover:bg-[#d4b05a] active:scale-[0.97]"
              >
                {/* Plus icon */}
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="currentColor"
                  className="flex-shrink-0"
                >
                  <path d="M6.75 1.25a.75.75 0 0 0-1.5 0V5.25H1.25a.75.75 0 0 0 0 1.5H5.25v4a.75.75 0 0 0 1.5 0V6.75h4a.75.75 0 0 0 0-1.5H6.75V1.25Z" />
                </svg>
                <span className="hidden sm:inline">Yeni Not</span>
              </Link>

              {/* Avatar */}
              {session && (
                <div className="relative pl-1 sm:pl-2" ref={userMenuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    title={session.user?.name ?? ""}
                    className={`flex h-9 w-9 flex-shrink-0 select-none items-center justify-center rounded-full text-[13px] font-bold text-[#c9a84c] transition-all duration-150 ${
                      showUserMenu
                        ? "bg-[#1e2d4a] shadow-[0_0_0_2px_#3a5999]"
                        : "bg-[#141925] shadow-[0_0_0_1px_rgba(42,62,120,0.5)] hover:bg-[#1a2133] hover:shadow-[0_0_0_1px_rgba(58,90,170,0.6)]"
                    }`}
                  >
                    {userInitial}
                  </button>

                  {/* ── Dropdown menu ── */}
                  {showUserMenu && (
                    <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-56 overflow-hidden rounded-xl border border-[#1e2235] bg-[#0d0f1a] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.4),0_20px_50px_-8px_rgba(0,0,0,0.8)]">
                      {/* User info */}
                      <div className="flex items-center gap-3 border-b border-[#1a1e2e] px-3.5 py-3">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-[#c9a84c]/20 bg-[#c9a84c]/10">
                          <span className="text-xs font-bold text-[#c9a84c]">{userInitial}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold leading-tight text-[#f0ede8]">
                            {session.user?.name}
                          </p>
                          <p className="mt-0.5 truncate text-[10px] leading-tight text-[#444]">
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
                            className="flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-[#999] transition-colors duration-100 hover:bg-[#131525] hover:text-[#f0ede8]"
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
                          className="flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-[#999] transition-colors duration-100 hover:bg-[#131525] hover:text-[#f0ede8]"
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
                          Profil Ayarları
                        </Link>
                      </div>

                      <div className="border-t border-[#1a1e2e]" />

                      <div className="py-1">
                        <button
                          onClick={() => {
                            localStorage.removeItem("dn_username");
                            signOut({ callbackUrl: "/" });
                          }}
                          className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-[13px] text-[#666] transition-colors duration-100 hover:bg-[#e53e3e]/5 hover:text-[#e53e3e]"
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

          {/* ── Mobile: yatay kaydırmalı kategori şeridi (yalnızca notlar/kategori sayfaları) ── */}
          {(pathname === "/notes" || pathname.startsWith("/category/")) && (
            <div className="flex items-center justify-between gap-1 pb-3 pt-2 sm:hidden">
              {FIXED_CATEGORIES.map((cat) => {
                const isActive = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => router.push(`/category/${encodeURIComponent(cat)}`)}
                    className={`flex flex-1 items-center justify-center rounded-lg py-2 text-[12px] font-semibold transition-all duration-150 active:scale-95 ${
                      isActive
                        ? "bg-[#c9a84c] text-[#0a0a0a] shadow-[0_2px_12px_rgba(201,168,76,0.35)]"
                        : "bg-[#0d0f1a] text-[#6878a8] ring-1 ring-[#1e2235] active:bg-[#141828] active:text-[#9aabcc]"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          )}


          {/* ── Desktop: scrollable single row ── */}
          <div ref={scrollRef} className="scrollbar-hide hidden items-center overflow-x-auto sm:flex">
            {FIXED_CATEGORIES.map((cat) => (
              <NavTab
                key={cat}
                active={activeCategory === cat}
                onClick={() => router.push(`/category/${encodeURIComponent(cat)}`)}
              >
                {cat}
              </NavTab>
            ))}

            {/* spacer + ayraç + global nav */}
            <div className="min-w-[24px] flex-1" />
            <div className="mx-2 flex flex-shrink-0 items-center self-stretch">
              <div className="h-4 w-px bg-[#2a2a3e]" />
            </div>
            <div className="flex flex-shrink-0 items-center gap-0.5 px-1">
              <Link
                href="/feed"
                className={`flex flex-shrink-0 items-center gap-1 whitespace-nowrap border-b-2 px-2.5 pb-[11px] pt-[10px] text-[13px] font-semibold transition-all duration-150 ${
                  isFeed
                    ? "border-[#c9a84c] text-[#f0ede8]"
                    : "border-transparent text-[#6070a0] hover:text-[#c0c8e8]"
                }`}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 11l19-9-9 19-2-8-8-2z" />
                </svg>
                Akış
              </Link>
              <Link
                href="/recommended"
                className={`flex flex-shrink-0 items-center gap-1 whitespace-nowrap border-b-2 px-2.5 pb-[11px] pt-[10px] text-[13px] font-semibold transition-all duration-150 ${
                  isRecommended
                    ? "border-[#c9a84c] text-[#f0ede8]"
                    : "border-transparent text-[#6070a0] hover:text-[#c0c8e8]"
                }`}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                Öneriler
              </Link>
              <Link
                href="/discover"
                className={`flex flex-shrink-0 items-center gap-1 whitespace-nowrap border-b-2 px-2.5 pb-[11px] pt-[10px] text-[13px] font-semibold transition-all duration-150 ${
                  isDiscover
                    ? "border-[#c9a84c] text-[#f0ede8]"
                    : "border-transparent text-[#6070a0] hover:text-[#c0c8e8]"
                }`}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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
      <main className="pb-16 sm:pb-0">{children}</main>

      {/* ─── MOBILE BOTTOM TAB BAR ─── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#1a1e2e] bg-[#0c0e16] sm:hidden">
        <div className="flex items-center" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
          <Link
            href="/notes"
            className={`flex flex-1 flex-col items-center gap-1 py-2.5 transition-colors duration-150 ${
              isNotes ? "text-[#c9a84c]" : "text-[#444]"
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="9" y1="13" x2="15" y2="13" />
              <line x1="9" y1="17" x2="13" y2="17" />
            </svg>
            <span className="text-[10px] font-medium">Notlarım</span>
          </Link>
          <Link
            href="/feed"
            className={`flex flex-1 flex-col items-center gap-1 py-2.5 transition-colors duration-150 ${
              isFeed ? "text-[#c9a84c]" : "text-[#444]"
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 11l19-9-9 19-2-8-8-2z" />
            </svg>
            <span className="text-[10px] font-medium">Akış</span>
          </Link>
          <Link
            href="/recommended"
            className={`flex flex-1 flex-col items-center gap-1 py-2.5 transition-colors duration-150 ${
              isRecommended ? "text-[#c9a84c]" : "text-[#444]"
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <span className="text-[10px] font-medium">Öneriler</span>
          </Link>
          <Link
            href="/discover"
            className={`flex flex-1 flex-col items-center gap-1 py-2.5 transition-colors duration-150 ${
              isDiscover ? "text-[#c9a84c]" : "text-[#444]"
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
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
            className={`flex flex-1 flex-col items-center gap-1 py-2.5 transition-colors duration-150 ${
              isProfile ? "text-[#c9a84c]" : "text-[#444]"
            }`}
          >
            <div
              className={`flex h-[18px] w-[18px] items-center justify-center rounded-full text-[9px] font-bold transition-colors duration-150 ${
                isProfile
                  ? "bg-[#c9a84c]/20 text-[#c9a84c] ring-1 ring-[#c9a84c]/50"
                  : "bg-[#1a1e2e] text-[#555] ring-1 ring-[#2a2e4e]"
              }`}
            >
              {userInitial}
            </div>
            <span className="text-[10px] font-medium">Profil</span>
          </button>
        </div>
      </nav>

      {/* ─── TOAST ─── */}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#161616",
            color: "#e8eaf6",
            border: "1px solid #2a2a2a",
            fontSize: "14px",
            borderRadius: "10px",
          },
          success: { iconTheme: { primary: "#c9a84c", secondary: "#0c0c0c" } },
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
          ? "border-[#c9a84c] text-[#f0ede8]"
          : "border-transparent text-[#6070a0] hover:text-[#c0c8e8]"
      }`}
    >
      {children}
    </button>
  );
}
