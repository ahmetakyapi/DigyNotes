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
  status: string | null;
  imagePosition: string | null;
  date: string;
  createdAt: string;
  updatedAt: string;
  tags?: Tag[];
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
}
