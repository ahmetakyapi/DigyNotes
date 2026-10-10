import { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getSessionUserId } from "@/lib/api-server";
import {
  getSiteUrl,
  isPreviewBot,
  toAbsoluteUrl,
  truncateText,
  warmShareImage,
} from "@/lib/metadata";
import { getProfilePageData } from "@/lib/profile-data";
import { buildBreadcrumbJsonLd, buildProfileJsonLd } from "@/lib/structured-data";
import { JsonLd } from "@/components/JsonLd";
import ProfilePageClient, { type ProfileInitialData } from "./ProfilePageClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: { username: string };
}): Promise<Metadata> {
  const noIndex = { index: false, follow: false } as const;
  const result = await getProfilePageData(params.username, await getSessionUserId()).catch(
    () => null
  );
  if (!result) return { title: `@${params.username}` };
  // 404 page + noindex (status: see posts/[id]/page.tsx).
  if (result.kind === "not-found") notFound();

  try {
    if (result.kind === "private") {
      return {
        title: `@${result.profile.username}`,
        description: "Bu profil gizli.",
        robots: noIndex,
      };
    }
    const user = result.data.user;
    const path = `/profile/${user.username}`;
    /* Same JPEG share card as notes: name, stats and their latest covers. Users have
       no updatedAt, so the cache key turns over daily to pick up new covers. */
    const day = Math.floor(Date.now() / 86_400_000).toString(36);
    const cardUrl = toAbsoluteUrl(`${path}/opengraph-image?v=${day}`);
    if (isPreviewBot(headers().get("user-agent"))) warmShareImage(cardUrl);
    const card = {
      url: cardUrl,
      secureUrl: cardUrl,
      width: 1200,
      height: 630,
      type: "image/jpeg",
      alt: `${user.name} (@${user.username}) DigyNotes profili`,
    };
    const description = truncateText(
      user.bio?.trim() ||
        `${user.name} izlediklerini, okuduklarını ve gezdiklerini DigyNotes'ta not alıyor.`,
      200
    );
    return {
      title: `${user.name} (@${user.username})`,
      description,
      alternates: { canonical: path },
      // An owner or admin looking at a private profile still gets the full page.
      robots: user.isPublic ? undefined : noIndex,
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
    return { title: `@${params.username}` };
  }
}

/* Read on the server so the first HTML holds the profile and its notes (with links to
   each note); the client component takes it as its first state. */
export default async function ProfilePage({ params }: { params: { username: string } }) {
  const result = await getProfilePageData(params.username, await getSessionUserId());
  if (result.kind === "not-found") notFound();

  const initialData = JSON.parse(JSON.stringify(result)) as ProfileInitialData;
  const user = result.kind === "ok" ? result.data.user : null;

  return (
    <>
      {user?.isPublic && (
        <JsonLd
          data={[
            buildProfileJsonLd(user, getSiteUrl()),
            buildBreadcrumbJsonLd([
              { name: "DigyNotes", url: toAbsoluteUrl("/") },
              { name: "Keşfet", url: toAbsoluteUrl("/discover") },
              { name: user.name, url: toAbsoluteUrl(`/profile/${user.username}`) },
            ]),
          ]}
        />
      )}
      <ProfilePageClient
        key={params.username}
        username={params.username}
        initialData={initialData}
      />
    </>
  );
}
