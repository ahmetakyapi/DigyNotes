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
  const scrollRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCategories)
      .catch(console.error);
  }, []);

  // Close user menu on outside click
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

  const handleCategoryAdded = (category: Category) => {
    setCategories((prev) =>
      [...prev, category].sort((a, b) => a.name.localeCompare(b.name))
    );
    setIsModalOpen(false);
    router.push(`/category/${encodeURIComponent(category.name)}`);
  };

  const userInitial = session?.user?.name?.charAt(0)?.toUpperCase() ?? "?";

  return (
    <>
      {/* ─── HEADER ─── */}
      <header className="bg-[#0f1117]/95 backdrop-blur-sm border-b border-[#252d40] sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          {/* Top row: Logo + Actions */}
          <div className="flex items-center justify-between py-4">
            <Link href="/notes" className="flex items-center leading-[0]">
              <Image
                src="/digy-notes-logo.png"
                alt="DigyNotes"
                width={190}
                height={56}
                className="object-contain block w-[120px] sm:w-[190px] h-auto"
                priority
              />
            </Link>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Suspense>
                <SearchBar />
              </Suspense>
              <Link
                href="/new-post"
                className="flex-shrink-0 self-center px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm
                           font-semibold bg-[#c9a84c] text-[#0f1117] rounded-md
                           hover:bg-[#e0c068] transition-colors duration-200 shadow-md shadow-[#c9a84c]/20
                           whitespace-nowrap"
              >
                <span className="sm:hidden" aria-hidden="true">+</span>
                <span className="hidden sm:inline">+ Yeni Not</span>
              </Link>

              {/* User menu */}
              {session && (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="w-8 h-8 rounded-full bg-[#c9a84c]/15 border border-[#c9a84c]/30
                               flex items-center justify-center text-sm font-bold text-[#c9a84c]
                               hover:bg-[#c9a84c]/25 transition-colors"
                    title={session.user?.name ?? ""}
                  >
                    {userInitial}
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 top-10 w-52 bg-[#161616] border border-[#252d40]
                                    rounded-xl shadow-2xl shadow-black/60 overflow-hidden z-50">
                      <div className="px-4 py-3 border-b border-[#252d40]">
                        <p className="text-xs font-semibold text-[#e8eaf6] truncate">
                          {session.user?.name}
                        </p>
                        <p className="text-[10px] text-[#4a5568] truncate mt-0.5">
                          {session.user?.email}
                        </p>
                      </div>
                      <button
                        onClick={() => signOut({ callbackUrl: "/" })}
                        className="w-full flex items-center gap-2 px-4 py-3 text-sm text-[#e53e3e]
                                   hover:bg-[#e53e3e]/8 transition-colors text-left"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" strokeLinecap="round"/>
                          <polyline points="16,17 21,12 16,7"/>
                          <line x1="21" y1="12" x2="9" y2="12"/>
                        </svg>
                        Çıkış Yap
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Category nav row */}
          <div
            ref={scrollRef}
            className="flex items-center gap-0 pb-0 overflow-x-auto scrollbar-hide"
          >
            {/* Add category button */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full
                         text-[#8892b0] hover:text-[#c9a84c] hover:bg-[#151b2d] transition-colors mr-1"
              aria-label="Kategori ekle"
              title="Kategori Ekle"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                <path d="M7 1a1 1 0 011 1v4h4a1 1 0 110 2H8v4a1 1 0 11-2 0V8H2a1 1 0 110-2h4V2a1 1 0 011-1z" />
              </svg>
            </button>

            {/* Son Yazılar / All */}
            <button
              onClick={() => router.push("/notes")}
              className={`flex-shrink-0 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeCategory === "all"
                  ? "border-[#c9a84c] text-[#e8eaf6]"
                  : "border-transparent text-[#8892b0] hover:text-[#e8eaf6]"
              }`}
            >
              Son Yazılar
            </button>

            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() =>
                  router.push(`/category/${encodeURIComponent(cat.name)}`)
                }
                className={`flex-shrink-0 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeCategory === cat.name
                    ? "border-[#c9a84c] text-[#e8eaf6]"
                    : "border-transparent text-[#8892b0] hover:text-[#e8eaf6]"
                }`}
              >
                {cat.name}
              </button>
            ))}
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
            background: "#151b2d",
            color: "#e8eaf6",
            border: "1px solid #252d40",
            fontSize: "14px",
          },
          success: {
            iconTheme: {
              primary: "#c9a84c",
              secondary: "#0f1117",
            },
          },
        }}
      />
    </>
  );
}
