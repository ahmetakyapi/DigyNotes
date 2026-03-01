import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripHtml } from "@/lib/text";

function escapeCsv(value: unknown) {
  const text = String(value ?? "");
  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function toReadableText(value: string | null | undefined) {
  return stripHtml(value ?? "");
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") === "csv" ? "csv" : "json";

  const [user, posts, collections, wishlist] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        bio: true,
        avatarUrl: true,
        isPublic: true,
        createdAt: true,
      },
    }),
    prisma.post.findMany({
      where: { userId },
      orderBy: [{ createdAt: "desc" }],
      include: { tags: { include: { tag: true } } },
    }),
    prisma.collection.findMany({
      where: { userId },
      orderBy: [{ updatedAt: "desc" }],
      include: {
        posts: {
          orderBy: [{ position: "asc" }, { addedAt: "asc" }],
          include: {
            post: {
              select: {
                id: true,
                title: true,
                category: true,
              },
            },
          },
        },
      },
    }),
    prisma.wishlist.findMany({
      where: { userId },
      orderBy: [{ addedAt: "desc" }],
    }),
  ]);

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const safeUsername = user.username?.trim() || user.id;
  const exportedAt = new Date().toISOString();

  if (format === "csv") {
    const header = [
      "id",
      "title",
      "category",
      "creator",
      "years",
      "rating",
      "status",
      "date",
      "excerpt",
      "content",
      "tags",
      "createdAt",
      "updatedAt",
    ];

    const rows = posts.map((post) =>
      [
        post.id,
        post.title,
        post.category,
        post.creator ?? "",
        post.years ?? "",
        post.rating,
        post.status ?? "",
        post.date,
        toReadableText(post.excerpt),
        toReadableText(post.content),
        post.tags.map((item) => item.tag.name).join("|"),
        post.createdAt.toISOString(),
        post.updatedAt.toISOString(),
      ]
        .map(escapeCsv)
        .join(",")
    );

    return new NextResponse(`\uFEFF${[header.join(","), ...rows].join("\n")}`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="digynotes-export-${safeUsername}.csv"`,
      },
    });
  }

  return NextResponse.json(
    {
      exportedAt,
      formatVersion: 2,
      summary: {
        noteCount: posts.length,
        collectionCount: collections.length,
        wishlistCount: wishlist.length,
      },
      user: {
        ...user,
        createdAt: user.createdAt.toISOString(),
        bio: toReadableText(user.bio),
      },
      posts: posts.map((post) => ({
        id: post.id,
        title: post.title,
        category: post.category,
        creator: post.creator,
        years: post.years,
        rating: post.rating,
        status: post.status,
        date: post.date,
        excerpt: toReadableText(post.excerpt),
        content: toReadableText(post.content),
        coverImage: post.image,
        imagePosition: post.imagePosition,
        hasSpoiler: post.hasSpoiler,
        externalRating: post.externalRating,
        location:
          typeof post.lat === "number" && typeof post.lng === "number"
            ? { lat: post.lat, lng: post.lng }
            : null,
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
        tags: post.tags.map((item) => item.tag),
      })),
      collections: collections.map((collection) => ({
        id: collection.id,
        title: collection.title,
        description: collection.description,
        createdAt: collection.createdAt.toISOString(),
        updatedAt: collection.updatedAt.toISOString(),
        posts: collection.posts.map((item) => ({
          id: item.post.id,
          title: item.post.title,
          category: item.post.category,
          position: item.position,
          addedAt: item.addedAt.toISOString(),
        })),
      })),
      wishlist: wishlist.map((item) => ({
        ...item,
        addedAt: item.addedAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      })),
    },
    {
      headers: {
        "Content-Disposition": `attachment; filename="digynotes-export-${safeUsername}.json"`,
      },
    }
  );
}
