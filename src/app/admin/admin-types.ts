/* ─────────────────────────── types ─────────────────────────── */

export interface StatsData {
  kpi: {
    totalUsers: number;
    totalPosts: number;
    totalCategories: number;
    totalTags: number;
    totalFollows: number;
    todayActivity: number;
  };
  dailySeries: { date: string; posts: number; users: number }[];
  postStatusDistribution: { status: string; count: number }[];
  postsPerCategory: { category: string; count: number }[];
  topUsers: { id: string; name: string; username: string | null; postCount: number }[];
  topTags: { name: string; count: number }[];
  ratingDistribution: { label: string; count: number }[];
}

export interface UserRow {
  id: string;
  name: string;
  email: string;
  username: string | null;
  isAdmin: boolean;
  isBanned: boolean;
  isPublic: boolean;
  createdAt: string;
  postCount: number;
  followerCount: number;
  followingCount: number;
}

export interface ActivityLog {
  id: string;
  action: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  user: { id: string; name: string; username: string | null } | null;
}

export interface PostRow {
  id: string;
  title: string;
  category: string;
  status: string | null;
  rating: number;
  createdAt: string;
  user: { id: string; name: string; username: string | null } | null;
}

export interface SiteSettings {
  registrationEnabled: string;
  maintenanceMode: string;
  maintenanceMessage: string;
}

export interface AdminFeedback {
  tone: "success" | "warning" | "error";
  title: string;
  detail: string;
  followUp?: string;
}

export type RangeKey = "24h" | "7d" | "30d" | "90d" | "365d";
export type SeriesKey = "7d" | "30d" | "90d" | "365d";

/* ─────────────────────────── constants ─────────────────────── */

export const STATUS_COLORS: Record<string, string> = {
  İzlendi: "#10b981",
  İzleniyor: "#34d399",
  Okundu: "#34d399",
  Okunuyor: "#60a5fa",
  Oynandı: "#f472b6",
  Oynanıyor: "#fb923c",
  Tamamlandı: "#a78bfa",
  "Devam Ediyor": "#38bdf8",
  Belirsiz: "#3a3a5a",
};

export const PIE_COLORS = [
  "#10b981",
  "#34d399",
  "#34d399",
  "#60a5fa",
  "#f472b6",
  "#fb923c",
  "#a78bfa",
  "#38bdf8",
  "#e53e3e",
];

export const ACTION_META: Record<string, { label: string; color: string; icon: string }> = {
  "post.create": { label: "Not oluşturuldu", color: "#34d399", icon: "+" },
  "post.update": { label: "Not güncellendi", color: "#60a5fa", icon: "↻" },
  "post.delete": { label: "Not silindi", color: "#e53e3e", icon: "×" },
  "user.register": { label: "Yeni kayıt", color: "#10b981", icon: "★" },
  "category.create": { label: "Kategori oluşturuldu", color: "#34d399", icon: "□" },
  "user.follow": { label: "Takip", color: "#f472b6", icon: "♥" },
};

export const RANGE_LABELS: Record<RangeKey, string> = {
  "24h": "24 Saat",
  "7d": "7 Gün",
  "30d": "30 Gün",
  "90d": "90 Gün",
  "365d": "1 Yıl",
};

export const SERIES_LABELS: Record<SeriesKey, string> = {
  "7d": "7 Gün",
  "30d": "30 Gün",
  "90d": "90 Gün",
  "365d": "1 Yıl",
};
