import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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

  const setting = await prisma.siteSettings.findUnique({ where: { key: "maintenanceMode" } });

  if (setting?.value === "true") {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id;

    if (userId) {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true } });
      if (!user?.isAdmin) redirect("/maintenance");
    } else {
      redirect("/maintenance");
    }
  }

  return <>{children}</>;
}
