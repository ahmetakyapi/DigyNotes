import { Metadata } from "next";
import { buildPageMetadata, toAbsoluteUrl } from "@/lib/metadata";
import { listPublicPosts } from "@/lib/public-posts";
import { searchPublicUsers } from "@/lib/public-users";
import { buildBreadcrumbJsonLd } from "@/lib/structured-data";
import { JsonLd } from "@/components/JsonLd";
import type { Post } from "@/types";
import DiscoverPageClient from "./DiscoverPageClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "Keşfet",
  description:
    "DigyNotes topluluğundaki herkese açık profilleri ve en yüksek puanlı film, dizi, oyun, kitap ve gezi notlarını keşfet.",
  path: "/discover",
});

/* Profiles and top-rated notes are read on the server so crawlers find links to them
   in the first HTML; if the read fails the client fetches them as before. */
async function loadInitial() {
  try {
    const [users, trending] = await Promise.all([
      searchPublicUsers(),
      listPublicPosts({ sort: "rating", limit: 6 }),
    ]);
    return { users, trending: JSON.parse(JSON.stringify(trending)) as Post[] };
  } catch (error) {
    console.error("[discover] initial data failed:", error);
    return null;
  }
}

export default async function DiscoverPage() {
  const initial = await loadInitial();
  return (
    <>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "DigyNotes", url: toAbsoluteUrl("/") },
          { name: "Keşfet", url: toAbsoluteUrl("/discover") },
        ])}
      />
      <DiscoverPageClient initialUsers={initial?.users} initialTrending={initial?.trending} />
    </>
  );
}
