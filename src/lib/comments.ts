/**
 * Server-side comment loading for `/api/posts/[id]/comments`: root comments paged newest
 * first, every reply of those roots, like counts, the viewer's likes and which
 * `@username` tokens point at real users (so only those become links).
 */

import { prisma } from "@/lib/prisma";
import { decodeCommentCursor, encodeCommentCursor } from "@/lib/comment-thread";
import { extractMentions } from "@/lib/mentions";
import { canReadPost, type PostReadAccess } from "@/lib/post-access";

export const COMMENT_USER_SELECT = {
  id: true,
  name: true,
  username: true,
  avatarUrl: true,
} as const;

/* Reply levels fetched below a page of roots. Each level is one query; real threads
   are a few levels deep, the cap only bounds a pathological chain. */
const MAX_REPLY_DEPTH = 12;
/* Mention tokens scanned per comment when resolving links (the API notifies at most
   five, but older text may name more). */
const MAX_LINKED_MENTIONS = 10;

function commentInclude(viewerId: string | null) {
  return {
    user: { select: COMMENT_USER_SELECT },
    _count: { select: { likes: true } },
    /* Anonymous viewers match no row ("" is never a user id). */
    likes: { where: { userId: viewerId ?? "" }, select: { userId: true }, take: 1 },
  };
}

type CommentRow = {
  id: string;
  content: string;
  postId: string;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
  user: { id: string; name: string; username: string | null; avatarUrl: string | null };
  _count: { likes: number };
  likes: { userId: string }[];
};

export type CommentDTO = {
  id: string;
  content: string;
  postId: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  user: CommentRow["user"];
  likeCount: number;
  likedByMe: boolean;
  /** Lowercased usernames in the text that belong to existing users. */
  mentions: string[];
};

/** Usernames among the comments' `@` tokens that exist (one query for the whole page). */
async function resolveMentionedUsernames(contents: string[]) {
  const tokens = new Set<string>();
  contents.forEach((content) =>
    extractMentions(content, MAX_LINKED_MENTIONS).forEach((name) => tokens.add(name))
  );
  if (tokens.size === 0) return new Set<string>();

  const users = await prisma.user.findMany({
    where: { username: { in: Array.from(tokens) } },
    select: { username: true },
  });
  return new Set(users.map((user) => user.username));
}

export async function serializeComments(rows: CommentRow[]): Promise<CommentDTO[]> {
  const known = await resolveMentionedUsernames(rows.map((row) => row.content));

  return rows.map((row) => ({
    id: row.id,
    content: row.content,
    postId: row.postId,
    parentId: row.parentId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    user: row.user,
    likeCount: row._count.likes,
    likedByMe: row.likes.length > 0,
    mentions: extractMentions(row.content, MAX_LINKED_MENTIONS).filter((name) => known.has(name)),
  }));
}

export async function findCommentForResponse(commentId: string, viewerId: string | null) {
  const row = await prisma.comment.findUnique({
    where: { id: commentId },
    include: commentInclude(viewerId),
  });
  if (!row) return null;
  const [comment] = await serializeComments([row]);
  return comment;
}

/**
 * One page of the conversation: `limit` root comments newest first (after `cursor`),
 * plus all their replies at any depth, flat with `parentId`. `total` counts every
 * comment on the note, replies included.
 */
export async function loadCommentPage(
  postId: string,
  viewerId: string | null,
  { cursor, limit }: { cursor?: string | null; limit: number }
) {
  const after = decodeCommentCursor(cursor);
  const include = commentInclude(viewerId);

  const [roots, total] = await Promise.all([
    prisma.comment.findMany({
      where: {
        postId,
        parentId: null,
        ...(after
          ? {
              OR: [
                { createdAt: { lt: after.createdAt } },
                { createdAt: after.createdAt, id: { lt: after.id } },
              ],
            }
          : {}),
      },
      include,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
    }),
    prisma.comment.count({ where: { postId } }),
  ]);

  let nextCursor: string | null = null;
  if (roots.length > limit) {
    roots.pop();
    const last = roots.at(-1);
    nextCursor = last ? encodeCommentCursor(last.createdAt, last.id) : null;
  }

  const replies: CommentRow[] = [];
  let frontier = roots.map((root) => root.id);
  for (let depth = 0; depth < MAX_REPLY_DEPTH && frontier.length > 0; depth += 1) {
    const level = await prisma.comment.findMany({
      where: { postId, parentId: { in: frontier } },
      include,
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });
    replies.push(...level);
    frontier = level.map((reply) => reply.id);
  }

  return {
    items: await serializeComments([...roots, ...replies]),
    nextCursor,
    total,
  };
}

/**
 * `mention` notifications for a new comment: up to five `@username`s that exist, minus
 * the author and anyone already getting a `comment` notification for it, and only
 * people who can open the note (a private author's note must not leak through a
 * notification).
 */
export async function notifyMentionedUsers({
  commentId,
  content,
  authorId,
  post,
  alreadyNotified,
}: {
  commentId: string;
  content: string;
  authorId: string;
  post: NonNullable<PostReadAccess["post"]>;
  alreadyNotified: Iterable<string>;
}) {
  const usernames = extractMentions(content);
  if (usernames.length === 0) return;

  const skip = new Set(Array.from(alreadyNotified));
  skip.add(authorId);
  const users = await prisma.user.findMany({
    where: { username: { in: usernames }, isBanned: false },
    select: { id: true, isAdmin: true },
  });
  const recipients = users.filter(
    (user) => !skip.has(user.id) && canReadPost(post, user.id, user.isAdmin)
  );
  if (recipients.length === 0) return;

  await prisma.notification.createMany({
    data: recipients.map((user) => ({ userId: user.id, type: "mention", referenceId: commentId })),
  });
}
