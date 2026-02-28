import { Metadata } from "next";
import ProfilePageClient from "./ProfilePageClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: { username: string };
}): Promise<Metadata> {
  try {
    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/users/${params.username}`, {
      cache: "no-store",
    });
    if (!res.ok) return { title: "Profil Bulunamadı" };
    const { user } = await res.json();
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
    return {};
  }
}

export default function ProfilePage({ params }: { params: { username: string } }) {
  return <ProfilePageClient username={params.username} />;
}
