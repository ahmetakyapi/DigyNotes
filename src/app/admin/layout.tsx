import { getServerAuthSession } from "@/lib/api-server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerAuthSession();
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: (session.user as { id: string }).id },
    select: { isAdmin: true },
  });

  if (!user?.isAdmin) redirect("/notes");

  return <>{children}</>;
}
