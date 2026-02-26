"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  CartesianGrid,
} from "recharts";
import toast from "react-hot-toast";

/* ─────────────────────────── types ─────────────────────────── */

interface StatsData {
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

interface UserRow {
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

interface ActivityLog {
  id: string;
  action: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  user: { id: string; name: string; username: string | null } | null;
}

interface PostRow {
  id: string;
  title: string;
  category: string;
  status: string | null;
  rating: number;
  createdAt: string;
  user: { id: string; name: string; username: string | null } | null;
}

interface SiteSettings {
  registrationEnabled: string;
  maintenanceMode: string;
  maintenanceMessage: string;
}

type RangeKey = "24h" | "7d" | "30d" | "90d" | "365d";
type SeriesKey = "7d" | "30d" | "90d" | "365d";

/* ─────────────────────────── constants ─────────────────────── */

const STATUS_COLORS: Record<string, string> = {
  İzlendi: "#c9a84c",
  İzleniyor: "#818cf8",
  Okundu: "#34d399",
  Okunuyor: "#60a5fa",
  Oynandı: "#f472b6",
  Oynanıyor: "#fb923c",
  Tamamlandı: "#a78bfa",
  "Devam Ediyor": "#38bdf8",
  Belirsiz: "#3a3a5a",
};
const PIE_COLORS = [
  "#c9a84c",
  "#818cf8",
  "#34d399",
  "#60a5fa",
  "#f472b6",
  "#fb923c",
  "#a78bfa",
  "#38bdf8",
  "#e53e3e",
];

const ACTION_META: Record<string, { label: string; color: string; icon: string }> = {
  "post.create": { label: "Not oluşturuldu", color: "#34d399", icon: "+" },
  "post.update": { label: "Not güncellendi", color: "#60a5fa", icon: "↻" },
  "post.delete": { label: "Not silindi", color: "#e53e3e", icon: "×" },
  "user.register": { label: "Yeni kayıt", color: "#c9a84c", icon: "★" },
  "category.create": { label: "Kategori oluşturuldu", color: "#818cf8", icon: "□" },
  "user.follow": { label: "Takip", color: "#f472b6", icon: "♥" },
};

const RANGE_LABELS: Record<RangeKey, string> = {
  "24h": "24 Saat",
  "7d": "7 Gün",
  "30d": "30 Gün",
  "90d": "90 Gün",
  "365d": "1 Yıl",
};
const SERIES_LABELS: Record<SeriesKey, string> = {
  "7d": "7 Gün",
  "30d": "30 Gün",
  "90d": "90 Gün",
  "365d": "1 Yıl",
};

/* ─────────────────────────── helpers ───────────────────────── */

function fmtShortDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}
function fmtTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("tr-TR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
function fmtNumber(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

/* ─────────────────────────── sub-components ────────────────── */

function KpiCard({
  value,
  label,
  color,
  icon,
  sub,
}: {
  value: number;
  label: string;
  color: string;
  icon: React.ReactNode;
  sub?: string;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border p-5 transition-all duration-200 hover:border-opacity-60"
      style={{ background: `${color}08`, borderColor: `${color}20` }}
    >
      <div
        className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-10 blur-2xl"
        style={{ background: color }}
      />
      <div className="relative">
        <div
          className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl border"
          style={{ background: `${color}15`, borderColor: `${color}25`, color }}
        >
          {icon}
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-[28px] font-black leading-none text-[var(--text-primary)]">
            {fmtNumber(value)}
          </span>
          {sub && <span className="text-sm text-[var(--text-muted)]">{sub}</span>}
        </div>
        <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
          {label}
        </p>
      </div>
    </div>
  );
}

function Card({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-[13px] font-semibold text-[var(--text-primary)]">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

const DarkTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-base)] px-3.5 py-2.5 text-xs shadow-2xl">
      {label && <p className="mb-1.5 text-[var(--text-muted)]">{label}</p>}
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: p.color }} />
          <span className="text-[var(--text-secondary)]">{p.name}:</span>
          <span className="font-bold" style={{ color: p.color }}>
            {p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

function Spinner() {
  return (
    <div className="flex h-40 items-center justify-center">
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-[var(--border)] border-t-[#c9a84c]" />
    </div>
  );
}

function RangePills<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: Record<T, string>;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-1">
      {(Object.entries(options) as [T, string][]).map(([k, label]) => (
        <button
          key={k}
          onClick={() => onChange(k)}
          className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-colors duration-150 ${
            value === k ? "bg-[#c9a84c] text-[#0c0c0c]" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

/* ─────────────────────────── main page ─────────────────────── */

export default function AdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"overview" | "users" | "content" | "activity" | "settings">(
    "overview"
  );

  /* stats */
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [seriesRange, setSeriesRange] = useState<SeriesKey>("30d");

  /* users */
  const [users, setUsers] = useState<UserRow[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotalPages, setUsersTotalPages] = useState(1);
  const [userSearch, setUserSearch] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<UserRow | null>(null);

  /* posts */
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [postsTotal, setPostsTotal] = useState(0);
  const [postsPage, setPostsPage] = useState(1);
  const [postsTotalPages, setPostsTotalPages] = useState(1);
  const [postSearch, setPostSearch] = useState("");
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [confirmDeletePost, setConfirmDeletePost] = useState<PostRow | null>(null);

  /* activity */
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsPage, setLogsPage] = useState(1);
  const [logsTotalPages, setLogsTotalPages] = useState(1);
  const [logsFilter, setLogsFilter] = useState("");
  const [chartData, setChartData] = useState<{ label: string; count: number }[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [activityRange, setActivityRange] = useState<RangeKey>("24h");

  /* settings */
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  /* ── fetch stats ── */
  const fetchStats = useCallback(async (series: SeriesKey) => {
    setLoadingStats(true);
    const d = await fetch(`/api/admin/stats?series=${series}`).then((r) => r.json());
    setStats(d);
    setLoadingStats(false);
  }, []);

  useEffect(() => {
    fetchStats(seriesRange);
  }, [seriesRange, fetchStats]);

  /* ── fetch users ── */
  const fetchUsers = useCallback(async (page: number, search: string) => {
    setLoadingUsers(true);
    const p = new URLSearchParams({ page: String(page) });
    if (search) p.set("search", search);
    const d = await fetch(`/api/admin/users?${p}`).then((r) => r.json());
    setUsers(d.users ?? []);
    setUsersTotal(d.total ?? 0);
    setUsersTotalPages(d.totalPages ?? 1);
    setLoadingUsers(false);
  }, []);

  useEffect(() => {
    if (tab === "users") fetchUsers(usersPage, userSearch);
  }, [tab, usersPage, userSearch, fetchUsers]);

  /* ── fetch posts ── */
  const fetchPosts = useCallback(async (page: number, q: string) => {
    setLoadingPosts(true);
    const p = new URLSearchParams({ page: String(page) });
    if (q) p.set("q", q);
    const d = await fetch(`/api/admin/posts?${p}`).then((r) => r.json());
    setPosts(d.posts ?? []);
    setPostsTotal(d.total ?? 0);
    setPostsTotalPages(d.totalPages ?? 1);
    setLoadingPosts(false);
  }, []);

  useEffect(() => {
    if (tab === "content") fetchPosts(postsPage, postSearch);
  }, [tab, postsPage, postSearch, fetchPosts]);

  /* ── fetch activity ── */
  const fetchActivity = useCallback(async (page: number, filter: string, range: RangeKey) => {
    setLoadingLogs(true);
    const p = new URLSearchParams({ page: String(page), range });
    if (filter) p.set("action", filter);
    const d = await fetch(`/api/admin/activity?${p}`).then((r) => r.json());
    setLogs(d.logs ?? []);
    setLogsTotal(d.total ?? 0);
    setLogsTotalPages(d.totalPages ?? 1);
    setChartData(d.chartData ?? []);
    setLoadingLogs(false);
  }, []);

  useEffect(() => {
    if (tab === "activity") fetchActivity(logsPage, logsFilter, activityRange);
  }, [tab, logsPage, logsFilter, activityRange, fetchActivity]);

  /* ── fetch settings ── */
  const fetchSettings = useCallback(async () => {
    setLoadingSettings(true);
    const d = await fetch("/api/admin/settings").then((r) => r.json());
    setSettings(d);
    setLoadingSettings(false);
  }, []);

  useEffect(() => {
    if (tab === "settings") fetchSettings();
  }, [tab, fetchSettings]);

  /* ── toggle admin ── */
  async function toggleAdmin(user: UserRow) {
    await fetch(`/api/admin/users/${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAdmin: !user.isAdmin }),
    });
    fetchUsers(usersPage, userSearch);
  }

  /* ── toggle ban ── */
  async function toggleBan(user: UserRow) {
    await fetch(`/api/admin/users/${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isBanned: !user.isBanned }),
    });
    toast.success(
      user.isBanned ? `${user.name} banlı durumdan çıkarıldı` : `${user.name} banlandı`
    );
    fetchUsers(usersPage, userSearch);
  }

  /* ── delete user ── */
  async function deleteUser(id: string) {
    await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    setConfirmDelete(null);
    toast.success("Kullanıcı silindi");
    fetchUsers(usersPage, userSearch);
  }

  /* ── delete post ── */
  async function deletePost(postId: string) {
    await fetch("/api/admin/posts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId }),
    });
    setConfirmDeletePost(null);
    toast.success("Not silindi");
    fetchPosts(postsPage, postSearch);
  }

  /* ── bulk user actions ── */
  async function runBulkAction(action: "ban" | "unban" | "delete") {
    if (selectedUsers.size === 0) return;
    setBulkLoading(true);
    const res = await fetch("/api/admin/users/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, userIds: Array.from(selectedUsers) }),
    }).then((r) => r.json());
    setBulkLoading(false);
    setSelectedUsers(new Set());
    if (res.success) {
      const labels: Record<string, string> = {
        ban: "Banlandı",
        unban: "Ban kaldırıldı",
        delete: "Silindi",
      };
      toast.success(`${res.affected} kullanıcı — ${labels[action]}`);
    }
    fetchUsers(1, userSearch);
    setUsersPage(1);
  }

  /* ── save settings ── */
  async function saveSettings(patch: Partial<SiteSettings>) {
    setSavingSettings(true);
    const d = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }).then((r) => r.json());
    setSettings(d);
    setSavingSettings(false);
    toast.success("Ayarlar kaydedildi");
  }

