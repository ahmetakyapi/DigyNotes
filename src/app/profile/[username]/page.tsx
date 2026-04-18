import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import ProfilePageClient from "./ProfilePageClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: { username: string };
}): Promise<Metadata> {
  try {
    const user = await prisma.user.findUnique({
      where: { username: params.username },
      select: { name: true, username: true, bio: true, avatarUrl: true, isPublic: true },
    });
    if (!user) {
      return { title: `@${params.username} — DigyNotes` };
    }
    if (!user.isPublic) {
      return {
        title: `@${user.username} — DigyNotes`,
        description: "Bu profil gizli.",
      };
    }
    return {
      title: `${user.name} (@${user.username}) — DigyNotes`,
      description: user.bio ?? `${user.name} adlı kullanıcının DigyNotes profili`,
      openGraph: {
        title: `${user.name} — DigyNotes`,
        description: user.bio ?? undefined,
        images: user.avatarUrl ? [{ url: user.avatarUrl }] : undefined,
      },
    };
  } catch {
    return { title: `@${params.username} — DigyNotes` };
  }
}

export default function ProfilePage({ params }: { params: { username: string } }) {
  return <ProfilePageClient username={params.username} />;
}
