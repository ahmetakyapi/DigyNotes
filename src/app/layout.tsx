import "./globals.css";
import { Schibsted_Grotesk, Newsreader, JetBrains_Mono } from "next/font/google";
import { Metadata, Viewport } from "next";

const sans = Schibsted_Grotesk({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
  display: "swap",
});
const display = Newsreader({
  subsets: ["latin", "latin-ext"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  variable: "--font-display",
  display: "swap",
});
const mono = JetBrains_Mono({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});
import SessionProviderWrapper from "@/components/SessionProviderWrapper";
import ConditionalAppShell from "@/components/ConditionalAppShell";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { MaintenanceGuard } from "@/components/MaintenanceGuard";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { PwaInstallPrompt } from "@/components/PwaInstallPrompt";
import { GradientMesh } from "@/components/GradientMesh";
import CommandPalette from "@/components/CommandPalette";
import { Analytics } from "@vercel/analytics/next";
import { getSiteUrl } from "@/lib/metadata";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0b0b0a" },
    { media: "(prefers-color-scheme: light)", color: "#f1ede4" },
  ],
};

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "DigyNotes",
    template: "%s | DigyNotes",
  },
  description: "Film, dizi, oyun, kitap ve gezi notlarını tut, derecelendir ve kategorilere ayır.",
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
    description:
      "Film, dizi, oyun, kitap ve gezi notlarını tut, derecelendir ve kategorilere ayır.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        type: "image/jpeg",
        alt: "DigyNotes — Sana Kalan Her Şey, Burada",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DigyNotes",
    description:
      "Film, dizi, oyun, kitap ve gezi notlarını tut, derecelendir ve kategorilere ayır.",
    images: ["/opengraph-image"],
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
  manifest: "/manifest.webmanifest",
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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Known on the server so semi-public pages (/discover, /profile) render their
  // content in the first HTML instead of a session loader.
  const session = await getServerSession(authOptions).catch(() => null);

  return (
    <html
      lang="tr"
      className={`${sans.variable} ${display.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Prevent flash of wrong theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('dn_theme');var r=document.documentElement;var l=t==='light';r.classList.toggle('light',l);r.dataset.theme=l?'light':'dark';r.style.colorScheme=l?'light':'dark'}catch(e){}})()`,
          }}
        />
      </head>
      <body className="min-h-screen">
        <GradientMesh />
        <div className="relative z-10">
          <MaintenanceGuard>
            <ThemeProvider>
              <SessionProviderWrapper session={session}>
                <ServiceWorkerRegistration />
                <ErrorBoundary>
                  <ConditionalAppShell>{children}</ConditionalAppShell>
                </ErrorBoundary>
                <CommandPalette />
                <PwaInstallPrompt />
              </SessionProviderWrapper>
            </ThemeProvider>
          </MaintenanceGuard>
        </div>
        <Analytics />
      </body>
    </html>
  );
}
