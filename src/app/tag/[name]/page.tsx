import { Metadata } from "next";
import { cache } from "react";
import { buildPageMetadata, NO_INDEX, toAbsoluteUrl } from "@/lib/metadata";
import { countPublicPosts, listPublicPosts } from "@/lib/public-posts";
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

/* Header total: the page lists the first 50 notes only, so the count must not come
   from that list (ERR-DATA-013). `null` = count failed, the client shows "50+". */
async function loadTagTotal(tagName: string) {
  try {
    return await countPublicPosts(tagName);
  } catch (error) {
    console.error("[tag] total failed:", error);
    return null;
  }
}

function tagPath(tagName: string) {
  return `/tag/${encodeURIComponent(normalizeTagName(tagName))}`;
}

export async function generateMetadata({
  params: paramsPromise,
}: {
  params: Promise<{ name: string }>;
}): Promise<Metadata> {
  const params = await paramsPromise;
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

export default async function TagPage({
  params: paramsPromise,
}: {
  params: Promise<{ name: string }>;
}) {
  const params = await paramsPromise;
  const tagName = readTagName(params.name);
  const [posts, total] = await Promise.all([loadTagPosts(tagName), loadTagTotal(tagName)]);
  return (
    <>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "DigyNotes", url: toAbsoluteUrl("/") },
          { name: "Keşfet", url: toAbsoluteUrl("/discover") },
          { name: `#${tagName}`, url: toAbsoluteUrl(tagPath(tagName)) },
        ])}
      />
      <TagPageClient params={params} initialPosts={posts ?? undefined} initialTotal={total} />
    </>
  );
}
