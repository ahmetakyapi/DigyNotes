"use client";
import React, { useRef, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import Image from "next/image";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AddCategoryModal from "@/components/AddCategoryModal";
import { NotesProvider } from "@/context/NotesContext";

const inter = Inter({ subsets: ["latin"] });

interface Category {
  id: string;
  name: string;
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [categories, setCategories] = useState<Category[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleCategorySuccess = (category: Category) => {
    setCategories([...categories, category]);
    setIsModalOpen(false);
    router.push(`/category/${category.name}`);
  };

  const handleCategoryClick = (categoryName: string) => {
    setActiveCategory(categoryName);
    if (categoryName === 'all') {
      router.push('/');
    } else {
      router.push(`/category/${categoryName}`);
    }
  };

  // Update active category based on URL
  useEffect(() => {
    const categoryFromPath = pathname.split('/').pop();
    if (categoryFromPath && categoryFromPath !== '') {
      setActiveCategory(decodeURIComponent(categoryFromPath));
    } else {
      setActiveCategory('all');
    }
  }, [pathname]);

  return (
    <html lang="tr">
      <body className={inter.className}>
        <NotesProvider>
          <header className="bg-white shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between">
                {/* Logo */}
                <div className="text-3xl font-bold text-gray-900">
                  <Link href="/">
                    <Image
                      src="/digy-notes-logo.png"
                      alt="DigyNotes Logo"
                      width={400}
                      height={120}
                      className="object-contain"
                    />
                  </Link>
                </div>

                {/* Navigation */}
                <div className="relative flex-1 ml-8">
                  <div className="flex items-center">
                    <div
                      ref={scrollRef}
                      className="flex items-center space-x-4 overflow-x-auto scrollbar-hide relative"
                      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                    >
                      <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          className="text-gray-600"
                        >
                          <path
                            fillRule="evenodd"
                            d="M12 4a1 1 0 011 1v6h6a1 1 0 110 2h-6v6a1 1 0 11-2 0v-6H5a1 1 0 110-2h6V5a1 1 0 011-1z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleCategoryClick("all")}
                        className={`whitespace-nowrap px-4 py-2 text-lg font-medium ${
                          activeCategory === "all"
                            ? "text-gray-900 border-b-2 border-gray-900"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        Son Yazılar
                      </button>
                      {categories.map((category) => (
                        <button
                          key={category.id}
                          onClick={() => handleCategoryClick(category.name)}
                          className={`whitespace-nowrap px-4 py-2 text-lg font-medium ${
                            activeCategory === category.name
                              ? "text-gray-900 border-b-2 border-gray-900"
                              : "text-gray-500 hover:text-gray-700"
                          }`}
                        >
                          {category.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <AddCategoryModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSuccess={handleCategorySuccess}
          />

          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {React.cloneElement(children as React.ReactElement, { activeCategory })}
          </main>

          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </NotesProvider>
      </body>
    </html>
  );
}
