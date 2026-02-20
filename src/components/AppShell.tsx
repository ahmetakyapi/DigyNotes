"use client";
import React, { useRef, useState, useEffect, Suspense } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Toaster } from "react-hot-toast";
import AddCategoryModal from "@/components/AddCategoryModal";
import { SearchBar } from "@/components/SearchBar";
import { Category } from "@/types";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCategories)
      .catch(console.error);
  }, []);

  const getActiveCategory = () => {
    if (pathname === "/") return "all";
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

  return (
    <>
      {/* ─── HEADER ─── */}
      <header className="bg-[#0f1117]/95 backdrop-blur-sm border-b border-[#252d40] sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          {/* Top row: Logo + New Post button */}
          <div className="flex items-center justify-between py-4">
            <Link href="/" className="flex items-center leading-[0]">
              <Image
                src="/digy-notes-logo.png"
                alt="DigyNotes"
                width={190}
                height={56}
                className="object-contain block"
                priority
              />
            </Link>
            <div className="flex items-center gap-2">
              <Suspense>
                <SearchBar />
              </Suspense>
              <Link
                href="/new-post"
                className="self-center px-4 py-2 text-sm font-semibold bg-[#c9a84c] text-[#0f1117] rounded-md
                           hover:bg-[#e0c068] transition-colors duration-200 shadow-md shadow-[#c9a84c]/20"
              >
                + Yeni Not
              </Link>
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
              onClick={() => router.push("/")}
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
