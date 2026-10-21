"use client";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { isProtectedPagePath } from "@/lib/protected-routes";
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
  const router = useRouter();
  const { status } = useSession();

  /* The middleware lets a page it protects through on any token that carries `pwv`, so
     one revoked since (password changed or reset elsewhere, user banned or deleted) lands
     here without a session, in a shell whose every request fails. Send it to /login, but
     only once /api/auth/session itself answers "no session": a failed session refetch
     (offline, flaky network) also leaves the status "unauthenticated" and must not sign
     anyone out. /login is outside the matcher, so this cannot loop. */
  useEffect(() => {
    if (status !== "unauthenticated" || !isProtectedPagePath(pathname)) return;
    let cancelled = false;
    fetch("/api/auth/session", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : undefined))
      .then((data: unknown) => {
        if (cancelled || data === undefined) return;
        if (!data || (typeof data === "object" && Object.keys(data).length === 0)) {
          router.replace("/login");
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [pathname, status, router]);

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
