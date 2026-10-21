import { getServerAuthSession } from "@/lib/api-server";
import { prisma } from "@/lib/prisma";
import { getSiteSetting } from "@/lib/site-settings";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export async function MaintenanceGuard({ children }: { children: React.ReactNode }) {
  // x-pathname is injected by middleware only for matched (protected) routes.
  // If absent, we're on a public page or /maintenance itself — skip check to avoid redirect loops.
  const headersList = await headers();
  const pathname = headersList.get("x-pathname");
  if (!pathname) {
    return <>{children}</>;
  }

  /* The middleware only checks that a token exists. A token can outlive its session —
     signed in before a password change or reset (pwv mismatch), banned or deleted
     account — and would otherwise get an empty shell where every API answers 401. */
  const session = await getServerAuthSession().catch(() => undefined);
  if (session === null) {
    redirect(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
  }

  const maintenanceMode = await getSiteSetting("maintenanceMode");

  if (maintenanceMode === "true") {
    const userId = (session?.user as { id?: string })?.id;

    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isAdmin: true },
      });
      if (!user?.isAdmin) redirect("/maintenance");
    } else {
      redirect("/maintenance");
    }
  }

  return <>{children}</>;
}
