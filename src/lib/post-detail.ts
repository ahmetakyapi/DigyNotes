import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { transformPostTags } from "@/lib/api-utils";
import { getPostReadAccess } from "@/lib/post-access";

/**
 * A note as `/api/posts/[id]` returns it, behind the same read rule. The note page
 * calls it on the server so the first HTML already holds the note (crawlers, link
 * previews, slow phones); `cache` lets generateMetadata and the page share one query.
 */
export const getPostDetail = cache(async (postId: string, viewerId: string | null) => {
  const access = await getPostReadAccess(postId, viewerId);
  if (!access.post || !access.canRead) return { access, post: null };

  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      tags: { include: { tag: true } },
      user: { select: { id: true, name: true, username: true, avatarUrl: true, isPublic: true } },
    },
  });

  return { access, post: post ? transformPostTags(post) : null };
});

export type PostDetail = NonNullable<Awaited<ReturnType<typeof getPostDetail>>["post"]>;
