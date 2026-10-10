import { MetadataRoute } from "next";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSiteUrl } from "@/lib/metadata";
import { publicPostsWhere } from "@/lib/public-posts";

export const dynamic = "force-dynamic";

const siteUrl = getSiteUrl();

/* One sitemap file holds at most 50,000 URLs; stay well below it. Past these caps the
   newest content wins and the file should be split into several sitemaps. (Don't
   write the name of Next's multi-sitemap export in this file: Next 14.0 greps the
   source for it and the build then fails with "w is not a function".) */
const MAX_NOTES = 40_000;
const MAX_PROFILES = 5_000;
const MAX_TAGS = 4_000;

/** Exactly the notes `canReadPost` lets an anonymous visitor open. */
const PUBLIC_NOTE: Prisma.PostWhereInput = {
  isDraft: false,
  isDeleted: false,
  OR: [{ userId: null }, { user: { isPublic: true } }],
};

function staticEntries(lastModified: Date): MetadataRoute.Sitemap {
  return [
    { url: siteUrl, lastModified, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/discover`, lastModified, changeFrequency: "daily", priority: 0.8 },
  ];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const [posts, profiles, tags] = await Promise.all([
      prisma.post.findMany({
        where: PUBLIC_NOTE,
        select: { id: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: MAX_NOTES,
      }),
      prisma.user.findMany({
        where: { isPublic: true },
        select: {
          username: true,
          createdAt: true,
          posts: {
            where: { isDraft: false, isDeleted: false },
            select: { updatedAt: true },
            orderBy: { updatedAt: "desc" },
            take: 1,
          },
        },
        orderBy: { posts: { _count: "desc" } },
        take: MAX_PROFILES,
      }),
      // Only tags whose page lists at least one note (empty tag pages are noindex).
      prisma.tag.findMany({
        where: { posts: { some: { post: publicPostsWhere() } } },
        select: { name: true },
        orderBy: { posts: { _count: "desc" } },
        take: MAX_TAGS,
      }),
    ]);

    const latest = posts[0]?.updatedAt ?? new Date();

    return [
      ...staticEntries(latest),
      ...profiles.map((user) => ({
        url: `${siteUrl}/profile/${encodeURIComponent(user.username)}`,
        lastModified: user.posts[0]?.updatedAt ?? user.createdAt,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
      ...posts.map((post) => ({
        url: `${siteUrl}/posts/${post.id}`,
        lastModified: post.updatedAt,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      })),
      ...tags.map((tag) => ({
        url: `${siteUrl}/tag/${encodeURIComponent(tag.name)}`,
        changeFrequency: "weekly" as const,
        priority: 0.4,
      })),
    ];
  } catch (error) {
    console.error("[sitemap] failed:", error);
    return staticEntries(new Date());
  }
}
