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

/* ─────────────────────────── types ─────────────────────────── */

interface StatsData {
  kpi: { totalUsers: number; totalPosts: number; totalCategories: number; totalTags: number; totalFollows: number; todayActivity: number };
  dailySeries: { date: string; posts: number; users: number }[];
  postStatusDistribution: { status: string; count: number }[];
  postsPerCategory: { category: string; count: number }[];
  topUsers: { id: string; name: string; username: string | null; postCount: number }[];
  topTags: { name: string; count: number }[];
  ratingDistribution: { label: string; count: number }[];
}

interface UserRow {
  id: string; name: string; email: string; username: string | null;
  isAdmin: boolean; isPublic: boolean; createdAt: string;
  postCount: number; followerCount: number; followingCount: number;
}

interface ActivityLog {
  id: string; action: string; metadata: Record<string, unknown> | null; createdAt: string;
  user: { id: string; name: string; username: string | null } | null;
}

/* ─────────────────────────── constants ─────────────────────── */

const STATUS_COLORS: Record<string, string> = {
  "İzlendi": "#c9a84c", "İzleniyor": "#818cf8", "Okundu": "#34d399",
  "Okunuyor": "#60a5fa", "Oynandı": "#f472b6", "Oynanıyor": "#fb923c",
  "Tamamlandı": "#a78bfa", "Devam Ediyor": "#38bdf8", "Belirsiz": "#3a3a5a",
};
const PIE_COLORS = ["#c9a84c","#818cf8","#34d399","#60a5fa","#f472b6","#fb923c","#a78bfa","#38bdf8","#e53e3e"];

const ACTION_META: Record<string, { label: string; color: string; icon: string }> = {
  "post.create":    { label: "Not oluşturuldu",   color: "#34d399", icon: "+" },
  "post.update":    { label: "Not güncellendi",   color: "#60a5fa", icon: "↻" },
  "post.delete":    { label: "Not silindi",        color: "#e53e3e", icon: "×" },
  "user.register":  { label: "Yeni kayıt",         color: "#c9a84c", icon: "★" },
  "category.create":{ label: "Kategori oluşturuldu", color: "#818cf8", icon: "□" },
  "user.follow":    { label: "Takip",              color: "#f472b6", icon: "♥" },
};

/* ─────────────────────────── helpers ───────────────────────── */

function fmtShortDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}
function fmtTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}
function fmtNumber(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

/* ─────────────────────────── sub-components ────────────────── */

function KpiCard({
  value, label, color, icon, sub,
}: { value: number; label: string; color: string; icon: React.ReactNode; sub?: string }) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border p-5 transition-all duration-200 hover:border-opacity-60"
      style={{ background: `${color}08`, borderColor: `${color}20` }}
    >
      {/* glow blob */}
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
          <span className="text-[28px] font-black leading-none text-[#f0ede8]">
            {fmtNumber(value)}
          </span>
          {sub && <span className="text-sm text-[#444]">{sub}</span>}
        </div>
        <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#3a3a5a]">
          {label}
        </p>
      </div>
    </div>
  );
}

