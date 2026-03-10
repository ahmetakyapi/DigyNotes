import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const posts = await prisma.post.findMany({
      where: {
        OR: [{ userId: null }, { user: { isPublic: true } }],
      },
      select: { id: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    });

    return [
      {
        url: siteUrl,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 1,
      },
      {
        url: `${siteUrl}/discover`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.8,
      },
      ...posts.map((post) => ({
        url: `${siteUrl}/posts/${post.id}`,
        lastModified: post.updatedAt,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      })),
    ];
  } catch {
    return [
      {
        url: siteUrl,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 1,
      },
      {
        url: `${siteUrl}/discover`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.8,
      },
    ];
  }
}
