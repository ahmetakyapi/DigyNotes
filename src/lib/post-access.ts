import { prisma } from "@/lib/prisma";

interface PostVisibilityRecord {
  id: string;
  userId: string | null;
  user: {
    isPublic: boolean;
  } | null;
}

export interface PostReadAccess {
  post: PostVisibilityRecord | null;
  isAdmin: boolean;
  isOwner: boolean;
  canRead: boolean;
}

export function canReadPost(
  post: PostVisibilityRecord | null,
  viewerId?: string | null,
  isAdmin = false
) {
  if (!post) return false;
  if (isAdmin) return true;
  if (!post.userId) return true;
  if (viewerId && post.userId === viewerId) return true;
  return post.user?.isPublic === true;
}

export async function getPostReadAccess(
  postId: string,
  viewerId?: string | null
): Promise<PostReadAccess> {
  const [post, viewer] = await Promise.all([
    prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        userId: true,
        user: { select: { isPublic: true } },
      },
    }),
    viewerId
      ? prisma.user.findUnique({
          where: { id: viewerId },
          select: { isAdmin: true },
        })
      : Promise.resolve(null),
  ]);

  const isAdmin = viewer?.isAdmin ?? false;
  const isOwner = !!viewerId && !!post && post.userId === viewerId;

  return {
    post,
    isAdmin,
    isOwner,
    canRead: canReadPost(post, viewerId, isAdmin),
  };
}
