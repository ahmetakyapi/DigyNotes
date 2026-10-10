import { Metadata } from "next";
import { cache } from "react";
import { buildPageMetadata, NO_INDEX, toAbsoluteUrl } from "@/lib/metadata";
import { listPublicPosts } from "@/lib/public-posts";
import { normalizeTagName } from "@/lib/text";
import { buildBreadcrumbJsonLd } from "@/lib/structured-data";
import { JsonLd } from "@/components/JsonLd";
import type { Post } from "@/types";
import TagPageClient from "./TagPageClient";

export const dynamic = "force-dynamic";

const TAG_PAGE_LIMIT = 50;

function readTagName(raw: string) {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

/* Same first page the client shows (newest, 50), read on the server so the notes and
   their links are in the HTML. `null` = read failed, the client fetches instead. */
const loadTagPosts = cache(async (tagName: string) => {
  try {
    const posts = await listPublicPosts({ tag: tagName, sort: "newest", limit: TAG_PAGE_LIMIT });
    return JSON.parse(JSON.stringify(posts)) as Post[];
  } catch (error) {
    console.error("[tag] initial posts failed:", error);
    return null;
  }
});

function tagPath(tagName: string) {
  return `/tag/${encodeURIComponent(normalizeTagName(tagName))}`;
}

export async function generateMetadata({
  params,
}: {
  params: { name: string };
}): Promise<Metadata> {
  const tagName = readTagName(params.name);
  const posts = await loadTagPosts(tagName);
  const metadata = buildPageMetadata({
    title: `#${tagName}`,
    description: `DigyNotes topluluğunda #${tagName} etiketiyle paylaşılan herkese açık film, dizi, oyun, kitap ve gezi notları.`,
    path: tagPath(tagName),
  });
  // An empty tag page is thin content: reachable, but not worth an index entry.
  return posts && posts.length === 0 ? { ...metadata, robots: NO_INDEX } : metadata;
}

export default async function TagPage({ params }: { params: { name: string } }) {
  const tagName = readTagName(params.name);
  const posts = await loadTagPosts(tagName);
  return (
    <>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "DigyNotes", url: toAbsoluteUrl("/") },
          { name: "Keşfet", url: toAbsoluteUrl("/discover") },
          { name: `#${tagName}`, url: toAbsoluteUrl(tagPath(tagName)) },
        ])}
      />
      <TagPageClient params={params} initialPosts={posts ?? undefined} />
    </>
  );
}
