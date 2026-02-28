import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPostReadAccess } from "@/lib/post-access";
import { getCategoryLabel } from "@/lib/categories";
import { buildPostMetadataDescription, toAbsoluteUrl } from "@/lib/metadata";
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
    const description = buildPostMetadataDescription({
      excerpt: post.excerpt,
      content: post.content,
      category: categoryLabel,
      creator: post.creator,
      years: post.years,
    });
    const canonicalPath = `/posts/${post.id}`;
    const isIndexable = access.post.user?.isPublic !== false;
    const fallbackImage = toAbsoluteUrl(`${canonicalPath}/opengraph-image`);
    const imageUrl = post.image || fallbackImage;
    const authorName = post.user?.name || post.creator || "DigyNotes";
    const tagNames = post.tags.map(({ tag }) => tag.name);

    return {
      title: post.title,
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
        title: post.title,
        description,
        type: "article",
        url: canonicalPath,
        publishedTime: post.createdAt.toISOString(),
        modifiedTime: post.updatedAt.toISOString(),
        section: categoryLabel,
        authors: [authorName],
        tags: tagNames,
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: post.title,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: post.title,
        description,
        creator: post.user?.username ? `@${post.user.username}` : undefined,
        images: [imageUrl],
      },
    };
  } catch {
    return {};
  }
}

export default function PostPage({ params }: { params: { id: string } }) {
  return <PostDetailClient params={params} />;
}
