import { Metadata } from "next";
import { headers } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPostReadAccess } from "@/lib/post-access";
import { getCategoryLabel } from "@/lib/categories";
import {
  buildPostMetadataDescription,
  isPreviewBot,
  stripHtml,
  toAbsoluteUrl,
  truncateText,
  warmShareImage,
} from "@/lib/metadata";
import PostDetailClient from "./PostDetailClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id;
    const access = await getPostReadAccess(params.id, userId);

    if (!access.post || !access.canRead) {
      return {
        title: "Not Bulunamadı",
        robots: {
          index: false,
          follow: false,
          googleBot: {
            index: false,
            follow: false,
          },
        },
      };
    }

    const post = await prisma.post.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        title: true,
        excerpt: true,
        content: true,
        image: true,
        category: true,
        creator: true,
        years: true,
        rating: true,
        status: true,
        isDraft: true,
        isDeleted: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            name: true,
            username: true,
          },
        },
        tags: {
          select: {
            tag: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });
    if (!post) return { title: "Not Bulunamadı" };

    const categoryLabel = getCategoryLabel(post.category);
    const canonicalPath = `/posts/${post.id}`;
    const canonicalUrl = toAbsoluteUrl(canonicalPath);
    const isShareable = !post.isDraft && !post.isDeleted;
    const isIndexable = isShareable && access.post.user?.isPublic !== false;
    const authorName = post.user?.name || post.creator || "DigyNotes";
    const tagNames = post.tags.map(({ tag }) => tag.name);

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
    const cardUrl = toAbsoluteUrl(
      `${canonicalPath}/opengraph-image?v=${post.updatedAt.getTime().toString(36)}`
    );
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
      authors: [{ name: authorName }],
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

export default function PostPage({ params }: { params: { id: string } }) {
  return <PostDetailClient params={params} />;
}
