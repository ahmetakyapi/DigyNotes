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

/* Calm two-hue scheme: lavender (`--gold`) = finished, apricot (`--accent-2`) = in progress,
   stepped by opacity so each status stays distinguishable without extra hues. */
const A = (o: number) => `rgb(var(--gold-rgb) / ${o})`;
const B = (o: number) => `rgb(var(--accent-2-rgb) / ${o})`;

export const STATUS_COLORS: Record<string, string> = {
  İzlendi: "var(--gold)",
  Okundu: A(0.72),
  Oynandı: A(0.5),
  Tamamlandı: A(0.32),
  İzleniyor: "var(--accent-2)",
  Okunuyor: B(0.72),
  Oynanıyor: B(0.5),
  "Devam Ediyor": B(0.32),
  Belirsiz: "var(--text-faint)",
};

export const PIE_COLORS = [
  "var(--gold)",
  "var(--accent-2)",
  A(0.6),
  B(0.6),
  A(0.35),
  B(0.35),
  "var(--text-muted)",
  "var(--text-faint)",
  "var(--danger)",
];

export const ACTION_META: Record<string, { label: string; color: string; icon: string }> = {
  "post.create": { label: "Not Oluşturuldu", color: "var(--gold)", icon: "+" },
  "post.update": { label: "Not Güncellendi", color: A(0.55), icon: "↻" },
  "post.delete": { label: "Not Silindi", color: "var(--danger)", icon: "×" },
  "user.register": { label: "Yeni Kayıt", color: "var(--accent-2)", icon: "★" },
  "category.create": { label: "Kategori Oluşturuldu", color: B(0.6), icon: "□" },
  "user.follow": { label: "Takip", color: "var(--text-muted)", icon: "♥" },
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
