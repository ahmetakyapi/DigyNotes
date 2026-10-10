import { prisma } from "@/lib/prisma";

interface PostVisibilityRecord {
  id: string;
  userId: string | null;
  /* Optional so callers that already filtered them (the share card) can pass their row. */
  isDraft?: boolean;
  isDeleted?: boolean;
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

/**
 * Who may open a note: its owner and admins always; everyone else only when it is
 * published (not a draft, not in the trash) and its author's profile is public.
 * Drafts used to be readable by anyone with the link, although the share sheet
 * promised the opposite.
 */
export function canReadPost(
  post: PostVisibilityRecord | null,
  viewerId?: string | null,
  isAdmin = false
) {
  if (!post) return false;
  if (isAdmin) return true;
  if (viewerId && post.userId === viewerId) return true;
  if (post.isDraft || post.isDeleted) return false;
  if (!post.userId) return true;
  return post.user?.isPublic === true;
}

/** True when the note is readable by anyone, signed in or not (indexable, shareable). */
export function isPostPublic(post: PostVisibilityRecord | null) {
  return canReadPost(post, null, false);
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
        isDraft: true,
        isDeleted: true,
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
