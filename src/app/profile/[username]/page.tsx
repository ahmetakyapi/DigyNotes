import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { toAbsoluteUrl } from "@/lib/metadata";
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
      select: { name: true, username: true, bio: true, isPublic: true },
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
    const path = `/profile/${user.username}`;
    /* Same JPEG share card as notes: name, stats and their latest covers. Users have
       no updatedAt, so the cache key turns over daily to pick up new covers. */
    const day = Math.floor(Date.now() / 86_400_000).toString(36);
    const cardUrl = toAbsoluteUrl(`${path}/opengraph-image?v=${day}`);
    const card = {
      url: cardUrl,
      secureUrl: cardUrl,
      width: 1200,
      height: 630,
      type: "image/jpeg",
      alt: `${user.name} (@${user.username}) DigyNotes profili`,
    };
    const description =
      user.bio ??
      `${user.name} izlediklerini, okuduklarını ve gezdiklerini DigyNotes'ta not alıyor.`;
    return {
      title: `${user.name} (@${user.username})`,
      description,
      alternates: { canonical: path },
      openGraph: {
        type: "profile",
        title: `${user.name} (@${user.username})`,
        description,
        url: toAbsoluteUrl(path),
        siteName: "DigyNotes",
        locale: "tr_TR",
        username: user.username,
        images: [card],
      },
      twitter: {
        card: "summary_large_image",
        title: `${user.name} (@${user.username})`,
        description,
        images: [card],
      },
    };
  } catch {
    return { title: `@${params.username} — DigyNotes` };
  }
}

export default function ProfilePage({ params }: { params: { username: string } }) {
  return <ProfilePageClient username={params.username} />;
}
