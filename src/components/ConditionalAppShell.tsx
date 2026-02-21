"use client";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import AppShell from "./AppShell";
import { FullScreenLoader } from "./FullScreenLoader";

const PUBLIC_PATHS = ["/", "/login", "/register"];

export default function ConditionalAppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { status } = useSession();
  const isPublic = PUBLIC_PATHS.includes(pathname);

  return (
    <>
      <FullScreenLoader show={!isPublic && status === "loading"} />
      {isPublic ? <>{children}</> : <AppShell>{children}</AppShell>}
    </>
  );
}
