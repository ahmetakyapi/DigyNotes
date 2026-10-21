import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { sanitizePostContent, transformPostTags } from "@/lib/api-utils";
import { getPostReadAccess } from "@/lib/post-access";

/**
 * A note as `/api/posts/[id]` returns it, behind the same read rule. The note page
 * calls it on the server so the first HTML already holds the note (crawlers, link
 * previews, slow phones); `cache` lets generateMetadata and the page share one query.
 * The access check and the full note are read side by side (one round trip, not two
 * in a row); the note is only handed out when the check allows it.
 */
export const getPostDetail = cache(async (postId: string, viewerId: string | null) => {
  const [access, post] = await Promise.all([
    getPostReadAccess(postId, viewerId),
    prisma.post.findUnique({
      where: { id: postId },
      include: {
        tags: { include: { tag: true } },
        user: { select: { id: true, name: true, username: true, avatarUrl: true, isPublic: true } },
      },
    }),
  ]);
  if (!post || !access.canRead) return { access, post: null };

  // Sanitized again on read: rows saved under older, looser rules (any class) get today's.
  return {
    access,
    post: post ? transformPostTags({ ...post, content: sanitizePostContent(post.content) }) : null,
  };
});

export type PostDetail = NonNullable<Awaited<ReturnType<typeof getPostDetail>>["post"]>;
