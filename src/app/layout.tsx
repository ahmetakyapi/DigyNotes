import { Inter } from "next/font/google";
import "./globals.css";
import { Metadata, Viewport } from "next";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";
import ConditionalAppShell from "@/components/ConditionalAppShell";

export const viewport: Viewport = {
  themeColor: "#0f1117",
};

const inter = Inter({ subsets: ["latin", "latin-ext"] });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "DigyNotes",
    template: "%s | DigyNotes",
  },
  description: "Film, dizi ve kitap notlarını tut, derecelendir ve kategorilere ayır.",
  keywords: [
    "film notları",
    "dizi notları",
    "kitap notları",
    "izleme listesi",
    "okuma listesi",
    "DigyNotes",
  ],
  authors: [{ name: "DigyNotes" }],
  creator: "DigyNotes",
  openGraph: {
    type: "website",
    siteName: "DigyNotes",
    locale: "tr_TR",
    title: "DigyNotes",
    description: "Film, dizi ve kitap notlarını tut, derecelendir ve kategorilere ayır.",
    images: [
      {
        url: "/favicon-512x512.png",
        width: 512,
        height: 512,
        alt: "DigyNotes",
      },
    ],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/x-icon" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-1024x1024.png", sizes: "1024x1024", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png" },
      { url: "/apple-touch-icon-120x120.png", sizes: "120x120" },
      { url: "/apple-touch-icon-152x152.png", sizes: "152x152" },
      { url: "/apple-touch-icon-167x167.png", sizes: "167x167" },
    ],
  },
  manifest: "/site.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "DigyNotes",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className={`${inter.className} min-h-screen bg-[#0c0e16] text-[#e8eaf6]`}>
        <SessionProviderWrapper>
          <ConditionalAppShell>{children}</ConditionalAppShell>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
