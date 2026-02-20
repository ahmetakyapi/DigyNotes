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
  keywords: ["film notları", "dizi notları", "kitap notları", "izleme listesi", "okuma listesi", "DigyNotes"],
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
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body className={`${inter.className} bg-[#0f1117] text-[#e8eaf6] min-h-screen`}>
        <SessionProviderWrapper>
          <ConditionalAppShell>{children}</ConditionalAppShell>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
