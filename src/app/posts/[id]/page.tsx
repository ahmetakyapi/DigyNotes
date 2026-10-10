import { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getSessionUserId } from "@/lib/api-server";
import { isPostPublic } from "@/lib/post-access";
import { getPostDetail, type PostDetail } from "@/lib/post-detail";
import { getCategoryLabel } from "@/lib/categories";
import {
  buildPostMetadataDescription,
  getSiteUrl,
  isPreviewBot,
  stripHtml,
  toAbsoluteUrl,
  truncateText,
  warmShareImage,
} from "@/lib/metadata";
import { buildBreadcrumbJsonLd, buildNoteJsonLd } from "@/lib/structured-data";
import { JsonLd } from "@/components/JsonLd";
import type { Post } from "@/types";
import PostDetailClient from "./PostDetailClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const post = await getPostDetail(params.id, await getSessionUserId())
    .then((result) => result.post)
    .catch(() => undefined);
  if (post === undefined) return {};
  /* Not readable → the 404 page, with noindex. The status stays 200 while this route
     has a loading.tsx (Next 14 has already streamed the shell); without it, it is a
     real 404 (measured). The noindex keeps it out of search either way. */
  if (!post) notFound();

  try {
    const categoryLabel = getCategoryLabel(post.category);
    const canonicalPath = `/posts/${post.id}`;
    const canonicalUrl = toAbsoluteUrl(canonicalPath);
    const isShareable = !post.isDraft && !post.isDeleted;
    const isIndexable = isPostPublic(post);
    const authorName = post.user?.name || post.creator || "DigyNotes";
    const tagNames = post.tags.map((tag) => tag.name);

    /* What a chat app prints under the title (WhatsApp shows ~2 lines): who wrote it
       and the score first, then the note itself. */
    const rating = post.rating > 0 ? `★ ${post.rating.toFixed(1).replace(".", ",")}/5` : null;
    const lead = [authorName, rating, post.status].filter(Boolean).join(" · ");
    const noteText = stripHtml(post.excerpt || post.content || "").trim();
    const description = truncateText(
      `${lead} — ${
        noteText ||
        buildPostMetadataDescription({
          excerpt: post.excerpt,
          content: post.content,
          category: categoryLabel,
          creator: post.creator,
          years: post.years,
        })
      }`,
      200
    );
    const shareTitle = [post.title, post.creator ? `(${post.creator})` : null]
      .filter(Boolean)
      .join(" ");

    /* Always our own 1200×630 JPEG card, never the raw cover: a 500×750 poster
       declared as 1200×630 was cropped to a sliver, or dropped, by chat apps.
       `v` changes when the note is edited, so caches pick up the new card. */
    const cardUrl = cardUrlFor(post);
    if (isShareable && isPreviewBot(headers().get("user-agent"))) warmShareImage(cardUrl);
    const cardImage = {
      url: cardUrl,
      secureUrl: cardUrl,
      width: 1200,
      height: 630,
      type: "image/jpeg",
      alt: `${post.title} — ${authorName}, DigyNotes`,
    };

    return {
      title: shareTitle,
      description,
      keywords: [categoryLabel, post.creator, post.years, ...tagNames].filter(
        (value): value is string => Boolean(value)
      ),
      authors: [
        {
          name: authorName,
          url: post.user?.username ? toAbsoluteUrl(`/profile/${post.user.username}`) : undefined,
        },
      ],
      alternates: {
        canonical: canonicalPath,
      },
      robots: isIndexable
        ? undefined
        : {
            index: false,
            follow: false,
            googleBot: {
              index: false,
              follow: false,
            },
          },
      openGraph: {
        title: shareTitle,
        description,
        type: "article",
        url: canonicalUrl,
        siteName: "DigyNotes",
        locale: "tr_TR",
        publishedTime: post.createdAt.toISOString(),
        modifiedTime: post.updatedAt.toISOString(),
        section: categoryLabel,
        authors: [authorName],
        tags: tagNames,
        images: [cardImage],
      },
      twitter: {
        card: "summary_large_image",
        title: shareTitle,
        description,
        images: [cardImage],
      },
    };
  } catch {
    return {};
  }
}

function cardUrlFor(post: Pick<PostDetail, "id" | "updatedAt">) {
  return toAbsoluteUrl(
    `/posts/${post.id}/opengraph-image?v=${post.updatedAt.getTime().toString(36)}`
  );
}

/* The note is read on the server and handed to the client component, so the first
   HTML already holds title, author, rating, tags and body (crawlers and link previews
   no longer see an empty skeleton). Same read rule as /api/posts/[id]: drafts, trashed
   notes and private authors' notes are a 404 for everyone but the owner and admins. */
export default async function PostPage({ params }: { params: { id: string } }) {
  const { post } = await getPostDetail(params.id, await getSessionUserId());
  if (!post) notFound();

  const siteUrl = getSiteUrl();
  const isPublic = isPostPublic(post);
  const author = post.user;
  const initialPost = JSON.parse(JSON.stringify(post)) as Post;

  return (
    <>
      {isPublic && (
        <JsonLd
          data={[
            buildNoteJsonLd({ ...post, imageUrl: cardUrlFor(post) }, siteUrl),
            buildBreadcrumbJsonLd([
              { name: "DigyNotes", url: toAbsoluteUrl("/") },
              ...(author?.username
                ? [{ name: author.name, url: toAbsoluteUrl(`/profile/${author.username}`) }]
                : []),
              { name: post.title, url: toAbsoluteUrl(`/posts/${post.id}`) },
            ]),
          ]}
        />
      )}
      <PostDetailClient key={post.id} params={params} initialPost={initialPost} />
    </>
  );
}
