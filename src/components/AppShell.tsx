"use client";
import React, { useRef, useState, useEffect, Suspense } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Toaster } from "react-hot-toast";
import { useSession, signOut } from "next-auth/react";
import AddCategoryModal from "@/components/AddCategoryModal";
import { SearchBar } from "@/components/SearchBar";
import { Category } from "@/types";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [userUsername, setUserUsername] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => {});
    fetch("/api/users/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data?.username) setUserUsername(data.username); })
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
  const userInitial = session?.user?.name?.charAt(0)?.toUpperCase() ?? "?";

  const handleCategoryAdded = (category: Category) => {
    setCategories((prev) =>
      [...prev, category].sort((a, b) => a.name.localeCompare(b.name))
    );
    setIsModalOpen(false);
    router.push(`/category/${encodeURIComponent(category.name)}`);
  };

  return (
    <>
      {/* ─── HEADER ─── */}
      <header className="bg-[#0c0c0c] border-b border-[#1a1a1a] sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">

          {/* ══ TOP ROW ══ */}
          <div className="flex items-center justify-between h-[60px]">

            {/* Logo */}
            <Link href="/notes" className="leading-[0] flex-shrink-0">
              <Image
                src="/app-logo.png"
                alt="DigyNotes"
                width={190}
                height={56}
                className="object-contain block w-[168px] sm:w-[215px] h-auto"
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
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold
                           bg-[#c9a84c] text-[#0c0c0c] whitespace-nowrap
                           hover:bg-[#d4b05a] active:scale-[0.97]
                           transition-all duration-150
                           shadow-[0_0_0_1px_rgba(201,168,76,0.3),0_4px_16px_rgba(201,168,76,0.15)]"
              >
                {/* Plus icon */}
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" className="flex-shrink-0">
                  <path d="M6.75 1.25a.75.75 0 0 0-1.5 0V5.25H1.25a.75.75 0 0 0 0 1.5H5.25v4a.75.75 0 0 0 1.5 0V6.75h4a.75.75 0 0 0 0-1.5H6.75V1.25Z"/>
                </svg>
                <span className="hidden sm:inline">Yeni Not</span>
              </Link>

              {/* Avatar */}
              {session && (
                <div className="relative pl-1 sm:pl-2" ref={userMenuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    title={session.user?.name ?? ""}
                    className={`w-9 h-9 rounded-full flex items-center justify-center
                               text-[13px] font-bold text-[#c9a84c] select-none flex-shrink-0
                               transition-all duration-150
                               ${showUserMenu
                                 ? "bg-[#c9a84c]/20 shadow-[0_0_0_2px_#c9a84c]"
                                 : "bg-[#c9a84c]/10 shadow-[0_0_0_1px_rgba(201,168,76,0.2)] hover:shadow-[0_0_0_1px_rgba(201,168,76,0.5)] hover:bg-[#c9a84c]/15"
                               }`}
                  >
                    {userInitial}
                  </button>

                  {/* ── Dropdown menu ── */}
                  {showUserMenu && (
                    <div className="absolute right-0 top-[calc(100%+6px)] w-56
                                    bg-[#111111] border border-[#222222]
                                    rounded-xl overflow-hidden z-50
                                    shadow-[0_4px_6px_-1px_rgba(0,0,0,0.4),0_20px_50px_-8px_rgba(0,0,0,0.8)]">

                      {/* User info */}
                      <div className="px-3.5 py-3 border-b border-[#1e1e1e] flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#c9a84c]/10 border border-[#c9a84c]/20
                                        flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-[#c9a84c]">{userInitial}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-[#f0ede8] truncate leading-tight">
                            {session.user?.name}
                          </p>
                          <p className="text-[10px] text-[#444] truncate leading-tight mt-0.5">
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
                            className="flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-[#999]
                                       hover:bg-[#1c1c1c] hover:text-[#f0ede8] transition-colors duration-100"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                              <circle cx="12" cy="8" r="4"/>
                              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                            </svg>
                            Profilim
                          </Link>
                        )}
                        <Link
                          href="/profile/settings"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-[#999]
                                     hover:bg-[#1c1c1c] hover:text-[#f0ede8] transition-colors duration-100"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                          Profil Ayarları
                        </Link>
                      </div>

                      <div className="border-t border-[#1e1e1e]"/>

                      <div className="py-1">
                        <button
                          onClick={() => signOut({ callbackUrl: "/" })}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px]
                                     text-[#666] hover:text-[#e53e3e] hover:bg-[#e53e3e]/5
                                     transition-colors duration-100 text-left"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                            <polyline points="16 17 21 12 16 7"/>
                            <line x1="21" y1="12" x2="9" y2="12"/>
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

          {/* ══ CATEGORY STRIP ══
               Left:  personal category filter tabs
               Right: Keşfet (global discovery — visually separated)           */}
          <div
            ref={scrollRef}
            className="flex items-center overflow-x-auto scrollbar-hide"
          >
            {/* Son Yazılar */}
            <NavTab
              active={activeCategory === "all"}
              onClick={() => router.push("/notes")}
            >
              Son Yazılar
            </NavTab>

            {/* User categories */}
            {categories.map((cat) => (
              <NavTab
                key={cat.id}
                active={activeCategory === cat.name}
                onClick={() => router.push(`/category/${encodeURIComponent(cat.name)}`)}
              >
                {cat.name}
              </NavTab>
            ))}

            {/* + Add category — after last category */}
            <button
              onClick={() => setIsModalOpen(true)}
              aria-label="Kategori ekle"
              title="Kategori Ekle"
              className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded ml-1 mb-[2px]
                         text-[#383838] hover:text-[#c9a84c] hover:bg-[#181818]
                         transition-colors duration-150"
            >
              <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor">
                <path d="M6.75 1.25a.75.75 0 0 0-1.5 0V5.25H1.25a.75.75 0 0 0 0 1.5H5.25v4a.75.75 0 0 0 1.5 0V6.75h4a.75.75 0 0 0 0-1.5H6.75V1.25Z"/>
              </svg>
            </button>

            {/* ── Spacer pushes Keşfet to the right ── */}
            <div className="flex-1 min-w-[24px]" />

            {/* Thin divider */}
            <div className="w-px h-3.5 bg-[#282828] flex-shrink-0 mx-2" />

            {/* Topluluk — global user discovery, right-aligned */}
            <Link
              href="/discover"
              className={`flex-shrink-0 flex items-center gap-1.5 px-2 pb-[11px] pt-[10px]
                          text-[13px] font-medium whitespace-nowrap border-b-2
                          transition-all duration-150 ${
                isDiscover
                  ? "border-[#c9a84c] text-[#c9a84c]"
                  : "border-transparent text-[#555] hover:text-[#aaa]"
              }`}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              Topluluk
            </Link>
          </div>

        </div>
      </header>

      {/* ─── MAIN ─── */}
      <main>{children}</main>

      {/* ─── MODALS ─── */}
      <AddCategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleCategoryAdded}
      />

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
      className={`flex-shrink-0 px-3.5 pb-[11px] pt-[10px] text-[12px] font-medium
                  whitespace-nowrap border-b-2 transition-all duration-150 ${
        active
          ? "border-[#c9a84c] text-[#f0ede8]"
          : "border-transparent text-[#555] hover:text-[#c0c0c0]"
      }`}
    >
      {children}
    </button>
  );
}
