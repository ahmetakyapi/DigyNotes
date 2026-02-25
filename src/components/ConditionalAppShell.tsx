"use client";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import AppShell from "./AppShell";
import { FullScreenLoader } from "./FullScreenLoader";
import { RouteProgressBar } from "./RouteProgressBar";

// These paths never get AppShell
const ALWAYS_PUBLIC = ["/", "/login", "/register"];
// These paths are publicly accessible but get AppShell when logged in
const SEMI_PUBLIC_PREFIXES = ["/discover", "/profile"];

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
    return (
      <>
        <RouteProgressBar />
        <AppShell>{children}</AppShell>
      </>
    );
  }

  return (
    <>
      <RouteProgressBar />
      <FullScreenLoader show={status === "loading"} />
      <AppShell>{children}</AppShell>
    </>
  );
}
