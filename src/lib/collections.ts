import { Prisma } from "@prisma/client";

export const collectionWithPostsInclude = Prisma.validator<Prisma.CollectionInclude>()({
  user: {
    select: {
      id: true,
      name: true,
      username: true,
      avatarUrl: true,
      isPublic: true,
    },
  },
  posts: {
    orderBy: [{ position: "asc" }, { addedAt: "asc" }],
    include: {
      post: {
        include: {
          tags: { include: { tag: true } },
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              avatarUrl: true,
            },
          },
        },
      },
    },
  },
});

export type CollectionWithPosts = Prisma.CollectionGetPayload<{
  include: typeof collectionWithPostsInclude;
}>;

function serializePost(entry: CollectionWithPosts["posts"][number]["post"]) {
  const { tags, createdAt, updatedAt, ...rest } = entry;

  return {
    ...rest,
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
    tags: tags.map((item) => item.tag),
  };
}

export function serializeCollection(collection: CollectionWithPosts) {
  return {
    id: collection.id,
    title: collection.title,
    description: collection.description,
    createdAt: collection.createdAt.toISOString(),
    updatedAt: collection.updatedAt.toISOString(),
    postCount: collection.posts.length,
    owner: collection.user,
    posts: collection.posts.map((entry) => serializePost(entry.post)),
  };
}
