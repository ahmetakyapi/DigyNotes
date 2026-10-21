"use client";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import AppShell from "./AppShell";
import { FullScreenLoader } from "./FullScreenLoader";
import { RouteProgressBar } from "./RouteProgressBar";
import KeyboardShortcuts from "./KeyboardShortcuts";
import ShortcutHelpModal from "./ShortcutHelpModal";
import ScrollToTop from "./ScrollToTop";

// These paths never get AppShell
const ALWAYS_PUBLIC = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/offline",
  "/maintenance",
];
// These paths are publicly accessible but get AppShell when logged in
const SEMI_PUBLIC_PREFIXES = ["/discover", "/profile", "/collections"];

export default function ConditionalAppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { status } = useSession();

  const isAlwaysPublic = ALWAYS_PUBLIC.includes(pathname);
  const isSemiPublic = SEMI_PUBLIC_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  if (isAlwaysPublic) {
    return (
      <>
        <RouteProgressBar />
        {children}
      </>
    );
  }

  if (isSemiPublic) {
    if (status === "loading") return <FullScreenLoader show />;
    if (status === "unauthenticated") {
      return (
        <>
          <RouteProgressBar />
          {children}
        </>
      );
    }
    // Signed in: fall through to the shared tree below, so AppShell keeps its position
    // and is not remounted when moving between these pages and the rest of the app.
  }

  return (
    <>
      <RouteProgressBar />
      <FullScreenLoader show={status === "loading"} />
      <KeyboardShortcuts />
      <ShortcutHelpModal />
      <ScrollToTop />
      <AppShell>{children}</AppShell>
    </>
  );
}
