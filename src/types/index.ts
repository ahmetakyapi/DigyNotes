export interface Tag {
  id: string;
  name: string;
}

export interface Post {
  id: string;
  title: string;
  category: string;
  image: string;
  excerpt: string;
  content: string;
  creator: string | null;
  years: string | null;
  rating: number;
  externalRating?: number | null;
  status: string | null;
  hasSpoiler?: boolean;
  lat?: number | null;
  lng?: number | null;
  imagePosition: string | null;
  date: string;
  createdAt: string;
  updatedAt: string;
  savedAt?: string;
  tags?: Tag[];
  user?: {
    id: string;
    name: string;
    username: string | null;
    avatarUrl: string | null;
  };
}

export interface Collection {
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  postCount: number;
  posts: Post[];
  owner?: {
    id: string;
    name: string;
    username: string | null;
    avatarUrl: string | null;
  };
}

export interface WishlistItem {
  id: string;
  category: string;
  title: string;
  creator: string | null;
  years: string | null;
  image: string | null;
  excerpt: string | null;
  externalRating?: number | null;
  externalId: string;
  addedAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  username: string | null;
  bio: string | null;
  avatarUrl: string | null;
  isPublic: boolean;
  createdAt: string;
  postCount?: number;
  avgRating?: number;
  followerCount?: number;
  followingCount?: number;
  isFollowing?: boolean;
}
