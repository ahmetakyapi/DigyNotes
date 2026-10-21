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
    /* Collections show on public profiles: trashed and draft notes stay linked (restoring
       a note brings it back) but are never listed or counted (ERR-DATA-012). Cards never
       render the note body, so its HTML stays out of every payload. */
    where: { post: { isDeleted: false, isDraft: false } },
    orderBy: [{ position: "asc" }, { addedAt: "asc" }],
    include: {
      post: {
        omit: { content: true },
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
