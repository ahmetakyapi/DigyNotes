export interface CommentUser {
  id: string;
  name: string;
  username: string | null;
  avatarUrl: string | null;
}

/** One comment as `/api/posts/[id]/comments` returns it (flat, with parentId). */
export interface CommentData {
  id: string;
  content: string;
  createdAt: string;
  parentId: string | null;
  user: CommentUser;
  likeCount: number;
  likedByMe: boolean;
  /** Lowercased usernames in `content` that belong to real users (rendered as links). */
  mentions: string[];
}

export interface CommentPage {
  items: CommentData[];
  nextCursor: string | null;
  total: number;
}