  const toggleSelectUser = (id: string) => {
    setSelectedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedUsers((prev) =>
      prev.size === users.length ? new Set() : new Set(users.map((u) => u.id))
    );
  };

  const tabs = [
    {
      key: "overview" as const,
      label: "Genel Bakış",
      icon: (
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
      ),
    },
    {
      key: "users" as const,
      label: "Kullanıcılar",
      icon: (
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      key: "content" as const,
      label: "İçerikler",
      icon: (
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="9" y1="13" x2="15" y2="13" />
        </svg>
      ),
    },
    {
      key: "activity" as const,
      label: "Aktivite",
      icon: (
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      ),
    },
    {
      key: "settings" as const,
      label: "Ayarlar",
      icon: (
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      ),
    },
  ];

  return (
    <main className="min-h-screen bg-[var(--bg-base)] pb-20">
      {/* ── sticky header ── */}
      <div className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--bg-base)]/95 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#c9a84c]/20 bg-[#c9a84c]/10">
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#c9a84c"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              <span className="text-sm font-bold text-[var(--text-primary)]">Admin Paneli</span>
              <span className="hidden rounded-md border border-[#c9a84c]/20 bg-[#c9a84c]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#c9a84c] sm:inline">
                DigyNotes
              </span>
            </div>

            {/* tabs */}
            <nav className="flex items-center gap-1">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-semibold transition-all duration-150 ${
                    tab === t.key
                      ? "bg-[#c9a84c] text-[#0c0c0c] shadow-[0_2px_10px_rgba(201,168,76,0.3)]"
                      : "text-[var(--text-muted)] hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {t.icon}
                  <span className="hidden sm:inline">{t.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
        {/* ══════════════ OVERVIEW ══════════════ */}
        {tab === "overview" && (
          <div className="space-y-5">
            {loadingStats ? (
              <Spinner />
            ) : stats ? (
              <>
                {/* KPI row */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                  <KpiCard
                    value={stats.kpi.totalUsers}
                    label="Kullanıcı"
                    color="#c9a84c"
                    icon={
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      >
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                      </svg>
                    }
                  />
                  <KpiCard
                    value={stats.kpi.totalPosts}
                    label="Not"
                    color="#818cf8"
                    icon={
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                    }
                  />
                  <KpiCard
                    value={stats.kpi.totalCategories}
                    label="Kategori"
                    color="#34d399"
                    icon={
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      >
                        <rect x="3" y="3" width="7" height="7" />
                        <rect x="14" y="3" width="7" height="7" />
                        <rect x="14" y="14" width="7" height="7" />
                        <rect x="3" y="14" width="7" height="7" />
                      </svg>
                    }
                  />
                  <KpiCard
                    value={stats.kpi.totalTags}
                    label="Etiket"
                    color="#f472b6"
                    icon={
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      >
                        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                        <line x1="7" y1="7" x2="7.01" y2="7" />
                      </svg>
                    }
                  />
                  <KpiCard
                    value={stats.kpi.totalFollows}
                    label="Takip"
                    color="#fb923c"
                    icon={
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      >
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                    }
                  />
                  <KpiCard
                    value={stats.kpi.todayActivity}
                    label="Bugün"
                    color="#60a5fa"
                    icon={
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      >
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                      </svg>
                    }
                  />
                </div>

                {/* Series range selector */}
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[var(--text-muted)]">Trend periyodu:</span>
                  <RangePills
                    value={seriesRange}
                    options={SERIES_LABELS}
                    onChange={(v) => setSeriesRange(v)}
                  />
                </div>

                {/* Charts row 1 */}
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                  <Card title={`Not Aktivitesi — Son ${SERIES_LABELS[seriesRange]}`}>
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart
                        data={stats.dailySeries}
                        margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#818cf8" stopOpacity={0.25} />
                            <stop offset="100%" stopColor="#818cf8" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                        <XAxis
                          dataKey="date"
                          tickFormatter={fmtShortDate}
                          tick={{ fill: "#3a3a5a", fontSize: 10 }}
                          interval={Math.max(Math.floor(stats.dailySeries.length / 5) - 1, 0)}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fill: "#3a3a5a", fontSize: 10 }}
                          axisLine={false}
                          tickLine={false}
                          allowDecimals={false}
                        />
                        <Tooltip content={<DarkTooltip />} />
                        <Area
                          type="monotone"
                          dataKey="posts"
                          name="Not"
                          stroke="#818cf8"
                          strokeWidth={2}
                          fill="url(#g1)"
                          dot={false}
                          activeDot={{ r: 4, fill: "#818cf8", strokeWidth: 0 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </Card>

                  <Card title={`Yeni Kullanıcı — Son ${SERIES_LABELS[seriesRange]}`}>
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart
                        data={stats.dailySeries}
                        margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#c9a84c" stopOpacity={0.25} />
                            <stop offset="100%" stopColor="#c9a84c" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                        <XAxis
                          dataKey="date"
                          tickFormatter={fmtShortDate}
                          tick={{ fill: "#3a3a5a", fontSize: 10 }}
                          interval={Math.max(Math.floor(stats.dailySeries.length / 5) - 1, 0)}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fill: "#3a3a5a", fontSize: 10 }}
                          axisLine={false}
                          tickLine={false}
                          allowDecimals={false}
                        />
                        <Tooltip content={<DarkTooltip />} />
                        <Area
                          type="monotone"
                          dataKey="users"
                          name="Kullanıcı"
                          stroke="#c9a84c"
                          strokeWidth={2}
                          fill="url(#g2)"
                          dot={false}
                          activeDot={{ r: 4, fill: "#c9a84c", strokeWidth: 0 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </Card>
                </div>

                {/* Charts row 2 */}
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
                  <div className="lg:col-span-2">
                    <Card title="Durum Dağılımı">
                      <div className="flex items-center gap-3">
                        <ResponsiveContainer width={140} height={140}>
                          <PieChart>
                            <Pie
                              data={stats.postStatusDistribution}
                              dataKey="count"
                              nameKey="status"
                              cx="50%"
                              cy="50%"
                              innerRadius={40}
                              outerRadius={64}
                              strokeWidth={0}
                              paddingAngle={2}
                            >
                              {stats.postStatusDistribution.map((e, i) => (
                                <Cell
                                  key={e.status}
                                  fill={
                                    STATUS_COLORS[e.status] ?? PIE_COLORS[i % PIE_COLORS.length]
                                  }
                                />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                background: "#080a10",
                                border: "1px solid #252d40",
                                borderRadius: 10,
                                fontSize: 12,
                              }}
                              labelStyle={{ color: "#888" }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="flex flex-1 flex-col gap-1.5">
                          {stats.postStatusDistribution.map((s, i) => {
                            const color =
                              STATUS_COLORS[s.status] ?? PIE_COLORS[i % PIE_COLORS.length];
                            const total = stats.postStatusDistribution.reduce(
                              (a, b) => a + b.count,
                              0
                            );
                            return (
                              <div key={s.status} className="flex items-center gap-2">
                                <div
                                  className="h-2 w-2 flex-shrink-0 rounded-sm"
                                  style={{ background: color }}
                                />
                                <span className="flex-1 truncate text-[11px] text-[var(--text-secondary)]">
                                  {s.status}
                                </span>
                                <span className="text-[11px] font-bold text-[var(--text-primary)]">
                                  {s.count}
                                </span>
                                <span className="w-7 text-right text-[9px] text-[var(--text-muted)]">
                                  {total ? Math.round((s.count / total) * 100) : 0}%
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </Card>
                  </div>

                  <div className="lg:col-span-3">
                    <Card title="Kategorilere Göre Not (Top 10)">
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart
                          data={stats.postsPerCategory}
                          layout="vertical"
                          margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
                        >
                          <XAxis
                            type="number"
                            tick={{ fill: "#3a3a5a", fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                            allowDecimals={false}
                          />
                          <YAxis
                            type="category"
                            dataKey="category"
                            tick={{ fill: "#777", fontSize: 11 }}
                            width={68}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip content={<DarkTooltip />} />
                          <Bar
                            dataKey="count"
                            name="Not"
                            fill="#c9a84c"
                            radius={[0, 4, 4, 0]}
                            barSize={14}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </Card>
                  </div>
                </div>

                {/* Top users + Rating */}
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                  <Card title="En Aktif Kullanıcılar">
                    <div className="space-y-2.5">
                      {stats.topUsers.map((u, i) => {
                        const maxPosts = stats.topUsers[0]?.postCount ?? 1;
                        const pct = maxPosts > 0 ? (u.postCount / maxPosts) * 100 : 0;
                        const rankColors = ["#c9a84c", "#a0a0c0", "#b08060"];
                        const rc = rankColors[i] ?? "#2a2a4a";
                        return (
                          <div
                            key={u.id}
                            className="flex cursor-pointer items-center gap-3"
                            onClick={() => router.push(`/admin/users/${u.id}`)}
                          >
                            <span
                              className="w-5 shrink-0 text-center text-xs font-black"
                              style={{ color: rc }}
                            >
                              {i + 1}
                            </span>
                            <div
                              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-[#c9a84c]"
                              style={{ background: `${rc}15`, border: `1px solid ${rc}25` }}
                            >
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="w-24 shrink-0 truncate text-[12px] text-[var(--text-secondary)]">
                              {u.name}
                            </span>
                            <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--bg-raised)]">
                              <div
                                className="h-full rounded-full transition-all duration-700"
                                style={{
                                  width: `${pct}%`,
                                  background: rc,
                                  boxShadow: `0 0 8px ${rc}50`,
                                }}
                              />
                            </div>
                            <span className="w-6 shrink-0 text-right text-[12px] font-black text-[var(--text-primary)]">
                              {u.postCount}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </Card>

                  <Card title="Puan Dağılımı">
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart
                        data={stats.ratingDistribution}
                        margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                        <XAxis
                          dataKey="label"
                          tick={{ fill: "#555", fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fill: "#3a3a5a", fontSize: 10 }}
                          axisLine={false}
                          tickLine={false}
                          allowDecimals={false}
                        />
                        <Tooltip content={<DarkTooltip />} />
                        <Bar dataKey="count" name="Not" fill="#818cf8" radius={[4, 4, 0, 0]}>
                          {stats.ratingDistribution.map((_, i) => (
                            <Cell
                              key={i}
                              fill={
                                i === stats.ratingDistribution.length - 1 ? "#c9a84c" : "#818cf8"
                              }
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>
                </div>

                {/* Tag cloud */}
                <Card title="Popüler Etiketler">
                  <div className="flex flex-wrap gap-2">
                    {stats.topTags.map((tag) => {
                      const max = stats.topTags[0]?.count ?? 1;
                      const t = 0.35 + (tag.count / max) * 0.65;
                      return (
                        <span
                          key={tag.name}
                          className="rounded-lg border px-2.5 py-1 text-xs font-medium"
                          style={{
                            borderColor: `rgba(201,168,76,${t * 0.35})`,
                            background: `rgba(201,168,76,${t * 0.08})`,
                            color: `rgba(201,168,76,${t + 0.1})`,
                          }}
                        >
                          #{tag.name}
                          <span className="ml-1.5 text-[10px] opacity-50">{tag.count}</span>
                        </span>
                      );
                    })}
                  </div>
                </Card>
              </>
            ) : null}
          </div>
        )}

        {/* ══════════════ USERS ══════════════ */}
        {tab === "users" && (
          <div className="space-y-4">
            {/* Search + total */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-0 flex-1 sm:max-w-xs">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--text-muted)"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => {
                    setUserSearch(e.target.value);
                    setUsersPage(1);
                  }}
                  placeholder="İsim, e-posta veya kullanıcı adı..."
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] py-2.5 pl-9 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-all focus:border-[#c9a84c]/40 focus:outline-none focus:ring-1 focus:ring-[#c9a84c]/15"
                />
              </div>
              <div className="text-sm text-[var(--text-muted)]">
                <span className="font-bold text-[var(--text-primary)]">{usersTotal}</span> kullanıcı
              </div>
            </div>

            {/* Bulk action bar */}
            {selectedUsers.size > 0 && (
              <div className="flex items-center gap-3 rounded-xl border border-[#c9a84c]/20 bg-[#c9a84c]/5 px-4 py-2.5">
                <span className="text-sm font-semibold text-[#c9a84c]">
                  {selectedUsers.size} seçildi
                </span>
                <div className="ml-auto flex gap-2">
                  <button
                    onClick={() => runBulkAction("ban")}
                    disabled={bulkLoading}
                    className="rounded-lg border border-[#fb923c]/30 bg-[#fb923c]/10 px-3 py-1.5 text-[12px] font-semibold text-[#fb923c] transition-all hover:bg-[#fb923c]/20 disabled:opacity-50"
                  >
                    Banla
                  </button>
                  <button
                    onClick={() => runBulkAction("unban")}
                    disabled={bulkLoading}
                    className="rounded-lg border border-[#34d399]/30 bg-[#34d399]/10 px-3 py-1.5 text-[12px] font-semibold text-[#34d399] transition-all hover:bg-[#34d399]/20 disabled:opacity-50"
                  >
                    Ban Kaldır
                  </button>
                  <button
                    onClick={() => runBulkAction("delete")}
                    disabled={bulkLoading}
                    className="rounded-lg border border-[#e53e3e]/30 bg-[#e53e3e]/10 px-3 py-1.5 text-[12px] font-semibold text-[#e53e3e] transition-all hover:bg-[#e53e3e]/20 disabled:opacity-50"
                  >
                    Sil
                  </button>
                  <button
                    onClick={() => setSelectedUsers(new Set())}
                    className="rounded-lg px-3 py-1.5 text-[12px] text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                  >
                    İptal
                  </button>
                </div>
              </div>
            )}

            <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="px-4 py-3">
                      <input
                        type="checkbox"
                        className="accent-[#c9a84c]"
                        checked={users.length > 0 && selectedUsers.size === users.length}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    {[
                      "Kullanıcı",
                      "E-posta",
                      "Not",
                      "Takipçi",
                      "Katılım",
                      "Admin",
                      "Ban",
                      "İşlem",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loadingUsers ? (
                    <tr>
                      <td colSpan={9} className="py-16 text-center">
                        <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-[var(--border)] border-t-[#c9a84c]" />
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr
                        key={u.id}
                        className={`group border-b border-[var(--border)] transition-colors hover:bg-[var(--bg-card)] ${u.isBanned ? "opacity-60" : ""}`}
                      >
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            className="accent-[#c9a84c]"
                            checked={selectedUsers.has(u.id)}
                            onChange={() => toggleSelectUser(u.id)}
                          />
                        </td>
                        <td
                          className="cursor-pointer px-4 py-3"
                          onClick={() => router.push(`/admin/users/${u.id}`)}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--bg-raised)] text-xs font-bold text-[#c9a84c]">
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="truncate font-medium text-[var(--text-primary)]">{u.name}</p>
                                {u.isAdmin && (
                                  <span className="shrink-0 rounded bg-[#c9a84c]/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#c9a84c]">
                                    admin
                                  </span>
                                )}
                                {u.isBanned && (
                                  <span className="shrink-0 rounded bg-[#e53e3e]/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#e53e3e]">
                                    ban
                                  </span>
                                )}
                              </div>
                              {u.username && (
                                <p className="text-[10px] text-[var(--text-muted)]">@{u.username}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-[var(--text-muted)]">{u.email}</td>
                        <td className="px-4 py-3 text-center text-sm font-bold text-[var(--text-primary)]">
                          {u.postCount}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-[var(--text-muted)]">
                          {u.followerCount}
                        </td>
                        <td className="px-4 py-3 text-center text-[10px] text-[var(--text-muted)]">
                          {new Date(u.createdAt).toLocaleDateString("tr-TR", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleAdmin(u);
                            }}
                            className={`relative inline-flex h-5 w-9 cursor-pointer items-center rounded-full transition-all duration-200 ${u.isAdmin ? "bg-[#c9a84c]" : "bg-[var(--bg-raised)]"}`}
                          >
                            <span
                              className={`absolute h-3.5 w-3.5 rounded-full bg-white shadow transition-all duration-200 ${u.isAdmin ? "left-[18px]" : "left-[3px]"}`}
                            />
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleBan(u);
                            }}
                            className={`relative inline-flex h-5 w-9 cursor-pointer items-center rounded-full transition-all duration-200 ${u.isBanned ? "bg-[#e53e3e]" : "bg-[var(--bg-raised)]"}`}
                          >
                            <span
                              className={`absolute h-3.5 w-3.5 rounded-full bg-white shadow transition-all duration-200 ${u.isBanned ? "left-[18px]" : "left-[3px]"}`}
                            />
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDelete(u);
                            }}
                            className="rounded-lg px-2 py-1 text-[11px] text-[var(--text-muted)] opacity-0 transition-all hover:bg-[#e53e3e]/10 hover:text-[#e53e3e] group-hover:opacity-100"
                          >
                            Sil
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {usersTotalPages > 1 && (
                <div className="flex items-center justify-between border-t border-[var(--border)] px-4 py-3">
                  <span className="text-xs text-[var(--text-muted)]">
                    Sayfa {usersPage} / {usersTotalPages}
                  </span>
                  <div className="flex gap-2">
                    {[
                      {
                        label: "← Önceki",
                        fn: () => setUsersPage((p) => Math.max(1, p - 1)),
                        disabled: usersPage === 1,
                      },
                      {
                        label: "Sonraki →",
                        fn: () => setUsersPage((p) => Math.min(usersTotalPages, p + 1)),
                        disabled: usersPage === usersTotalPages,
                      },
                    ].map((btn) => (
                      <button
                        key={btn.label}
                        onClick={btn.fn}
                        disabled={btn.disabled}
                        className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-muted)] transition-colors hover:border-[#c9a84c]/30 hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-25"
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════ CONTENT ══════════════ */}
        {tab === "content" && (
          <div className="space-y-5">
            {/* Post search */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-0 flex-1 sm:max-w-sm">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--text-muted)"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  value={postSearch}
                  onChange={(e) => {
                    setPostSearch(e.target.value);
                    setPostsPage(1);
                  }}
                  placeholder="Not başlığı, yazar veya kategori..."
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] py-2.5 pl-9 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-all focus:border-[#c9a84c]/40 focus:outline-none focus:ring-1 focus:ring-[#c9a84c]/15"
                />
              </div>
              <div className="text-sm text-[var(--text-muted)]">
                <span className="font-bold text-[var(--text-primary)]">{postsTotal}</span> not
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    {["Başlık", "Kategori", "Yazar", "Tarih", "Durum", "Puan", "İşlem"].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loadingPosts ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center">
                        <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-[var(--border)] border-t-[#c9a84c]" />
                      </td>
                    </tr>
                  ) : posts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-sm text-[var(--text-muted)]">
                        Not bulunamadı
                      </td>
                    </tr>
                  ) : (
                    posts.map((p) => (
                      <tr
                        key={p.id}
                        className="group border-b border-[var(--border)] transition-colors hover:bg-[var(--bg-card)]"
                      >
                        <td
                          className="cursor-pointer px-4 py-3"
                          onClick={() => router.push(`/posts/${p.id}`)}
                        >
                          <p className="max-w-[180px] truncate font-medium text-[var(--text-primary)] transition-colors hover:text-[#c9a84c]">
                            {p.title}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-xs text-[var(--text-muted)]">{p.category}</td>
                        <td className="px-4 py-3">
                          {p.user ? (
                            <div className="flex items-center gap-2">
                              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--bg-raised)] text-[10px] font-bold text-[#c9a84c]">
                                {p.user.name.charAt(0).toUpperCase()}
                              </div>
                              <span className="text-[11px] text-[var(--text-muted)]">{p.user.name}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-[var(--text-muted)]">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-[10px] text-[var(--text-muted)]">
                          {fmtShortDate(p.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          {p.status ? (
                            <span
                              className="rounded-lg border px-2 py-0.5 text-[10px] font-semibold"
                              style={{
                                borderColor: `${STATUS_COLORS[p.status] ?? "#555"}25`,
                                background: `${STATUS_COLORS[p.status] ?? "#555"}0c`,
                                color: STATUS_COLORS[p.status] ?? "#777",
                              }}
                            >
                              {p.status}
                            </span>
                          ) : (
                            <span className="text-xs text-[var(--text-muted)]">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-[var(--text-secondary)]">
                          {p.rating > 0 ? p.rating.toFixed(1) : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            <button
                              onClick={() => router.push(`/posts/${p.id}/edit`)}
                              className="rounded-lg px-2 py-1 text-[11px] text-[var(--text-muted)] hover:bg-[var(--bg-raised)] hover:text-[#c9a84c]"
                            >
                              Düzenle
                            </button>
                            <button
                              onClick={() => setConfirmDeletePost(p)}
                              className="rounded-lg px-2 py-1 text-[11px] text-[var(--text-muted)] hover:bg-[#e53e3e]/10 hover:text-[#e53e3e]"
                            >
                              Sil
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {postsTotalPages > 1 && (
                <div className="flex items-center justify-between border-t border-[var(--border)] px-4 py-3">
                  <span className="text-xs text-[var(--text-muted)]">
                    Sayfa {postsPage} / {postsTotalPages}
                  </span>
                  <div className="flex gap-2">
                    {[
                      {
                        label: "← Önceki",
                        fn: () => setPostsPage((p) => Math.max(1, p - 1)),
                        disabled: postsPage === 1,
                      },
                      {
                        label: "Sonraki →",
                        fn: () => setPostsPage((p) => Math.min(postsTotalPages, p + 1)),
                        disabled: postsPage === postsTotalPages,
                      },
                    ].map((btn) => (
                      <button
                        key={btn.label}
                        onClick={btn.fn}
                        disabled={btn.disabled}
                        className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-muted)] transition-colors hover:border-[#c9a84c]/30 hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-25"
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════ ACTIVITY ══════════════ */}
        {tab === "activity" && (
          <div className="space-y-5">
            {/* Range selector */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs text-[var(--text-muted)]">Aktivite periyodu:</span>
              <RangePills
                value={activityRange}
                options={RANGE_LABELS}
                onChange={(v) => {
                  setActivityRange(v);
                  setLogsPage(1);
                }}
              />
            </div>

            {/* Chart */}
            <Card title={`Aktivite — ${RANGE_LABELS[activityRange]}`}>
              {loadingLogs ? (
                <div className="flex h-32 items-center justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--border)] border-t-[#c9a84c]" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={chartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: "#3a3a5a", fontSize: 10 }}
                      interval={Math.max(Math.floor(chartData.length / 8) - 1, 0)}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "#3a3a5a", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip content={<DarkTooltip />} />
                    <Bar dataKey="count" name="Aktivite" radius={[3, 3, 0, 0]}>
                      {chartData.map((d, i) => (
                        <Cell key={i} fill={d.count > 0 ? "#60a5fa" : "var(--border)"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>

            {/* Filter tabs */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex flex-wrap items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-1">
                <button
                  onClick={() => {
                    setLogsFilter("");
                    setLogsPage(1);
                  }}
                  className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-colors ${!logsFilter ? "bg-[var(--bg-raised)] text-[var(--text-primary)]" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"}`}
                >
                  Tümü
                </button>
                {Object.entries(ACTION_META).map(([key, val]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setLogsFilter(key);
                      setLogsPage(1);
                    }}
                    className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-colors ${logsFilter === key ? "bg-[var(--bg-raised)] text-[var(--text-primary)]" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"}`}
                  >
                    {val.label}
                  </button>
                ))}
              </div>
              <span className="text-xs text-[var(--text-muted)]">
                <span className="font-bold text-[var(--text-secondary)]">{logsTotal}</span> kayıt
              </span>
            </div>

            {/* Log table */}
            <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    {["Zaman", "Kullanıcı", "Aksiyon", "Detay"].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loadingLogs ? (
                    <tr>
                      <td colSpan={4} className="py-16 text-center">
                        <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-[var(--border)] border-t-[#c9a84c]" />
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-16 text-center text-sm text-[var(--text-muted)]">
                        Henüz aktivite kaydı yok
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => {
                      const meta = ACTION_META[log.action] ?? {
                        label: log.action,
                        color: "#555",
                        icon: "·",
                      };
                      const data = log.metadata as Record<string, string> | null;
                      return (
                        <tr
                          key={log.id}
                          className="border-b border-[var(--border)] transition-colors hover:bg-[var(--bg-card)]"
                        >
                          <td className="whitespace-nowrap px-4 py-3 text-[11px] text-[var(--text-muted)]">
                            {fmtTime(log.createdAt)}
                          </td>
                          <td className="px-4 py-3">
                            {log.user ? (
                              <div className="flex items-center gap-2">
                                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--bg-raised)] text-[10px] font-bold text-[#c9a84c]">
                                  {log.user.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="text-[12px] text-[var(--text-secondary)]">{log.user.name}</p>
                                  {log.user.username && (
                                    <p className="text-[10px] text-[var(--text-muted)]">@{log.user.username}</p>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs text-[var(--text-muted)]">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className="inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-[11px] font-semibold"
                              style={{
                                borderColor: `${meta.color}25`,
                                background: `${meta.color}0c`,
                                color: meta.color,
                              }}
                            >
                              <span className="text-xs leading-none">{meta.icon}</span>
                              {meta.label}
                            </span>
                          </td>
                          <td className="max-w-[200px] truncate px-4 py-3 text-[12px] text-[var(--text-muted)]">
                            {data?.title ??
                              data?.name ??
                              (data?.targetUsername ? `→ @${data.targetUsername}` : "—")}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>

              {logsTotalPages > 1 && (
                <div className="flex items-center justify-between border-t border-[var(--border)] px-4 py-3">
                  <span className="text-xs text-[var(--text-muted)]">
                    Sayfa {logsPage} / {logsTotalPages}
                  </span>
                  <div className="flex gap-2">
                    {[
                      {
                        label: "← Önceki",
                        fn: () => setLogsPage((p) => Math.max(1, p - 1)),
                        disabled: logsPage === 1,
                      },
                      {
                        label: "Sonraki →",
                        fn: () => setLogsPage((p) => Math.min(logsTotalPages, p + 1)),
                        disabled: logsPage === logsTotalPages,
                      },
                    ].map((btn) => (
                      <button
                        key={btn.label}
                        onClick={btn.fn}
                        disabled={btn.disabled}
                        className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-muted)] transition-colors hover:border-[#c9a84c]/30 hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-25"
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════ SETTINGS ══════════════ */}
        {tab === "settings" && (
          <div className="max-w-2xl space-y-5">
            {loadingSettings ? (
              <Spinner />
            ) : settings ? (
              <>
                {/* Registration */}
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#34d399]/20 bg-[#34d399]/10">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#34d399"
                        strokeWidth="2"
                        strokeLinecap="round"
                      >
                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="8.5" cy="7" r="4" />
                        <line x1="20" y1="8" x2="20" y2="14" />
                        <line x1="23" y1="11" x2="17" y2="11" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--text-primary)]">Yeni Kayıt</h3>
                      <p className="text-xs text-[var(--text-muted)]">Yeni kullanıcı kaydını aç veya kapat</p>
                    </div>
                    <div className="ml-auto">
                      <button
                        onClick={() =>
                          saveSettings({
                            registrationEnabled:
                              settings.registrationEnabled === "true" ? "false" : "true",
                          })
                        }
                        disabled={savingSettings}
                        className={`relative inline-flex h-6 w-11 cursor-pointer items-center rounded-full transition-all duration-200 disabled:opacity-50 ${settings.registrationEnabled === "true" ? "bg-[#34d399]" : "bg-[var(--bg-raised)]"}`}
                      >
                        <span
                          className={`absolute h-4 w-4 rounded-full bg-white shadow transition-all duration-200 ${settings.registrationEnabled === "true" ? "left-[22px]" : "left-[3px]"}`}
                        />
                      </button>
                    </div>
                  </div>
                  <div
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold ${
                      settings.registrationEnabled === "true"
                        ? "border-[#34d399]/20 bg-[#34d399]/10 text-[#34d399]"
                        : "border-[#e53e3e]/20 bg-[#e53e3e]/10 text-[#e53e3e]"
                    }`}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{
                        background: settings.registrationEnabled === "true" ? "#34d399" : "#e53e3e",
                      }}
                    />
                    {settings.registrationEnabled === "true" ? "Kayıt Açık" : "Kayıt Kapalı"}
                  </div>
                </div>

                {/* Maintenance Mode */}
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#fb923c]/20 bg-[#fb923c]/10">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#fb923c"
                        strokeWidth="2"
                        strokeLinecap="round"
                      >
                        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--text-primary)]">Bakım Modu</h3>
                      <p className="text-xs text-[var(--text-muted)]">
                        Yöneticiler dışında tüm kullanıcılar bakım sayfasına yönlendirilir
                      </p>
                    </div>
                    <div className="ml-auto">
                      <button
                        onClick={() =>
                          saveSettings({
                            maintenanceMode: settings.maintenanceMode === "true" ? "false" : "true",
                          })
                        }
                        disabled={savingSettings}
                        className={`relative inline-flex h-6 w-11 cursor-pointer items-center rounded-full transition-all duration-200 disabled:opacity-50 ${settings.maintenanceMode === "true" ? "bg-[#fb923c]" : "bg-[var(--bg-raised)]"}`}
                      >
                        <span
                          className={`absolute h-4 w-4 rounded-full bg-white shadow transition-all duration-200 ${settings.maintenanceMode === "true" ? "left-[22px]" : "left-[3px]"}`}
                        />
                      </button>
                    </div>
                  </div>

                  {settings.maintenanceMode === "true" && (
                    <div className="mb-3 flex items-center gap-1.5 rounded-lg border border-[#fb923c]/20 bg-[#fb923c]/10 px-2.5 py-1 text-[11px] font-semibold text-[#fb923c]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#fb923c]" />
                      Bakım modu aktif — admin olmayan kullanıcılar engellenecek
                    </div>
                  )}

                  {/* Maintenance message */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-[var(--text-muted)]">Bakım Mesajı</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        defaultValue={settings.maintenanceMessage}
                        onBlur={(e) => {
                          if (e.target.value !== settings.maintenanceMessage) {
                            saveSettings({ maintenanceMessage: e.target.value });
                          }
                        }}
                        className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-all focus:border-[#c9a84c]/40 focus:outline-none focus:ring-1 focus:ring-[#c9a84c]/15"
                        placeholder="Bakım mesajı..."
                      />
                    </div>
                    <p className="text-[10px] text-[var(--text-muted)]">
                      Odak dışına çıkınca otomatik kaydedilir
                    </p>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        )}
      </div>

      {/* ── Delete user confirm modal ── */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-2xl">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-[#e53e3e]/20 bg-[#e53e3e]/10">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#e53e3e"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </div>
            <h3 className="mb-1 text-base font-bold text-[var(--text-primary)]">Kullanıcıyı Sil</h3>
            <p className="mb-1 text-sm text-[var(--text-secondary)]">
              <span className="font-semibold text-[var(--text-primary)]">{confirmDelete.name}</span> silinecek.
            </p>
            <p className="mb-5 text-xs text-[var(--text-muted)]">
              Bu işlem geri alınamaz. Tüm notları ve kategorileri de silinir.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="rounded-lg px-4 py-2 text-sm text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)]"
              >
                İptal
              </button>
              <button
                onClick={() => deleteUser(confirmDelete.id)}
                className="rounded-lg bg-[#e53e3e] px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-[#f05252] active:scale-95"
              >
                Evet, Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete post confirm modal ── */}
      {confirmDeletePost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-2xl">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-[#e53e3e]/20 bg-[#e53e3e]/10">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#e53e3e"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </div>
            <h3 className="mb-1 text-base font-bold text-[var(--text-primary)]">Notu Sil</h3>
            <p className="mb-1 text-sm text-[var(--text-secondary)]">
              <span className="font-semibold text-[var(--text-primary)]">{confirmDeletePost.title}</span>{" "}
              silinecek.
            </p>
            <p className="mb-5 text-xs text-[var(--text-muted)]">Bu işlem geri alınamaz.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDeletePost(null)}
                className="rounded-lg px-4 py-2 text-sm text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)]"
              >
                İptal
              </button>
              <button
                onClick={() => deletePost(confirmDeletePost.id)}
                className="rounded-lg bg-[#e53e3e] px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-[#f05252] active:scale-95"
              >
                Evet, Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
