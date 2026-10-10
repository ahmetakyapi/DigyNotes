"use client";
import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";

/* `session` comes from the root layout (server). Without it `useSession()` is
   "loading" during server rendering, and ConditionalAppShell rendered only a loader
   for /discover and /profile: their HTML had no content at all for crawlers. */
export default function SessionProviderWrapper({
  children,
  session,
}: {
  children: React.ReactNode;
  session?: Session | null;
}) {
  return <SessionProvider session={session}>{children}</SessionProvider>;
}
