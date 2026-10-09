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
import {
  SquaresFourIcon,
  UsersIcon,
  FileTextIcon,
  PulseIcon,
  GearSixIcon,
  UserPlusIcon,
  WrenchIcon,
  StarIcon,
  MagnifyingGlassIcon,
  PencilSimpleIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import { PageHeader, Em, Dot } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { getClientErrorMessage, requestJson } from "@/lib/client-api";

import type {
  StatsData,
  UserRow,
  ActivityLog,
  PostRow,
  SiteSettings,
  AdminFeedback,
  RangeKey,
  SeriesKey,
} from "./admin-types";
import { STATUS_COLORS, PIE_COLORS, ACTION_META, RANGE_LABELS, SERIES_LABELS } from "./admin-types";
import {
  fmtShortDate,
  fmtTime,
  KpiCard,
  KpiStrip,
  AXIS_TICK,
  Card,
  ActionFeedbackBanner,
  DarkTooltip,
  Spinner,
  RangePills,
  Pagination,
  ConfirmModal,
} from "./admin-components";

/* ═══════════════════════════════════════════════
   Tab config
   ═══════════════════════════════════════════════ */

const TABS = [
  { key: "overview" as const, label: "Genel Bakış", icon: <SquaresFourIcon size={14} /> },
  { key: "users" as const, label: "Kullanıcılar", icon: <UsersIcon size={14} /> },
  { key: "content" as const, label: "İçerikler", icon: <FileTextIcon size={14} /> },
  { key: "activity" as const, label: "Aktivite", icon: <PulseIcon size={14} /> },
  { key: "settings" as const, label: "Ayarlar", icon: <GearSixIcon size={14} /> },
] as const;

/* ═══════════════════════════════════════════════
   Main page
   ═══════════════════════════════════════════════ */

export default function AdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"overview" | "users" | "content" | "activity" | "settings">(
    "overview"
  );
  const [adminFeedback, setAdminFeedback] = useState<AdminFeedback | null>(null);

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
  const [panelError, setPanelError] = useState("");

  /* ── fetch stats ── */
  const fetchStats = useCallback(async (series: SeriesKey) => {
    setLoadingStats(true);
    try {
      const data = await requestJson<StatsData>(
        `/api/admin/stats?series=${series}`,
        undefined,
        "İstatistikler yüklenemedi."
      );
      setStats(data);
      setPanelError("");
    } catch (error) {
      setPanelError(getClientErrorMessage(error, "İstatistikler yüklenemedi."));
    } finally {
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    fetchStats(seriesRange);
  }, [seriesRange, fetchStats]);

  /* ── fetch users ── */
  const fetchUsers = useCallback(async (page: number, search: string) => {
    setLoadingUsers(true);
    const p = new URLSearchParams({ page: String(page) });
    if (search) p.set("search", search);
    try {
      const data = await requestJson<{ users?: UserRow[]; total?: number; totalPages?: number }>(
        `/api/admin/users?${p}`,
        undefined,
        "Kullanıcılar yüklenemedi."
      );
      setUsers(data.users ?? []);
      setUsersTotal(data.total ?? 0);
      setUsersTotalPages(data.totalPages ?? 1);
      setPanelError("");
    } catch (error) {
      setPanelError(getClientErrorMessage(error, "Kullanıcılar yüklenemedi."));
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "users") fetchUsers(usersPage, userSearch);
  }, [tab, usersPage, userSearch, fetchUsers]);

  /* ── fetch posts ── */
  const fetchPosts = useCallback(async (page: number, q: string) => {
    setLoadingPosts(true);
    const p = new URLSearchParams({ page: String(page) });
    if (q) p.set("q", q);
    try {
      const data = await requestJson<{ posts?: PostRow[]; total?: number; totalPages?: number }>(
        `/api/admin/posts?${p}`,
        undefined,
        "İçerikler yüklenemedi."
      );
      setPosts(data.posts ?? []);
      setPostsTotal(data.total ?? 0);
      setPostsTotalPages(data.totalPages ?? 1);
      setPanelError("");
    } catch (error) {
      setPanelError(getClientErrorMessage(error, "İçerikler yüklenemedi."));
    } finally {
      setLoadingPosts(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "content") fetchPosts(postsPage, postSearch);
  }, [tab, postsPage, postSearch, fetchPosts]);

  /* ── fetch activity ── */
  const fetchActivity = useCallback(async (page: number, filter: string, range: RangeKey) => {
    setLoadingLogs(true);
    const p = new URLSearchParams({ page: String(page), range });
    if (filter) p.set("action", filter);
    try {
      const data = await requestJson<{
        logs?: ActivityLog[];
        total?: number;
        totalPages?: number;
        chartData?: { label: string; count: number }[];
      }>(`/api/admin/activity?${p}`, undefined, "Aktivite verisi yüklenemedi.");
      setLogs(data.logs ?? []);
      setLogsTotal(data.total ?? 0);
      setLogsTotalPages(data.totalPages ?? 1);
      setChartData(data.chartData ?? []);
      setPanelError("");
    } catch (error) {
      setPanelError(getClientErrorMessage(error, "Aktivite verisi yüklenemedi."));
    } finally {
      setLoadingLogs(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "activity") fetchActivity(logsPage, logsFilter, activityRange);
  }, [tab, logsPage, logsFilter, activityRange, fetchActivity]);

  /* ── fetch settings ── */
  const fetchSettings = useCallback(async () => {
    setLoadingSettings(true);
    try {
      const data = await requestJson<SiteSettings>(
        "/api/admin/settings",
        undefined,
        "Ayarlar yüklenemedi."
      );
      setSettings(data);
      setPanelError("");
    } catch (error) {
      setPanelError(getClientErrorMessage(error, "Ayarlar yüklenemedi."));
    } finally {
      setLoadingSettings(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "settings") fetchSettings();
  }, [tab, fetchSettings]);

  useEffect(() => {
    setAdminFeedback(null);
  }, [tab]);

  /* ── toggle admin ── */
  async function toggleAdmin(user: UserRow) {
    try {
      const updated = await requestJson<UserRow>(
        `/api/admin/users/${user.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isAdmin: !user.isAdmin }),
        },
        "Rol güncellenemedi."
      );
      toast.success(
        updated.isAdmin ? `${updated.name} artık admin` : `${updated.name} admin değil`
      );
      setAdminFeedback({
        tone: "success",
        title: updated.isAdmin ? "Admin yetkisi verildi" : "Admin yetkisi kaldırıldı",
        detail: updated.isAdmin
          ? `${updated.name} artık admin ekranlarına erişebilir.`
          : `${updated.name} artık admin işlemleri yapamaz.`,
        followUp: "Gerekirse kullanıcı detayına gidip son aktivitelerini kontrol et.",
      });
      await fetchUsers(usersPage, userSearch);
    } catch (error) {
      const message = getClientErrorMessage(error, "Rol güncellenemedi.");
      toast.error(message);
      setAdminFeedback({
        tone: "error",
        title: "Rol güncellenemedi",
        detail: message,
        followUp: "Değişiklik uygulanmadı; kullanıcı satırını yenileyip tekrar dene.",
      });
    }
  }

  /* ── toggle ban ── */
  async function toggleBan(user: UserRow) {
    try {
      const updated = await requestJson<UserRow>(
        `/api/admin/users/${user.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isBanned: !user.isBanned }),
        },
        "Kullanıcı durumu güncellenemedi."
      );
      toast.success(
        updated.isBanned ? `${updated.name} banlandı` : `${updated.name} banlı durumdan çıkarıldı`
      );
      setAdminFeedback({
        tone: updated.isBanned ? "warning" : "success",
        title: updated.isBanned ? "Kullanıcı banlandı" : "Ban kaldırıldı",
        detail: updated.isBanned
          ? `${updated.name} artık giriş yapamaz ve hesabı kısıtlandı.`
          : `${updated.name} yeniden normal erişime döndü.`,
        followUp: updated.isBanned
          ? "Gerekirse ilgili notları içerik sekmesinden ayrıca gözden geçir."
          : "Kullanıcının profil görünürlüğünü ve son hareketlerini doğrula.",
      });
      await fetchUsers(usersPage, userSearch);
    } catch (error) {
      const message = getClientErrorMessage(error, "Kullanıcı durumu güncellenemedi.");
      toast.error(message);
      setAdminFeedback({
        tone: "error",
        title: "Kullanıcı durumu güncellenemedi",
        detail: message,
        followUp: "İşlem uygulanmadı; kullanıcı hâlâ önceki durumda.",
      });
    }
  }

  /* ── toggle public/private ── */
  async function togglePublic(user: UserRow) {
    try {
      const updated = await requestJson<UserRow>(
        `/api/admin/users/${user.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isPublic: !user.isPublic }),
        },
        "Profil görünürlüğü güncellenemedi."
      );
      toast.success(
        updated.isPublic
          ? `${updated.name} profili artık herkese açık`
          : `${updated.name} profili artık gizli`
      );
      setAdminFeedback({
        tone: "success",
        title: updated.isPublic ? "Profil herkese açık" : "Profil gizlendi",
        detail: updated.isPublic
          ? `${updated.name} profili artık tüm ziyaretçilere görünür.`
          : `${updated.name} profili yalnızca kendisi ve adminler tarafından görüntülenebilir.`,
        followUp: "Değişiklik anında uygulanır; gerekirse profil sayfasını yenile.",
      });
      await fetchUsers(usersPage, userSearch);
    } catch (error) {
      const message = getClientErrorMessage(error, "Profil görünürlüğü güncellenemedi.");
      toast.error(message);
      setAdminFeedback({
        tone: "error",
        title: "Profil görünürlüğü güncellenemedi",
        detail: message,
        followUp: "Değişiklik uygulanmadı; tekrar dene.",
      });
    }
  }

  /* ── delete user ── */
  async function deleteUser(id: string) {
    try {
      await requestJson(`/api/admin/users/${id}`, { method: "DELETE" }, "Kullanıcı silinemedi.");
      setConfirmDelete(null);
      toast.success("Kullanıcı silindi");
      setAdminFeedback({
        tone: "warning",
        title: "Kullanıcı silindi",
        detail: "Hesap ve ilişkili içerikleri kalıcı olarak kaldırıldı.",
        followUp: "Arama sonucundan düştüğünü ve gerekirse aktivite geçmişini gözden geçir.",
      });
      await fetchUsers(usersPage, userSearch);
    } catch (error) {
      const message = getClientErrorMessage(error, "Kullanıcı silinemedi.");
      toast.error(message);
      setAdminFeedback({
        tone: "error",
        title: "Kullanıcı silinemedi",
        detail: message,
        followUp:
          "Kullanıcı kaydı yerinde kaldı; tekrar denemeden önce detay sayfasını kontrol et.",
      });
    }
  }

  /* ── delete post ── */
  async function deletePost(postId: string) {
    try {
      await requestJson(
        "/api/admin/posts",
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postId }),
        },
        "Not silinemedi."
      );
      setConfirmDeletePost(null);
      toast.success("Not silindi");
      setAdminFeedback({
        tone: "warning",
        title: "Not kaldırıldı",
        detail: "İçerik yayından alındı ve admin log'una işlendi.",
        followUp: "Gerekirse not sahibini kullanıcı sekmesinden ayrıca incele.",
      });
      await fetchPosts(postsPage, postSearch);
    } catch (error) {
      const message = getClientErrorMessage(error, "Not silinemedi.");
      toast.error(message);
      setAdminFeedback({
        tone: "error",
        title: "Not silinemedi",
        detail: message,
        followUp: "İçerik listede kalır; moderasyon kararını yeniden doğrula.",
      });
    }
  }

  /* ── bulk user actions ── */
  async function runBulkAction(action: "ban" | "unban" | "delete") {
    if (selectedUsers.size === 0) return;
    setBulkLoading(true);
    try {
      const res = await requestJson<{ success: boolean; affected: number }>(
        "/api/admin/users/bulk",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, userIds: Array.from(selectedUsers) }),
        },
        "Toplu işlem uygulanamadı."
      );
      setSelectedUsers(new Set());
      if (res.success) {
        const labels: Record<string, string> = {
          ban: "Banlandı",
          unban: "Ban kaldırıldı",
          delete: "Silindi",
        };
        toast.success(`${res.affected} kullanıcı — ${labels[action]}`);
        setAdminFeedback({
          tone: action === "delete" ? "warning" : "success",
          title: `Toplu işlem tamamlandı: ${labels[action]}`,
          detail: `${res.affected} kullanıcı üzerinde ${labels[action].toLowerCase()} işlemi uygulandı.`,
          followUp:
            action === "delete"
              ? "Arama ve toplam sayının beklendiği gibi güncellendiğini doğrula."
              : "Seçili kullanıcıları tekrar filtreleyip kalan istisnaları kontrol et.",
        });
      }
      await fetchUsers(1, userSearch);
      setUsersPage(1);
    } catch (error) {
      const message = getClientErrorMessage(error, "Toplu işlem uygulanamadı.");
      toast.error(message);
      setAdminFeedback({
        tone: "error",
        title: "Toplu işlem başarısız",
        detail: message,
        followUp: "Seçimi koruyup tekrar deneyebilir veya kullanıcıları tek tek yönetebilirsin.",
      });
    } finally {
      setBulkLoading(false);
    }
  }

  /* ── save settings ── */
  async function saveSettings(patch: Partial<SiteSettings>) {
    setSavingSettings(true);
    try {
      const data = await requestJson<SiteSettings>(
        "/api/admin/settings",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        },
        "Ayarlar kaydedilemedi."
      );
      setSettings(data);
      toast.success("Ayarlar kaydedildi");
      const updatedKeys = Object.keys(patch);
      const primaryKey = updatedKeys[0];
      const followUp =
        primaryKey === "maintenanceMode"
          ? data.maintenanceMode === "true"
            ? "Admin olmayan bir oturumda bakım ekranını kontrol et."
            : "Normal kullanıcı akışının yeniden açıldığını doğrula."
          : primaryKey === "registrationEnabled"
            ? data.registrationEnabled === "true"
              ? "Kayıt ekranında yeni kullanıcı akışını test et."
              : "Kayıt formunun erişimi kapattığını doğrula."
            : "Bakım mesajı metninin bakım sayfasında beklendiği gibi göründüğünü kontrol et.";
      setAdminFeedback({
        tone:
          primaryKey === "maintenanceMode" && data.maintenanceMode === "true"
            ? "warning"
            : "success",
        title: "Ayar kaydedildi",
        detail:
          primaryKey === "maintenanceMode"
            ? data.maintenanceMode === "true"
              ? "Bakım modu etkinleştirildi."
              : "Bakım modu kapatıldı."
            : primaryKey === "registrationEnabled"
              ? data.registrationEnabled === "true"
                ? "Yeni kullanıcı kaydı tekrar açıldı."
                : "Yeni kullanıcı kaydı kapatıldı."
              : "Bakım mesajı güncellendi.",
        followUp,
      });
    } catch (error) {
      const message = getClientErrorMessage(error, "Ayarlar kaydedilemedi.");
      toast.error(message);
      setAdminFeedback({
        tone: "error",
        title: "Ayar kaydedilemedi",
        detail: message,
        followUp: "Form alanı eski duruma dönmüş olabilir; tekrar yükleyip doğrula.",
      });
    } finally {
      setSavingSettings(false);
    }
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

  /* LAYOUT: Editorial admin desk (max-w-6xl, inside AppShell).
     ROW 1: shared PageHeader (16 · Yönetim) — "Admin Paneli." with serif accent.
     ROW 2: pill segmented tab control (scrolls horizontally on phones).
     ROW 3: error / feedback banners, then the active tab:
       - overview: hairline KPI strip (serif italic numbers + mono labels), trend range pills,
         lavender/apricot charts in rounded-[24px] hairline cards, ranked users, tag cloud
       - users / content / activity: mono toolbar + rounded-[24px] table (cards on mobile)
       - settings: two hairline setting cards with token-coloured switches
  */
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 pb-20 pt-8 sm:px-6 sm:pt-10">
      <PageHeader
        index="16"
        eyebrow="Yönetim"
        title={
          <>
            Admin <Em>Paneli</Em>
            <Dot />
          </>
        }
        description="Kullanıcıları, içerikleri ve site ayarlarını tek bir masadan izle ve yönet."
      />

      {/* ═══ Tab navigation — pill segmented control ═══ */}
      <div className="-mx-4 mb-8 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <nav
          aria-label="Admin sekmeleri"
          className="inline-flex rounded-full border border-[var(--border)] bg-[var(--bg-card)] p-1"
        >
          {TABS.map((t, i) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              aria-current={tab === t.key ? "page" : undefined}
              className={`flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-[12.5px] font-semibold transition-colors duration-300 ease-out-expo active:scale-95 ${
                tab === t.key
                  ? "bg-accent text-[var(--text-on-accent)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              <span className="dn-mono text-[10px] opacity-60">
                {String(i + 1).padStart(2, "0")}
              </span>
              {t.icon}
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {panelError && (
        <div className="mb-6 flex items-center gap-2.5 rounded-[20px] border border-danger/30 bg-danger/5 px-5 py-3.5 text-sm text-danger">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-danger" />
          {panelError}
        </div>
      )}

      {adminFeedback && (
        <div className="mb-6">
          <ActionFeedbackBanner feedback={adminFeedback} />
        </div>
      )}

      {/* ══════════════ OVERVIEW ══════════════ */}
      {tab === "overview" && (
        <div className="space-y-6">
          {loadingStats ? (
            <Spinner />
          ) : stats ? (
            <>
              <KpiStrip>
                <KpiCard index="01" value={stats.kpi.totalUsers} label="Kullanıcı" />
                <KpiCard index="02" value={stats.kpi.totalPosts} label="Not" />
                <KpiCard index="03" value={stats.kpi.totalCategories} label="Kategori" />
                <KpiCard index="04" value={stats.kpi.totalTags} label="Etiket" />
                <KpiCard index="05" value={stats.kpi.totalFollows} label="Takip" />
                <KpiCard index="06" value={stats.kpi.todayActivity} label="Bugün" />
              </KpiStrip>

              {/* Series range */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="dn-mono text-[10.5px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                  Trend Periyodu ·{" "}
                  <span className="text-[var(--text-primary)]">{SERIES_LABELS[seriesRange]}</span>
                </p>
                <RangePills
                  value={seriesRange}
                  options={SERIES_LABELS}
                  onChange={(v) => setSeriesRange(v)}
                />
              </div>

              {/* Charts row 1 */}
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <Card index="A" title={`Not Aktivitesi — Son ${SERIES_LABELS[seriesRange]}`}>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart
                      data={stats.dailySeries}
                      margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="adminG1" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--gold)" stopOpacity={0.28} />
                          <stop offset="100%" stopColor="var(--gold)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="2 4"
                        stroke="var(--border)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="date"
                        tickFormatter={fmtShortDate}
                        tick={AXIS_TICK}
                        interval={Math.max(Math.floor(stats.dailySeries.length / 5) - 1, 0)}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={AXIS_TICK}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip content={<DarkTooltip />} cursor={{ stroke: "var(--border)" }} />
                      <Area
                        type="monotone"
                        dataKey="posts"
                        name="Not"
                        stroke="var(--gold)"
                        strokeWidth={1.75}
                        fill="url(#adminG1)"
                        dot={false}
                        activeDot={{ r: 4, fill: "var(--gold)", strokeWidth: 0 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Card>

                <Card index="B" title={`Yeni Kullanıcı — Son ${SERIES_LABELS[seriesRange]}`}>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart
                      data={stats.dailySeries}
                      margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="adminG2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--accent-2)" stopOpacity={0.28} />
                          <stop offset="100%" stopColor="var(--accent-2)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="2 4"
                        stroke="var(--border)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="date"
                        tickFormatter={fmtShortDate}
                        tick={AXIS_TICK}
                        interval={Math.max(Math.floor(stats.dailySeries.length / 5) - 1, 0)}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={AXIS_TICK}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip content={<DarkTooltip />} cursor={{ stroke: "var(--border)" }} />
                      <Area
                        type="monotone"
                        dataKey="users"
                        name="Kullanıcı"
                        stroke="var(--accent-2)"
                        strokeWidth={1.75}
                        fill="url(#adminG2)"
                        dot={false}
                        activeDot={{ r: 4, fill: "var(--accent-2)", strokeWidth: 0 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Card>
              </div>

              {/* Charts row 2 */}
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
                <div className="lg:col-span-2">
                  <Card index="C" title="Durum Dağılımı">
                    <div className="flex items-center gap-4">
                      <ResponsiveContainer width={140} height={140}>
                        <PieChart>
                          <Pie
                            data={stats.postStatusDistribution}
                            dataKey="count"
                            nameKey="status"
                            cx="50%"
                            cy="50%"
                            innerRadius={44}
                            outerRadius={64}
                            strokeWidth={0}
                            paddingAngle={2}
                          >
                            {stats.postStatusDistribution.map((e, i) => (
                              <Cell
                                key={e.status}
                                fill={STATUS_COLORS[e.status] ?? PIE_COLORS[i % PIE_COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              background: "var(--bg-card)",
                              border: "1px solid var(--border)",
                              borderRadius: 16,
                              fontSize: 12,
                              boxShadow: "var(--shadow-soft)",
                            }}
                            itemStyle={{ color: "var(--text-primary)" }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex flex-1 flex-col divide-y divide-[var(--border)]">
                        {stats.postStatusDistribution.map((s, i) => {
                          const color =
                            STATUS_COLORS[s.status] ?? PIE_COLORS[i % PIE_COLORS.length];
                          const total = stats.postStatusDistribution.reduce(
                            (a, b) => a + b.count,
                            0
                          );
                          return (
                            <div key={s.status} className="flex items-center gap-2 py-1.5">
                              <span
                                className="h-2 w-2 flex-shrink-0 rounded-full"
                                style={{ background: color }}
                              />
                              <span className="flex-1 truncate text-[12px] text-[var(--text-secondary)]">
                                {s.status}
                              </span>
                              <span className="text-[12px] font-semibold tabular-nums text-[var(--text-primary)]">
                                {s.count}
                              </span>
                              <span className="dn-mono w-9 text-right text-[10px] tabular-nums text-[var(--text-muted)]">
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
                  <Card index="D" title="Kategorilere Göre Not (İlk 10)">
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart
                        data={stats.postsPerCategory}
                        layout="vertical"
                        margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="2 4"
                          stroke="var(--border)"
                          horizontal={false}
                        />
                        <XAxis
                          type="number"
                          tick={AXIS_TICK}
                          axisLine={false}
                          tickLine={false}
                          allowDecimals={false}
                        />
                        <YAxis
                          type="category"
                          dataKey="category"
                          tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
                          width={68}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip content={<DarkTooltip />} cursor={{ fill: "var(--bg-raised)" }} />
                        <Bar
                          dataKey="count"
                          name="Not"
                          fill="var(--gold)"
                          radius={[0, 999, 999, 0]}
                          barSize={10}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>
                </div>
              </div>

              {/* Top users + Rating */}
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <Card index="E" title="En Aktif Kullanıcılar">
                  <div className="divide-y divide-[var(--border)]">
                    {stats.topUsers.map((u, i) => {
                      const maxPosts = stats.topUsers[0]?.postCount ?? 1;
                      const pct = maxPosts > 0 ? (u.postCount / maxPosts) * 100 : 0;
                      return (
                        <button
                          key={u.id}
                          type="button"
                          className="group flex w-full cursor-pointer items-center gap-3 py-2.5 text-left transition-colors duration-200"
                          onClick={() => router.push(`/admin/users/${u.id}`)}
                        >
                          <span
                            className={`dn-display w-6 shrink-0 text-center text-xl italic leading-none ${
                              i === 0 ? "text-[var(--gold)]" : "text-[var(--text-muted)]"
                            }`}
                          >
                            {i + 1}
                          </span>
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-raised)] text-[11px] font-semibold text-[var(--text-secondary)]">
                            {u.name.charAt(0).toUpperCase()}
                          </span>
                          <span className="w-24 shrink-0 truncate text-[13px] text-[var(--text-secondary)] transition-colors duration-200 group-hover:text-[var(--text-primary)]">
                            {u.name}
                          </span>
                          <span className="relative h-1 flex-1 overflow-hidden rounded-full bg-[var(--bg-raised)]">
                            <span
                              className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out-expo ${
                                i === 0 ? "bg-accent" : "bg-accent/45"
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </span>
                          <span className="w-7 shrink-0 text-right text-[13px] font-semibold tabular-nums text-[var(--text-primary)]">
                            {u.postCount}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </Card>

                <Card index="F" title="Puan Dağılımı">
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart
                      data={stats.ratingDistribution}
                      margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="2 4"
                        stroke="var(--border)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="label"
                        tick={{ ...AXIS_TICK, fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={AXIS_TICK}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip content={<DarkTooltip />} cursor={{ fill: "var(--bg-raised)" }} />
                      <Bar
                        dataKey="count"
                        name="Not"
                        fill="var(--gold)"
                        radius={[999, 999, 0, 0]}
                        barSize={18}
                      >
                        {stats.ratingDistribution.map((_, i) => (
                          <Cell
                            key={i}
                            fill={
                              i === stats.ratingDistribution.length - 1
                                ? "var(--accent-2)"
                                : "var(--gold)"
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </div>

              {/* Tag cloud */}
              <Card index="G" title="Popüler Etiketler">
                <div className="flex flex-wrap gap-2">
                  {stats.topTags.map((tag) => {
                    const max = stats.topTags[0]?.count ?? 1;
                    const t = tag.count / max;
                    const tone =
                      t > 0.75
                        ? "border-accent/40 bg-accent/10 text-accent"
                        : t > 0.4
                          ? "border-accent/20 text-[var(--text-primary)]"
                          : "border-[var(--border)] text-[var(--text-secondary)]";
                    return (
                      <span
                        key={tag.name}
                        className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors duration-200 ${tone}`}
                      >
                        #{tag.name}
                        <span className="dn-mono ml-1.5 text-[10px] tabular-nums opacity-60">
                          {tag.count}
                        </span>
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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative min-w-0 flex-1 sm:max-w-sm">
              <MagnifyingGlassIcon
                size={14}
                weight="bold"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
              />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => {
                  setUserSearch(e.target.value);
                  setUsersPage(1);
                }}
                placeholder="İsim, e-posta veya kullanıcı adı..."
                className={SEARCH_INPUT}
              />
            </div>
            <p className="dn-mono flex items-baseline gap-2 text-[10.5px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
              <span className="dn-display text-2xl normal-case italic tabular-nums tracking-normal text-[var(--text-primary)]">
                {usersTotal}
              </span>
              Kullanıcı
            </p>
          </div>

          {/* Bulk action bar */}
          {selectedUsers.size > 0 && (
            <div className="flex flex-wrap items-center gap-3 rounded-[22px] border border-accent/25 bg-accent/5 px-4 py-2.5 sm:rounded-full sm:pl-5">
              <span className="dn-mono text-[10.5px] uppercase tracking-[0.16em] text-[var(--gold)]">
                {selectedUsers.size} Seçildi
              </span>
              <div className="flex flex-wrap gap-2 sm:ml-auto">
                <button
                  type="button"
                  onClick={() => runBulkAction("ban")}
                  disabled={bulkLoading}
                  className="cursor-pointer rounded-full border border-accent-2/30 px-3.5 py-1.5 text-[12px] font-semibold text-accent-2 transition-colors duration-200 hover:bg-accent-2/10 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Banla
                </button>
                <button
                  type="button"
                  onClick={() => runBulkAction("unban")}
                  disabled={bulkLoading}
                  className="cursor-pointer rounded-full border border-accent/30 px-3.5 py-1.5 text-[12px] font-semibold text-accent transition-colors duration-200 hover:bg-accent/10 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Ban Kaldır
                </button>
                <button
                  type="button"
                  onClick={() => runBulkAction("delete")}
                  disabled={bulkLoading}
                  className="cursor-pointer rounded-full border border-danger/30 px-3.5 py-1.5 text-[12px] font-semibold text-danger transition-colors duration-200 hover:bg-danger/10 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Sil
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedUsers(new Set())}
                  className="cursor-pointer rounded-full px-3.5 py-1.5 text-[12px] text-[var(--text-muted)] transition-colors duration-200 hover:text-[var(--text-primary)]"
                >
                  İptal
                </button>
              </div>
            </div>
          )}

          <div className="overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--bg-card)]">
            {/* Mobile card list */}
            <div className="md:hidden">
              <label className="flex cursor-pointer items-center gap-3 border-b border-[var(--border)] px-4 py-3">
                <input
                  type="checkbox"
                  className="accent-accent"
                  checked={users.length > 0 && selectedUsers.size === users.length}
                  onChange={toggleSelectAll}
                />
                <span className="dn-mono text-[10.5px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                  Tümünü Seç
                </span>
              </label>
              {loadingUsers ? (
                <TableSpinner />
              ) : (
                <div className="divide-y divide-[var(--border)]">
                  {users.map((u) => (
                    <div
                      key={u.id}
                      className={`flex items-start gap-3 p-4 transition-colors duration-200 hover:bg-[var(--bg-raised)] ${u.isBanned ? "opacity-60" : ""}`}
                    >
                      <input
                        type="checkbox"
                        className="mt-2.5 accent-accent"
                        checked={selectedUsers.has(u.id)}
                        onChange={() => toggleSelectUser(u.id)}
                      />
                      <div
                        className="cursor-pointer"
                        onClick={() => router.push(`/admin/users/${u.id}`)}
                      >
                        <Avatar name={u.name} size="md" />
                      </div>
                      <div
                        className="min-w-0 flex-1 cursor-pointer"
                        onClick={() => router.push(`/admin/users/${u.id}`)}
                      >
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="font-medium text-[var(--text-primary)]">{u.name}</p>
                          <UserBadges user={u} />
                        </div>
                        {u.username && (
                          <p className="dn-mono text-[11px] text-[var(--text-muted)]">
                            @{u.username}
                          </p>
                        )}
                        <p className="mt-0.5 truncate text-[12px] text-[var(--text-muted)]">
                          {u.email}
                        </p>
                        <div className="dn-mono mt-1.5 flex flex-wrap items-center gap-3 text-[10.5px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                          <span>
                            <span className="tabular-nums text-[var(--text-primary)]">
                              {u.postCount}
                            </span>{" "}
                            Not
                          </span>
                          <span>
                            <span className="tabular-nums text-[var(--text-primary)]">
                              {u.followerCount}
                            </span>{" "}
                            Takipçi
                          </span>
                          <span>
                            {new Date(u.createdAt).toLocaleDateString("tr-TR", {
                              day: "numeric",
                              month: "short",
                              year: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-3">
                        <div className="flex items-center gap-3">
                          <ToggleSwitch
                            label="Admin"
                            active={u.isAdmin}
                            tone="accent"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleAdmin(u);
                            }}
                          />
                          <ToggleSwitch
                            label="Açık"
                            active={u.isPublic}
                            tone="accent-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePublic(u);
                            }}
                          />
                          <ToggleSwitch
                            label="Ban"
                            active={u.isBanned}
                            tone="danger"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleBan(u);
                            }}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDelete(u);
                          }}
                          className="cursor-pointer rounded-full border border-danger/25 px-3 py-1 text-[11px] font-medium text-danger transition-colors duration-200 hover:bg-danger/10 active:scale-95"
                        >
                          Sil
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="px-4 py-3.5">
                      <input
                        type="checkbox"
                        className="accent-accent"
                        aria-label="Tümünü seç"
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
                      "Açık",
                      "Ban",
                      "İşlem",
                    ].map((h) => (
                      <th key={h} className={TH}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {loadingUsers ? (
                    <tr>
                      <td colSpan={10}>
                        <TableSpinner />
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr
                        key={u.id}
                        className={`group transition-colors duration-200 hover:bg-[var(--bg-raised)] ${u.isBanned ? "opacity-60" : ""}`}
                      >
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            className="accent-accent"
                            aria-label={`${u.name} seç`}
                            checked={selectedUsers.has(u.id)}
                            onChange={() => toggleSelectUser(u.id)}
                          />
                        </td>
                        <td
                          className="cursor-pointer px-4 py-3"
                          onClick={() => router.push(`/admin/users/${u.id}`)}
                        >
                          <div className="flex items-center gap-2.5">
                            <Avatar name={u.name} size="sm" />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="truncate font-medium text-[var(--text-primary)] transition-colors duration-200 group-hover:text-[var(--gold)]">
                                  {u.name}
                                </p>
                                <UserBadges user={u} compact />
                              </div>
                              {u.username && (
                                <p className="dn-mono text-[10.5px] text-[var(--text-muted)]">
                                  @{u.username}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-[var(--text-muted)]">{u.email}</td>
                        <td className="px-4 py-3 text-center text-sm font-semibold tabular-nums text-[var(--text-primary)]">
                          {u.postCount}
                        </td>
                        <td className="px-4 py-3 text-center text-sm tabular-nums text-[var(--text-muted)]">
                          {u.followerCount}
                        </td>
                        <td className="dn-mono whitespace-nowrap px-4 py-3 text-center text-[10.5px] uppercase tracking-[0.08em] text-[var(--text-muted)]">
                          {new Date(u.createdAt).toLocaleDateString("tr-TR", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Switch
                            active={u.isAdmin}
                            tone="accent"
                            title={u.isAdmin ? "Admin Yetkisini Kaldır" : "Admin Yap"}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleAdmin(u);
                            }}
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Switch
                            active={u.isPublic}
                            tone="accent-2"
                            title={u.isPublic ? "Profili Gizle" : "Profili Herkese Aç"}
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePublic(u);
                            }}
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Switch
                            active={u.isBanned}
                            tone="danger"
                            title={u.isBanned ? "Banı Kaldır" : "Banla"}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleBan(u);
                            }}
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDelete(u);
                            }}
                            className="cursor-pointer rounded-full px-3 py-1 text-[11px] font-medium text-[var(--text-muted)] transition-colors duration-200 hover:bg-danger/10 hover:text-danger active:scale-95"
                          >
                            Sil
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              page={usersPage}
              totalPages={usersTotalPages}
              onPrev={() => setUsersPage((p) => Math.max(1, p - 1))}
              onNext={() => setUsersPage((p) => Math.min(usersTotalPages, p + 1))}
            />
          </div>
        </div>
      )}

      {/* ══════════════ CONTENT ══════════════ */}
      {tab === "content" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative min-w-0 flex-1 sm:max-w-sm">
              <MagnifyingGlassIcon
                size={14}
                weight="bold"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
              />
              <input
                type="text"
                value={postSearch}
                onChange={(e) => {
                  setPostSearch(e.target.value);
                  setPostsPage(1);
                }}
                placeholder="Not başlığı, yazar veya kategori..."
                className={SEARCH_INPUT}
              />
            </div>
            <p className="dn-mono flex items-baseline gap-2 text-[10.5px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
              <span className="dn-display text-2xl normal-case italic tabular-nums tracking-normal text-[var(--text-primary)]">
                {postsTotal}
              </span>
              Not
            </p>
          </div>

          <div className="overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--bg-card)]">
            {/* Mobile */}
            <div className="md:hidden">
              {loadingPosts ? (
                <TableSpinner />
              ) : posts.length === 0 ? (
                <div className="p-4">
                  <EmptyState
                    compact
                    icon={<FileTextIcon size={20} />}
                    title="Not Bulunamadı"
                    description="Aramayı değiştirip tekrar dene."
                  />
                </div>
              ) : (
                <div className="divide-y divide-[var(--border)]">
                  {posts.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-start gap-3 p-4 transition-colors duration-200 hover:bg-[var(--bg-raised)]"
                    >
                      <div className="min-w-0 flex-1">
                        <p
                          className="mb-1.5 cursor-pointer font-medium text-[var(--text-primary)] transition-colors duration-200 hover:text-[var(--gold)]"
                          onClick={() => router.push(`/posts/${p.id}`)}
                        >
                          {p.title}
                        </p>
                        <div className="dn-mono mb-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10.5px] uppercase tracking-[0.1em] text-[var(--text-muted)]">
                          <span>{p.category}</span>
                          {p.user && (
                            <span className="normal-case tracking-normal">{p.user.name}</span>
                          )}
                          <span>{fmtShortDate(p.createdAt)}</span>
                          {p.rating > 0 && (
                            <span className="inline-flex items-center gap-1 text-[var(--gold)]">
                              <StarIcon size={10} weight="fill" />
                              {p.rating.toFixed(1)}
                            </span>
                          )}
                        </div>
                        <StatusBadge status={p.status} />
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <button
                          type="button"
                          onClick={() => router.push(`/posts/${p.id}/edit`)}
                          className="cursor-pointer rounded-full border border-[var(--border)] px-3 py-1.5 text-[11px] font-medium text-[var(--text-secondary)] transition-colors duration-200 hover:border-accent/40 hover:text-[var(--gold)] active:scale-95"
                        >
                          Düzenle
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeletePost(p)}
                          className="cursor-pointer rounded-full border border-danger/25 px-3 py-1.5 text-[11px] font-medium text-danger transition-colors duration-200 hover:bg-danger/10 active:scale-95"
                        >
                          Sil
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    {["Başlık", "Kategori", "Yazar", "Tarih", "Durum", "Puan", "İşlem"].map((h) => (
                      <th key={h} className={TH}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {loadingPosts ? (
                    <tr>
                      <td colSpan={7}>
                        <TableSpinner />
                      </td>
                    </tr>
                  ) : posts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-6">
                        <EmptyState
                          compact
                          icon={<FileTextIcon size={20} />}
                          title="Not Bulunamadı"
                          description="Aramayı değiştirip tekrar dene."
                        />
                      </td>
                    </tr>
                  ) : (
                    posts.map((p) => (
                      <tr
                        key={p.id}
                        className="group transition-colors duration-200 hover:bg-[var(--bg-raised)]"
                      >
                        <td
                          className="cursor-pointer px-4 py-3"
                          onClick={() => router.push(`/posts/${p.id}`)}
                        >
                          <p className="max-w-[200px] truncate font-medium text-[var(--text-primary)] transition-colors duration-200 group-hover:text-[var(--gold)]">
                            {p.title}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-xs text-[var(--text-muted)]">{p.category}</td>
                        <td className="px-4 py-3">
                          {p.user ? (
                            <div className="flex items-center gap-2">
                              <Avatar name={p.user.name} size="xs" />
                              <span className="text-[12px] text-[var(--text-secondary)]">
                                {p.user.name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-[var(--text-muted)]">—</span>
                          )}
                        </td>
                        <td className="dn-mono whitespace-nowrap px-4 py-3 text-[10.5px] uppercase tracking-[0.08em] text-[var(--text-muted)]">
                          {fmtShortDate(p.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={p.status} />
                        </td>
                        <td className="dn-display px-4 py-3 text-center text-lg italic tabular-nums text-[var(--text-primary)]">
                          {p.rating > 0 ? p.rating.toFixed(1) : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              aria-label="Notu düzenle"
                              onClick={() => router.push(`/posts/${p.id}/edit`)}
                              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-[var(--text-muted)] transition-colors duration-200 hover:bg-accent/10 hover:text-[var(--gold)] active:scale-95"
                            >
                              <PencilSimpleIcon size={14} weight="bold" />
                            </button>
                            <button
                              type="button"
                              aria-label="Notu sil"
                              onClick={() => setConfirmDeletePost(p)}
                              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-[var(--text-muted)] transition-colors duration-200 hover:bg-danger/10 hover:text-danger active:scale-95"
                            >
                              <TrashIcon size={14} weight="bold" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              page={postsPage}
              totalPages={postsTotalPages}
              onPrev={() => setPostsPage((p) => Math.max(1, p - 1))}
              onNext={() => setPostsPage((p) => Math.min(postsTotalPages, p + 1))}
            />
          </div>
        </div>
      )}

      {/* ══════════════ ACTIVITY ══════════════ */}
      {tab === "activity" && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="dn-mono text-[10.5px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
              Aktivite Periyodu ·{" "}
              <span className="text-[var(--text-primary)]">{RANGE_LABELS[activityRange]}</span>
            </p>
            <RangePills
              value={activityRange}
              options={RANGE_LABELS}
              onChange={(v) => {
                setActivityRange(v);
                setLogsPage(1);
              }}
            />
          </div>

          <Card index="A" title={`Aktivite — ${RANGE_LABELS[activityRange]}`}>
            {loadingLogs ? (
              <div className="flex h-32 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--border)] border-t-accent" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={chartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={AXIS_TICK}
                    interval={Math.max(Math.floor(chartData.length / 8) - 1, 0)}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<DarkTooltip />} cursor={{ fill: "var(--bg-raised)" }} />
                  <Bar dataKey="count" name="Aktivite" radius={[999, 999, 0, 0]}>
                    {chartData.map((d, i) => (
                      <Cell key={i} fill={d.count > 0 ? "var(--gold)" : "var(--border)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* Filter tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
              <div className="inline-flex rounded-full border border-[var(--border)] bg-[var(--bg-card)] p-1">
                <button
                  type="button"
                  onClick={() => {
                    setLogsFilter("");
                    setLogsPage(1);
                  }}
                  className={`${FILTER_PILL} ${!logsFilter ? FILTER_PILL_ON : FILTER_PILL_OFF}`}
                >
                  Tümü
                </button>
                {Object.entries(ACTION_META).map(([key, val]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setLogsFilter(key);
                      setLogsPage(1);
                    }}
                    className={`${FILTER_PILL} ${logsFilter === key ? FILTER_PILL_ON : FILTER_PILL_OFF}`}
                  >
                    {val.label}
                  </button>
                ))}
              </div>
            </div>
            <p className="dn-mono flex items-baseline gap-2 text-[10.5px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
              <span className="dn-display text-2xl normal-case italic tabular-nums tracking-normal text-[var(--text-primary)]">
                {logsTotal}
              </span>
              Kayıt
            </p>
          </div>

          {/* Log table */}
          <div className="overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--bg-card)]">
            {/* Mobile */}
            <div className="md:hidden">
              {loadingLogs ? (
                <TableSpinner />
              ) : logs.length === 0 ? (
                <div className="p-4">
                  <EmptyState
                    compact
                    icon={<PulseIcon size={20} />}
                    title="Henüz Aktivite Kaydı Yok"
                    description="Seçili periyotta kayıt düşmedi."
                  />
                </div>
              ) : (
                <div className="divide-y divide-[var(--border)]">
                  {logs.map((log) => {
                    const meta = ACTION_META[log.action] ?? {
                      label: log.action,
                      color: "var(--text-faint)",
                      icon: "·",
                    };
                    const data = log.metadata as Record<string, string> | null;
                    return (
                      <div key={log.id} className="flex items-start gap-3 p-4">
                        <span className="dn-mono mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--border)] text-xs text-[var(--text-muted)]">
                          {meta.icon}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                            <ActionTag meta={meta} />
                            <span className="dn-mono text-[10.5px] uppercase tracking-[0.08em] text-[var(--text-muted)]">
                              {fmtTime(log.createdAt)}
                            </span>
                          </div>
                          {log.user && (
                            <div className="flex items-center gap-1.5">
                              <Avatar name={log.user.name} size="xs" />
                              <span className="text-[12px] text-[var(--text-secondary)]">
                                {log.user.name}
                              </span>
                              {log.user.username && (
                                <span className="dn-mono text-[10.5px] text-[var(--text-muted)]">
                                  @{log.user.username}
                                </span>
                              )}
                            </div>
                          )}
                          {(data?.title ?? data?.name ?? data?.targetUsername) && (
                            <p className="mt-1 truncate text-[12px] text-[var(--text-muted)]">
                              {data?.title ??
                                data?.name ??
                                (data?.targetUsername ? `→ @${data.targetUsername}` : null)}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    {["Zaman", "Kullanıcı", "Aksiyon", "Detay"].map((h) => (
                      <th key={h} className={TH}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {loadingLogs ? (
                    <tr>
                      <td colSpan={4}>
                        <TableSpinner />
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-6">
                        <EmptyState
                          compact
                          icon={<PulseIcon size={20} />}
                          title="Henüz Aktivite Kaydı Yok"
                          description="Seçili periyotta kayıt düşmedi."
                        />
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => {
                      const meta = ACTION_META[log.action] ?? {
                        label: log.action,
                        color: "var(--text-faint)",
                        icon: "·",
                      };
                      const data = log.metadata as Record<string, string> | null;
                      return (
                        <tr
                          key={log.id}
                          className="transition-colors duration-200 hover:bg-[var(--bg-raised)]"
                        >
                          <td className="dn-mono whitespace-nowrap px-4 py-3 text-[10.5px] uppercase tracking-[0.08em] text-[var(--text-muted)]">
                            {fmtTime(log.createdAt)}
                          </td>
                          <td className="px-4 py-3">
                            {log.user ? (
                              <div className="flex items-center gap-2">
                                <Avatar name={log.user.name} size="xs" />
                                <div>
                                  <p className="text-[12.5px] text-[var(--text-secondary)]">
                                    {log.user.name}
                                  </p>
                                  {log.user.username && (
                                    <p className="dn-mono text-[10px] text-[var(--text-muted)]">
                                      @{log.user.username}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs text-[var(--text-muted)]">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <ActionTag meta={meta} />
                          </td>
                          <td className="max-w-[220px] truncate px-4 py-3 text-[12.5px] text-[var(--text-muted)]">
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
            </div>

            <Pagination
              page={logsPage}
              totalPages={logsTotalPages}
              onPrev={() => setLogsPage((p) => Math.max(1, p - 1))}
              onNext={() => setLogsPage((p) => Math.min(logsTotalPages, p + 1))}
            />
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
              <section className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-card)] p-6 transition-colors duration-300 ease-out-expo hover:border-[var(--text-faint)]">
                <div className="flex items-start gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--border)] text-[var(--text-secondary)]">
                    <UserPlusIcon size={17} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="dn-mono text-[10.5px] uppercase tracking-[0.16em] text-[var(--gold)]">
                      (01)
                    </p>
                    <h3 className="mt-1 text-base font-semibold text-[var(--text-primary)]">
                      Yeni Kayıt
                    </h3>
                    <p className="mt-0.5 text-sm text-[var(--text-muted)]">
                      Yeni kullanıcı kaydını aç veya kapat.
                    </p>
                  </div>
                  <Switch
                    size="lg"
                    active={settings.registrationEnabled === "true"}
                    tone="accent"
                    disabled={savingSettings}
                    title={settings.registrationEnabled === "true" ? "Kaydı Kapat" : "Kaydı Aç"}
                    onClick={() =>
                      saveSettings({
                        registrationEnabled:
                          settings.registrationEnabled === "true" ? "false" : "true",
                      })
                    }
                  />
                </div>
                <div className="mt-5 border-t border-[var(--border)] pt-4">
                  <StatePill
                    on={settings.registrationEnabled === "true"}
                    onLabel="Kayıt Açık"
                    offLabel="Kayıt Kapalı"
                    offTone="danger"
                  />
                </div>
              </section>

              {/* Maintenance */}
              <section className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-card)] p-6 transition-colors duration-300 ease-out-expo hover:border-[var(--text-faint)]">
                <div className="flex items-start gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--border)] text-[var(--text-secondary)]">
                    <WrenchIcon size={17} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="dn-mono text-[10.5px] uppercase tracking-[0.16em] text-[var(--gold)]">
                      (02)
                    </p>
                    <h3 className="mt-1 text-base font-semibold text-[var(--text-primary)]">
                      Bakım Modu
                    </h3>
                    <p className="mt-0.5 text-sm text-[var(--text-muted)]">
                      Yöneticiler dışında tüm kullanıcılar bakım sayfasına yönlendirilir.
                    </p>
                  </div>
                  <Switch
                    size="lg"
                    active={settings.maintenanceMode === "true"}
                    tone="accent-2"
                    disabled={savingSettings}
                    title={
                      settings.maintenanceMode === "true" ? "Bakım Modunu Kapat" : "Bakım Modunu Aç"
                    }
                    onClick={() =>
                      saveSettings({
                        maintenanceMode: settings.maintenanceMode === "true" ? "false" : "true",
                      })
                    }
                  />
                </div>

                <div className="mt-5 space-y-4 border-t border-[var(--border)] pt-4">
                  {settings.maintenanceMode === "true" && (
                    <div className="flex items-center gap-2 rounded-full border border-accent-2/30 bg-accent-2/5 px-3.5 py-1.5 text-[12px] font-medium text-accent-2">
                      <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-accent-2" />
                      Bakım modu aktif — admin olmayan kullanıcılar engellenecek
                    </div>
                  )}

                  <div className="space-y-2">
                    <label
                      htmlFor="admin-maintenance-message"
                      className="dn-mono block text-[10.5px] uppercase tracking-[0.16em] text-[var(--text-muted)]"
                    >
                      Bakım Mesajı
                    </label>
                    <input
                      id="admin-maintenance-message"
                      type="text"
                      defaultValue={settings.maintenanceMessage}
                      onBlur={(e) => {
                        if (e.target.value !== settings.maintenanceMessage) {
                          saveSettings({ maintenanceMessage: e.target.value });
                        }
                      }}
                      className="w-full rounded-2xl border border-[var(--border)] bg-[var(--bg-base)] px-4 py-2.5 text-[16px] text-[var(--text-primary)] transition-colors duration-200 placeholder:text-[var(--text-faint)] focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/15 sm:text-sm"
                      placeholder="Bakım mesajı..."
                    />
                    <p className="text-[12px] text-[var(--text-faint)]">
                      Odak dışına çıkınca otomatik kaydedilir.
                    </p>
                  </div>
                </div>
              </section>
            </>
          ) : null}
        </div>
      )}

      {/* ── Delete user confirm ── */}
      {confirmDelete && (
        <ConfirmModal
          title="Kullanıcıyı Sil"
          message={
            <>
              <span className="font-semibold text-[var(--text-primary)]">{confirmDelete.name}</span>{" "}
              silinecek.
            </>
          }
          detail="Bu işlem geri alınamaz. Tüm notları ve kategorileri de silinir."
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => deleteUser(confirmDelete.id)}
        />
      )}

      {/* ── Delete post confirm ── */}
      {confirmDeletePost && (
        <ConfirmModal
          title="Notu Sil"
          message={
            <>
              <span className="font-semibold text-[var(--text-primary)]">
                {confirmDeletePost.title}
              </span>{" "}
              silinecek.
            </>
          }
          detail="Bu işlem geri alınamaz."
          onCancel={() => setConfirmDeletePost(null)}
          onConfirm={() => deletePost(confirmDeletePost.id)}
        />
      )}
    </main>
  );
}

/* ══════════════════════════════════════════════
   Inline sub-components
   ══════════════════════════════════════════════ */

const TH =
  "dn-mono px-4 py-3.5 text-left text-[10px] font-normal uppercase tracking-[0.16em] text-[var(--text-muted)]";

const SEARCH_INPUT =
  "w-full rounded-full border border-[var(--border)] bg-[var(--bg-card)] py-2.5 pl-10 pr-4 text-[16px] text-[var(--text-primary)] transition-colors duration-200 placeholder:text-[var(--text-faint)] focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/15 sm:text-sm";

const FILTER_PILL =
  "cursor-pointer whitespace-nowrap rounded-full px-3.5 py-1.5 text-[11.5px] font-semibold transition-colors duration-200 ease-out-expo active:scale-95";
const FILTER_PILL_ON = "bg-accent text-[var(--text-on-accent)]";
const FILTER_PILL_OFF = "text-[var(--text-muted)] hover:text-[var(--text-primary)]";

type SwitchTone = "accent" | "accent-2" | "danger";

const SWITCH_TRACK: Record<SwitchTone, string> = {
  accent: "border-transparent bg-accent",
  "accent-2": "border-transparent bg-accent-2",
  danger: "border-transparent bg-danger",
};

function Switch({
  active,
  tone,
  onClick,
  title,
  disabled,
  size = "sm",
}: {
  active: boolean;
  tone: SwitchTone;
  onClick: (e: React.MouseEvent) => void;
  title?: string;
  disabled?: boolean;
  size?: "sm" | "lg";
}) {
  const lg = size === "lg";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      aria-label={title}
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`relative inline-flex shrink-0 cursor-pointer items-center rounded-full border transition-colors duration-300 ease-out-expo disabled:cursor-not-allowed disabled:opacity-50 ${
        lg ? "h-6 w-11" : "h-5 w-9"
      } ${active ? SWITCH_TRACK[tone] : "border-[var(--border)] bg-[var(--bg-raised)]"}`}
    >
      <span
        className={`absolute rounded-full transition-all duration-300 ease-out-expo ${
          lg ? "h-4 w-4" : "h-3.5 w-3.5"
        } ${
          active
            ? `bg-[var(--text-on-accent)] ${lg ? "left-[22px]" : "left-[17px]"}`
            : "left-[3px] bg-[var(--text-muted)]"
        }`}
      />
    </button>
  );
}

function ToggleSwitch({
  label,
  active,
  tone,
  onClick,
}: {
  label: string;
  active: boolean;
  tone: SwitchTone;
  onClick: (e: React.MouseEvent) => void;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="dn-mono text-[9px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
        {label}
      </span>
      <Switch active={active} tone={tone} onClick={onClick} title={label} />
    </div>
  );
}

function Avatar({ name, size }: { name: string; size: "xs" | "sm" | "md" }) {
  const dim =
    size === "xs" ? "h-6 w-6 text-[10px]" : size === "sm" ? "h-8 w-8 text-xs" : "h-9 w-9 text-sm";
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-raised)] font-semibold text-[var(--text-secondary)] ${dim}`}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

const BADGE =
  "dn-mono inline-flex shrink-0 items-center rounded-full border px-1.5 py-px text-[9px] uppercase tracking-[0.12em]";

function UserBadges({ user, compact = false }: { user: UserRow; compact?: boolean }) {
  return (
    <>
      {user.isAdmin && <span className={`${BADGE} border-accent/35 text-accent`}>Admin</span>}
      {user.isBanned && <span className={`${BADGE} border-danger/35 text-danger`}>Ban</span>}
      <span
        className={`${BADGE} ${
          user.isPublic
            ? "border-accent-2/35 text-accent-2"
            : "border-[var(--border)] text-[var(--text-muted)]"
        }`}
      >
        {user.isPublic ? (compact ? "Açık" : "Açık Profil") : compact ? "Gizli" : "Gizli Profil"}
      </span>
    </>
  );
}

function ActionTag({ meta }: { meta: { label: string; color: string } }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] px-2.5 py-0.5 text-[11.5px] font-medium text-[var(--text-secondary)]">
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: meta.color }} />
      {meta.label}
    </span>
  );
}

function StatePill({
  on,
  onLabel,
  offLabel,
  offTone,
}: {
  on: boolean;
  onLabel: string;
  offLabel: string;
  offTone: "danger" | "muted";
}) {
  const cls = on
    ? "border-accent/30 text-accent"
    : offTone === "danger"
      ? "border-danger/30 text-danger"
      : "border-[var(--border)] text-[var(--text-muted)]";
  const dot = on ? "bg-accent" : offTone === "danger" ? "bg-danger" : "bg-[var(--text-muted)]";
  return (
    <span
      className={`dn-mono inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10.5px] uppercase tracking-[0.16em] ${cls}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {on ? onLabel : offLabel}
    </span>
  );
}

function TableSpinner() {
  return (
    <div className="flex justify-center py-14">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--border)] border-t-accent" />
    </div>
  );
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status) {
    return (
      <span className="inline-flex items-center rounded-full border border-dashed border-[var(--border)] px-2.5 py-0.5 text-[11px] text-[var(--text-muted)]">
        Durum Yok
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--text-secondary)]">
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ background: STATUS_COLORS[status] ?? "var(--text-faint)" }}
      />
      {status}
    </span>
  );
}
