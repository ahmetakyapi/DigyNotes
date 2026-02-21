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
}

export interface Category {
  id: string;
  name: string;
  createdAt: string;
}
