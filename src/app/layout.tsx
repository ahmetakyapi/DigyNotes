import React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import Image from "next/image";
import { FaHome, FaFilm, FaTv, FaBook } from "react-icons/fa";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DigyNotes",
  description: "Film, Dizi ve Kitap Notları",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body className={inter.className}>
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col items-center justify-between">
              {/* Logo */}
              <div className="text-3xl font-bold text-gray-900 mb-6">
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
              <nav className="flex space-x-12">
                <Link
                  href="/categories/movies"
                  className="text-xl text-gray-700 hover:text-gray-900 font-bold flex items-center"
                >
                  <FaFilm className="mr-2" /> Filmler
                </Link>
                <Link
                  href="/categories/series"
                  className="text-xl text-gray-700 hover:text-gray-900 font-bold flex items-center"
                >
                  <FaTv className="mr-2" /> Diziler
                </Link>
                <Link
                  href="/categories/books"
                  className="text-xl text-gray-700 hover:text-gray-900 font-bold flex items-center"
                >
                  <FaBook className="mr-2" /> Kitaplar
                </Link>
              </nav>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