function Card({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#1a1e2e] bg-[#0d0f1a] p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-[13px] font-semibold text-[#f0ede8]">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

const DarkTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-[#252d40] bg-[#080a10] px-3.5 py-2.5 text-xs shadow-2xl">
      {label && <p className="mb-1.5 text-[#555]">{label}</p>}
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: p.color }} />
          <span className="text-[#888]">{p.name}:</span>
          <span className="font-bold" style={{ color: p.color }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

function Spinner() {
  return (
    <div className="flex h-40 items-center justify-center">
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#1a1e2e] border-t-[#c9a84c]" />
    </div>
  );
}

/* ─────────────────────────── main page ─────────────────────── */

export default function AdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"overview" | "users" | "content" | "activity">("overview");

  /* stats */
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  /* users */
  const [users, setUsers] = useState<UserRow[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotalPages, setUsersTotalPages] = useState(1);
  const [userSearch, setUserSearch] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(false);

  /* activity */
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsPage, setLogsPage] = useState(1);
  const [logsTotalPages, setLogsTotalPages] = useState(1);
  const [logsFilter, setLogsFilter] = useState("");
  const [hourly, setHourly] = useState<{ label: string; count: number }[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  /* confirm delete */
  const [confirmDelete, setConfirmDelete] = useState<UserRow | null>(null);

  /* ── fetch stats ── */
  useEffect(() => {
    setLoadingStats(true);
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then(setStats)
      .finally(() => setLoadingStats(false));
  }, []);

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

  useEffect(() => { if (tab === "users") fetchUsers(usersPage, userSearch); }, [tab, usersPage, userSearch, fetchUsers]);

  /* ── fetch activity ── */
  const fetchActivity = useCallback(async (page: number, filter: string) => {
    setLoadingLogs(true);
    const p = new URLSearchParams({ page: String(page) });
    if (filter) p.set("action", filter);
    const d = await fetch(`/api/admin/activity?${p}`).then((r) => r.json());
    setLogs(d.logs ?? []);
    setLogsTotal(d.total ?? 0);
    setLogsTotalPages(d.totalPages ?? 1);
    setHourly(d.hourlyData ?? []);
    setLoadingLogs(false);
  }, []);

  useEffect(() => { if (tab === "activity") fetchActivity(logsPage, logsFilter); }, [tab, logsPage, logsFilter, fetchActivity]);

  /* ── toggle admin ── */
  async function toggleAdmin(user: UserRow) {
    await fetch(`/api/admin/users/${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAdmin: !user.isAdmin }),
    });
    fetchUsers(usersPage, userSearch);
  }

  /* ── delete user ── */
  async function deleteUser(id: string) {
    await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    setConfirmDelete(null);
    fetchUsers(usersPage, userSearch);
  }

  const tabs = [
    { key: "overview" as const, label: "Genel Bakış", icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
    { key: "users" as const,    label: "Kullanıcılar", icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
    { key: "content" as const,  label: "İçerikler",   icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/></svg> },
    { key: "activity" as const, label: "Aktivite",    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
  ];

  return (
    <main className="min-h-screen bg-[#070910] pb-20">

      {/* ── sticky header ── */}
      <div className="sticky top-0 z-30 border-b border-[#1a1e2e] bg-[#070910]/95 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#c9a84c]/20 bg-[#c9a84c]/10">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="2" strokeLinecap="round">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              <span className="text-sm font-bold text-[#f0ede8]">Admin Paneli</span>
              <span className="hidden rounded-md border border-[#c9a84c]/20 bg-[#c9a84c]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#c9a84c] sm:inline">DigyNotes</span>
            </div>

            {/* tabs */}
            <nav className="flex items-center gap-1">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-all duration-150 ${
                    tab === t.key
                      ? "bg-[#c9a84c] text-[#0c0c0c] shadow-[0_2px_10px_rgba(201,168,76,0.3)]"
                      : "text-[#555] hover:bg-[#1a1e2e] hover:text-[#f0ede8]"
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
            {loadingStats ? <Spinner /> : stats ? (
              <>
                {/* KPI row */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                  <KpiCard value={stats.kpi.totalUsers} label="Kullanıcı" color="#c9a84c"
                    icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
                  />
                  <KpiCard value={stats.kpi.totalPosts} label="Not" color="#818cf8"
                    icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/></svg>}
                  />
                  <KpiCard value={stats.kpi.totalCategories} label="Kategori" color="#34d399"
                    icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>}
                  />
                  <KpiCard value={stats.kpi.totalTags} label="Etiket" color="#f472b6"
                    icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>}
                  />
                  <KpiCard value={stats.kpi.totalFollows} label="Takip" color="#fb923c"
                    icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>}
                  />
                  <KpiCard value={stats.kpi.todayActivity} label="Bugün" color="#60a5fa"
                    icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>}
                  />
                </div>

                {/* Charts row 1 */}
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                  <Card title="Not Aktivitesi — Son 30 Gün">
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={stats.dailySeries} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                        <defs>
                          <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#818cf8" stopOpacity={0.25}/>
                            <stop offset="100%" stopColor="#818cf8" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1a1e2e" vertical={false}/>
                        <XAxis dataKey="date" tickFormatter={fmtShortDate} tick={{ fill: "#3a3a5a", fontSize: 10 }} interval={6} axisLine={false} tickLine={false}/>
                        <YAxis tick={{ fill: "#3a3a5a", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false}/>
                        <Tooltip content={<DarkTooltip />}/>
                        <Area type="monotone" dataKey="posts" name="Not" stroke="#818cf8" strokeWidth={2} fill="url(#g1)" dot={false} activeDot={{ r: 4, fill: "#818cf8", strokeWidth: 0 }}/>
                      </AreaChart>
                    </ResponsiveContainer>
                  </Card>

                  <Card title="Yeni Kullanıcı — Son 30 Gün">
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={stats.dailySeries} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                        <defs>
                          <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#c9a84c" stopOpacity={0.25}/>
                            <stop offset="100%" stopColor="#c9a84c" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1a1e2e" vertical={false}/>
                        <XAxis dataKey="date" tickFormatter={fmtShortDate} tick={{ fill: "#3a3a5a", fontSize: 10 }} interval={6} axisLine={false} tickLine={false}/>
                        <YAxis tick={{ fill: "#3a3a5a", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false}/>
                        <Tooltip content={<DarkTooltip />}/>
                        <Area type="monotone" dataKey="users" name="Kullanıcı" stroke="#c9a84c" strokeWidth={2} fill="url(#g2)" dot={false} activeDot={{ r: 4, fill: "#c9a84c", strokeWidth: 0 }}/>
                      </AreaChart>
                    </ResponsiveContainer>
                  </Card>
                </div>

                {/* Charts row 2 */}
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
                  {/* Donut - 2 cols */}
                  <div className="lg:col-span-2">
                    <Card title="Durum Dağılımı">
                      <div className="flex items-center gap-3">
                        <ResponsiveContainer width={140} height={140}>
                          <PieChart>
                            <Pie data={stats.postStatusDistribution} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius={40} outerRadius={64} strokeWidth={0} paddingAngle={2}>
                              {stats.postStatusDistribution.map((e, i) => (
                                <Cell key={e.status} fill={STATUS_COLORS[e.status] ?? PIE_COLORS[i % PIE_COLORS.length]}/>
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{ background: "#080a10", border: "1px solid #252d40", borderRadius: 10, fontSize: 12 }}
                              labelStyle={{ color: "#888" }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="flex flex-1 flex-col gap-1.5">
                          {stats.postStatusDistribution.map((s, i) => {
                            const color = STATUS_COLORS[s.status] ?? PIE_COLORS[i % PIE_COLORS.length];
                            const total = stats.postStatusDistribution.reduce((a, b) => a + b.count, 0);
                            return (
                              <div key={s.status} className="flex items-center gap-2">
                                <div className="h-2 w-2 flex-shrink-0 rounded-sm" style={{ background: color }}/>
                                <span className="flex-1 truncate text-[11px] text-[#777]">{s.status}</span>
                                <span className="text-[11px] font-bold text-[#f0ede8]">{s.count}</span>
                                <span className="w-7 text-right text-[9px] text-[#444]">{total ? Math.round((s.count / total) * 100) : 0}%</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </Card>
                  </div>

                  {/* Category bar - 3 cols */}
                  <div className="lg:col-span-3">
                    <Card title="Kategorilere Göre Not (Top 10)">
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={stats.postsPerCategory} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                          <XAxis type="number" tick={{ fill: "#3a3a5a", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false}/>
                          <YAxis type="category" dataKey="category" tick={{ fill: "#777", fontSize: 11 }} width={68} axisLine={false} tickLine={false}/>
                          <Tooltip content={<DarkTooltip />}/>
                          <Bar dataKey="count" name="Not" fill="#c9a84c" radius={[0, 4, 4, 0]} barSize={14}/>
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
                          <div key={u.id} className="flex items-center gap-3">
                            <span className="w-5 shrink-0 text-center text-xs font-black" style={{ color: rc }}>{i + 1}</span>
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-[#c9a84c]" style={{ background: `${rc}15`, border: `1px solid ${rc}25` }}>
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="w-24 shrink-0 truncate text-[12px] text-[#888]">{u.name}</span>
                            <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-[#1a1e2e]">
                              <div
                                className="h-full rounded-full transition-all duration-700"
                                style={{ width: `${pct}%`, background: rc, boxShadow: `0 0 8px ${rc}50` }}
                              />
                            </div>
                            <span className="w-6 shrink-0 text-right text-[12px] font-black text-[#f0ede8]">{u.postCount}</span>
                          </div>
                        );
                      })}
                    </div>
                  </Card>

                  <Card title="Puan Dağılımı">
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={stats.ratingDistribution} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1a1e2e" vertical={false}/>
                        <XAxis dataKey="label" tick={{ fill: "#555", fontSize: 11 }} axisLine={false} tickLine={false}/>
                        <YAxis tick={{ fill: "#3a3a5a", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false}/>
                        <Tooltip content={<DarkTooltip />}/>
                        <Bar dataKey="count" name="Not" fill="#818cf8" radius={[4, 4, 0, 0]}>
                          {stats.ratingDistribution.map((_, i) => (
                            <Cell key={i} fill={i === stats.ratingDistribution.length - 1 ? "#c9a84c" : "#818cf8"}/>
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
                          style={{ borderColor: `rgba(201,168,76,${t * 0.35})`, background: `rgba(201,168,76,${t * 0.08})`, color: `rgba(201,168,76,${t + 0.1})` }}
                        >
                          #{tag.name}
                          <span className="ml-1.5 opacity-50 text-[10px]">{tag.count}</span>
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
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-0 flex-1 sm:max-w-xs">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="2" strokeLinecap="round">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => { setUserSearch(e.target.value); setUsersPage(1); }}
                  placeholder="İsim, e-posta veya kullanıcı adı..."
                  className="w-full rounded-xl border border-[#1a1e2e] bg-[#0a0c14] py-2.5 pl-9 pr-4 text-sm text-[#f0ede8] placeholder-[#333] focus:border-[#c9a84c]/40 focus:outline-none focus:ring-1 focus:ring-[#c9a84c]/15 transition-all"
                />
              </div>
              <div className="flex items-center gap-2 text-sm text-[#444]">
                <span className="font-bold text-[#f0ede8]">{usersTotal}</span> kullanıcı
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-[#1a1e2e] bg-[#0d0f1a]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1a1e2e]">
                    {["Kullanıcı","E-posta","Not","Takipçi","Katılım","Admin","İşlem"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#333]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loadingUsers ? (
                    <tr><td colSpan={7} className="py-16 text-center"><div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-[#1a1e2e] border-t-[#c9a84c]"/></td></tr>
                  ) : users.map((u) => (
                    <tr key={u.id} onClick={() => router.push(`/admin/users/${u.id}`)} className="group cursor-pointer border-b border-[#0a0c12] transition-colors hover:bg-[#0a0c14]">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#141925] text-xs font-bold text-[#c9a84c]">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="truncate font-medium text-[#f0ede8]">{u.name}</p>
                              {u.isAdmin && <span className="shrink-0 rounded bg-[#c9a84c]/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#c9a84c]">admin</span>}
                            </div>
                            {u.username && <p className="text-[10px] text-[#3a3a5a]">@{u.username}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-[#555]">{u.email}</td>
                      <td className="px-4 py-3 text-center text-sm font-bold text-[#f0ede8]">{u.postCount}</td>
                      <td className="px-4 py-3 text-center text-sm text-[#666]">{u.followerCount}</td>
                      <td className="px-4 py-3 text-center text-[10px] text-[#444]">
                        {new Date(u.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleAdmin(u); }}
                          className={`relative inline-flex h-5 w-9 cursor-pointer items-center rounded-full transition-all duration-200 ${u.isAdmin ? "bg-[#c9a84c]" : "bg-[#1a1e2e]"}`}
                        >
                          <span className={`absolute h-3.5 w-3.5 rounded-full bg-white shadow transition-all duration-200 ${u.isAdmin ? "left-[18px]" : "left-[3px]"}`}/>
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={(e) => { e.stopPropagation(); setConfirmDelete(u); }}
                          className="rounded-lg px-2 py-1 text-[11px] text-[#444] opacity-0 transition-all group-hover:opacity-100 hover:bg-[#e53e3e]/10 hover:text-[#e53e3e]"
                        >
                          Sil
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {usersTotalPages > 1 && (
                <div className="flex items-center justify-between border-t border-[#1a1e2e] px-4 py-3">
                  <span className="text-xs text-[#444]">Sayfa {usersPage} / {usersTotalPages}</span>
                  <div className="flex gap-2">
                    {[{ label: "← Önceki", fn: () => setUsersPage((p) => Math.max(1, p - 1)), disabled: usersPage === 1 },
                      { label: "Sonraki →", fn: () => setUsersPage((p) => Math.min(usersTotalPages, p + 1)), disabled: usersPage === usersTotalPages }
                    ].map((btn) => (
                      <button key={btn.label} onClick={btn.fn} disabled={btn.disabled}
                        className="rounded-lg border border-[#1a1e2e] px-3 py-1.5 text-xs text-[#555] transition-colors hover:border-[#c9a84c]/30 hover:text-[#f0ede8] disabled:cursor-not-allowed disabled:opacity-25">
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
            {loadingStats ? <Spinner /> : stats ? (
              <>
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                  <Card title="Kategori Kırılımı">
                    <div className="space-y-3">
                      {stats.postsPerCategory.map((cat) => {
                        const max = stats.postsPerCategory[0]?.count ?? 1;
                        const pct = (cat.count / max) * 100;
                        return (
                          <div key={cat.category} className="flex items-center gap-3">
                            <span className="w-20 shrink-0 truncate text-[12px] text-[#777]">{cat.category}</span>
                            <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-[#1a1e2e]">
                              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: "#c9a84c", boxShadow: "0 0 8px rgba(201,168,76,0.35)" }}/>
                            </div>
                            <div className="flex w-14 shrink-0 items-center justify-end gap-1.5">
                              <span className="text-xs font-bold text-[#f0ede8]">{cat.count}</span>
                              <span className="text-[9px] text-[#3a3a5a]">{Math.round(pct)}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>

                  <Card title="Puan Dağılımı">
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={stats.ratingDistribution} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1a1e2e" vertical={false}/>
                        <XAxis dataKey="label" tick={{ fill: "#555", fontSize: 11 }} axisLine={false} tickLine={false}/>
                        <YAxis tick={{ fill: "#3a3a5a", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false}/>
                        <Tooltip content={<DarkTooltip />}/>
                        <Bar dataKey="count" name="Not Sayısı" radius={[4, 4, 0, 0]}>
                          {stats.ratingDistribution.map((_, i) => (
                            <Cell key={i} fill={i === stats.ratingDistribution.length - 1 ? "#c9a84c" : "#818cf8"}/>
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>
                </div>

                {/* Status cards */}
                <Card title="Not Durumları">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {stats.postStatusDistribution.map((s, i) => {
                      const color = STATUS_COLORS[s.status] ?? PIE_COLORS[i % PIE_COLORS.length];
                      const total = stats.postStatusDistribution.reduce((a, b) => a + b.count, 0);
                      const pct = total ? (s.count / total) * 100 : 0;
                      return (
                        <div key={s.status} className="rounded-xl border p-4 transition-all" style={{ borderColor: `${color}20`, background: `${color}06` }}>
                          <div className="mb-3 h-1 w-full overflow-hidden rounded-full bg-[#1a1e2e]">
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }}/>
                          </div>
                          <p className="text-2xl font-black text-[#f0ede8]">{s.count}</p>
                          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color }}>{s.status}</p>
                        </div>
                      );
                    })}
                  </div>
                </Card>

                {/* Tag cloud */}
                <Card title="Etiket Frekansı">
                  <div className="flex flex-wrap gap-2">
                    {stats.topTags.map((tag) => {
                      const max = stats.topTags[0]?.count ?? 1;
                      const t = 0.3 + (tag.count / max) * 0.7;
                      const size = tag.count >= max * 0.66 ? "text-sm" : tag.count >= max * 0.33 ? "text-xs" : "text-[11px]";
                      return (
                        <span key={tag.name} className={`rounded-xl border px-3 py-1.5 font-medium ${size}`}
                          style={{ borderColor: `rgba(129,140,248,${t * 0.35})`, background: `rgba(129,140,248,${t * 0.08})`, color: `rgba(129,140,248,${t + 0.1})` }}>
                          #{tag.name}<span className="ml-1.5 text-[10px] opacity-50">{tag.count}</span>
                        </span>
                      );
                    })}
                  </div>
                </Card>
              </>
            ) : null}
          </div>
        )}

        {/* ══════════════ ACTIVITY ══════════════ */}
        {tab === "activity" && (
          <div className="space-y-5">
            {/* Hourly chart */}
            <Card title="Son 24 Saat — Saatlik Aktivite">
              {loadingLogs ? (
                <div className="flex h-32 items-center justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#1a1e2e] border-t-[#c9a84c]"/>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={hourly} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a1e2e" vertical={false}/>
                    <XAxis dataKey="label" tick={{ fill: "#3a3a5a", fontSize: 10 }} interval={2} axisLine={false} tickLine={false}/>
                    <YAxis tick={{ fill: "#3a3a5a", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false}/>
                    <Tooltip content={<DarkTooltip />}/>
                    <Bar dataKey="count" name="Aktivite" radius={[3, 3, 0, 0]}>
                      {hourly.map((h, i) => (
                        <Cell key={i} fill={h.count > 0 ? "#60a5fa" : "#1a1e2e"}/>
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>

            {/* Filter tabs */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex flex-wrap items-center gap-1 rounded-xl border border-[#1a1e2e] bg-[#0a0c14] p-1">
                <button onClick={() => { setLogsFilter(""); setLogsPage(1); }}
                  className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-colors ${!logsFilter ? "bg-[#1a1e2e] text-[#f0ede8]" : "text-[#444] hover:text-[#888]"}`}>
                  Tümü
                </button>
                {Object.entries(ACTION_META).map(([key, val]) => (
                  <button key={key} onClick={() => { setLogsFilter(key); setLogsPage(1); }}
                    className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-colors ${logsFilter === key ? "bg-[#1a1e2e] text-[#f0ede8]" : "text-[#444] hover:text-[#888]"}`}>
                    {val.label}
                  </button>
                ))}
              </div>
              <span className="text-xs text-[#444]"><span className="font-bold text-[#888]">{logsTotal}</span> kayıt</span>
            </div>

            {/* Log table */}
            <div className="overflow-hidden rounded-2xl border border-[#1a1e2e] bg-[#0d0f1a]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1a1e2e]">
                    {["Zaman","Kullanıcı","Aksiyon","Detay"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#333]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loadingLogs ? (
                    <tr><td colSpan={4} className="py-16 text-center"><div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-[#1a1e2e] border-t-[#c9a84c]"/></td></tr>
                  ) : logs.length === 0 ? (
                    <tr><td colSpan={4} className="py-16 text-center text-sm text-[#333]">Henüz aktivite kaydı yok</td></tr>
                  ) : logs.map((log) => {
                    const meta = ACTION_META[log.action] ?? { label: log.action, color: "#555", icon: "·" };
                    const data = log.metadata as Record<string, string> | null;
                    return (
                      <tr key={log.id} className="border-b border-[#0a0c12] transition-colors hover:bg-[#0a0c14]">
                        <td className="px-4 py-3 text-[11px] text-[#444] whitespace-nowrap">{fmtTime(log.createdAt)}</td>
                        <td className="px-4 py-3">
                          {log.user ? (
                            <div className="flex items-center gap-2">
                              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#141925] text-[10px] font-bold text-[#c9a84c]">
                                {log.user.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-[12px] text-[#888]">{log.user.name}</p>
                                {log.user.username && <p className="text-[10px] text-[#333]">@{log.user.username}</p>}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-[#333]">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-[11px] font-semibold"
                            style={{ borderColor: `${meta.color}25`, background: `${meta.color}0c`, color: meta.color }}>
                            <span className="text-xs leading-none">{meta.icon}</span>
                            {meta.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 max-w-[200px] truncate text-[12px] text-[#555]">
                          {data?.title ?? data?.name ?? (data?.targetUsername ? `→ @${data.targetUsername}` : "—")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {logsTotalPages > 1 && (
                <div className="flex items-center justify-between border-t border-[#1a1e2e] px-4 py-3">
                  <span className="text-xs text-[#444]">Sayfa {logsPage} / {logsTotalPages}</span>
                  <div className="flex gap-2">
                    {[{ label: "← Önceki", fn: () => setLogsPage((p) => Math.max(1, p - 1)), disabled: logsPage === 1 },
                      { label: "Sonraki →", fn: () => setLogsPage((p) => Math.min(logsTotalPages, p + 1)), disabled: logsPage === logsTotalPages }
                    ].map((btn) => (
                      <button key={btn.label} onClick={btn.fn} disabled={btn.disabled}
                        className="rounded-lg border border-[#1a1e2e] px-3 py-1.5 text-xs text-[#555] transition-colors hover:border-[#c9a84c]/30 hover:text-[#f0ede8] disabled:cursor-not-allowed disabled:opacity-25">
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Delete confirm modal ── */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-[#252d40] bg-[#0d0f1a] p-6 shadow-2xl">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-[#e53e3e]/20 bg-[#e53e3e]/10">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e53e3e" strokeWidth="2" strokeLinecap="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </div>
            <h3 className="mb-1 text-base font-bold text-[#f0ede8]">Kullanıcıyı Sil</h3>
            <p className="mb-1 text-sm text-[#888]"><span className="font-semibold text-[#f0ede8]">{confirmDelete.name}</span> silinecek.</p>
            <p className="mb-5 text-xs text-[#444]">Bu işlem geri alınamaz. Tüm notları ve kategorileri de silinir.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmDelete(null)} className="rounded-lg px-4 py-2 text-sm text-[#555] transition-colors hover:bg-[#1a1e2e] hover:text-[#f0ede8]">İptal</button>
              <button onClick={() => deleteUser(confirmDelete.id)} className="rounded-lg bg-[#e53e3e] px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-[#f05252] active:scale-95">Evet, Sil</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
