"use client";

/* LAYOUT:
   - Sticky back header
   - Hero: avatar letter + name + email + badges
   - 4 KPI row: notes / followers / following / total actions
   - Two-column grid (lg:2/3 + 1/3):
     - Left: Last 24h bar chart + activity log list (paginated)
     - Right: Tarih/zaman kartı + eylem dağılımı
*/

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

/* ─── types ─── */
interface UserDetail {
  id: string; name: string; email: string; username: string | null;
  bio: string | null; avatarUrl: string | null;
  isAdmin: boolean; isPublic: boolean;
  createdAt: string; lastLoginAt: string | null; lastLogoutAt: string | null;
  postCount: number; followerCount: number; followingCount: number; activityCount: number;
}

interface LogEntry {
  id: string; action: string; metadata: Record<string, unknown> | null; createdAt: string;
}

interface ChartBucket { label: string; count: number }
interface ActionStat { action: string; count: number }

type RangeKey = "24h" | "7d" | "30d" | "90d" | "365d";

interface ApiResponse {
  user: UserDetail;
  logs: LogEntry[];
  logsTotal: number;
  page: number;
  totalPages: number;
  chartData: ChartBucket[];
  range: RangeKey;
  actionBreakdown: ActionStat[];
}

/* ─── constants ─── */
const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: "24h",  label: "24s"    },
  { key: "7d",   label: "7 Gün"  },
  { key: "30d",  label: "30 Gün" },
  { key: "90d",  label: "90 Gün" },
  { key: "365d", label: "1 Yıl"  },
];

const RANGE_LABELS: Record<RangeKey, string> = {
  "24h":  "Son 24 Saat",
  "7d":   "Son 7 Gün",
  "30d":  "Son 30 Gün",
  "90d":  "Son 90 Gün",
  "365d": "Son 1 Yıl",
};

const ACTION_META: Record<string, { label: string; color: string }> = {
  "post.create":     { label: "Not oluşturuldu",      color: "#34d399" },
  "post.update":     { label: "Not güncellendi",      color: "#60a5fa" },
  "post.delete":     { label: "Not silindi",           color: "#e53e3e" },
  "user.register":   { label: "Kayıt oldu",            color: "#c9a84c" },
  "category.create": { label: "Kategori oluşturuldu", color: "#818cf8" },
  "user.follow":     { label: "Takip etti",            color: "#f472b6" },
};

/* ─── helpers ─── */
function fmtFull(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("tr-TR", {
    day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "numeric", month: "long", year: "numeric",
  });
}
function timeAgo(iso: string | null) {
  if (!iso) return null;
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "Az önce";
  if (min < 60) return `${min} dk önce`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} saat önce`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day} gün önce`;
  return null;
}

/* ─── sub-components ─── */
function KpiCard({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div
      className="rounded-2xl border p-4 transition-all duration-200"
      style={{ background: `${color}08`, borderColor: `${color}20` }}
    >
      <div className="text-[26px] font-black leading-none text-[var(--text-primary)]">{value}</div>
      <div className="mt-1.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">{label}</div>
    </div>
  );
}

function InfoRow({ label, value, accent }: { label: string; value: React.ReactNode; accent?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] py-2.5 last:border-0">
      <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">{label}</span>
      <span className={`text-right text-xs ${accent ? "font-semibold text-[#c9a84c]" : "text-[var(--text-secondary)]"}`}>{value}</span>
    </div>
  );
}

const DarkTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-base)] px-3 py-2 text-xs">
      {label && <p className="mb-1 text-[var(--text-muted)]">{label}</p>}
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: p.color }} />
          <span className="font-bold" style={{ color: p.color }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

/* ─── main ─── */
export default function UserDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [range, setRange] = useState<RangeKey>("24h");

  async function load(p: number, replace = false, r?: RangeKey) {
    const activeRange = r ?? range;
    if (p === 1) setLoading(true); else setLoadingMore(true);
    const res = await fetch(`/api/admin/users/${params.id}?page=${p}&range=${activeRange}`).then((r) => r.json());
    setData((prev) =>
      replace || !prev
        ? res
        : { ...res, logs: [...prev.logs, ...res.logs] }
    );
    if (p === 1) setLoading(false); else setLoadingMore(false);
  }

  useEffect(() => { load(1, true); }, [params.id]);

  function handleRangeChange(r: RangeKey) {
    setRange(r);
    setPage(1);
    load(1, true, r);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--bg-base)]">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-[var(--border)] border-t-[#c9a84c]" />
      </main>
    );
  }

  if (!data?.user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--bg-base)]">
        <p className="text-sm text-[var(--text-muted)]">Kullanıcı bulunamadı.</p>
      </main>
    );
  }

  const { user, logs, logsTotal, totalPages, chartData, actionBreakdown } = data;
  const chartTotal = chartData.reduce((s, h) => s + h.count, 0);

  return (
    <main className="min-h-screen bg-[var(--bg-base)] pb-20">

      {/* ── sticky header ── */}
      <div className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--bg-base)]/95 backdrop-blur-md">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex h-14 items-center gap-3">
            <button
              onClick={() => router.push("/admin")}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-[11px] font-semibold text-[var(--text-muted)] transition-colors hover:border-[#c9a84c]/30 hover:text-[var(--text-primary)] active:scale-95"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
              Admin Paneli
            </button>
            <span className="text-[var(--text-muted)]">/</span>
            <span className="text-sm font-semibold text-[var(--text-primary)]">{user.name}</span>
            {user.isAdmin && (
              <span className="rounded bg-[#c9a84c]/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#c9a84c]">admin</span>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-5 px-4 pt-6 sm:px-6">

        {/* ── hero card ── */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#c9a84c]/20 bg-[#c9a84c]/10 text-xl font-black text-[#c9a84c]">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-bold text-[var(--text-primary)]">{user.name}</h1>
                {user.isAdmin && (
                  <span className="rounded bg-[#c9a84c]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#c9a84c]">admin</span>
                )}
                {!user.isPublic && (
                  <span className="rounded border border-[var(--border)] bg-[var(--bg-raised)] px-2 py-0.5 text-[10px] font-semibold text-[var(--text-muted)]">gizli</span>
                )}
              </div>
              {user.username && <p className="text-sm text-[var(--text-muted)]">@{user.username}</p>}
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">{user.email}</p>
              {user.bio && <p className="mt-1.5 text-xs text-[var(--text-secondary)] line-clamp-2">{user.bio}</p>}
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Üye tarihi</p>
              <p className="text-sm font-semibold text-[var(--text-secondary)]">{fmtDate(user.createdAt)}</p>
            </div>
          </div>
        </div>

        {/* ── KPI row ── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KpiCard value={user.postCount}     label="Not"       color="#818cf8" />
          <KpiCard value={user.followerCount} label="Takipçi"   color="#f472b6" />
          <KpiCard value={user.followingCount}label="Takip"     color="#fb923c" />
          <KpiCard value={user.activityCount} label="Aksiyon"   color="#c9a84c" />
        </div>

        {/* ── two-column grid ── */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">

          {/* left: charts + logs */}
          <div className="space-y-5 lg:col-span-2">

            {/* activity chart */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <h3 className="text-[13px] font-semibold text-[var(--text-primary)]">{RANGE_LABELS[range]} Aktivitesi</h3>
                  <span className="rounded-lg border border-[#c9a84c]/20 bg-[#c9a84c]/10 px-2 py-0.5 text-[11px] font-bold text-[#c9a84c]">
                    {chartTotal} aksiyon
                  </span>
                </div>
                <div className="flex gap-1">
                  {RANGE_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => handleRangeChange(opt.key)}
                      className={`rounded-lg px-2.5 py-1 text-[10px] font-semibold transition-colors duration-150 ${
                        range === opt.key
                          ? "bg-[#c9a84c]/15 text-[#c9a84c] border border-[#c9a84c]/30"
                          : "border border-[var(--border)] text-[var(--text-muted)] hover:border-[#c9a84c]/20 hover:text-[var(--text-secondary)]"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              {chartTotal === 0 ? (
                <div className="flex h-32 items-center justify-center text-xs text-[var(--text-muted)]">{RANGE_LABELS[range]} aktivite yok</div>
              ) : (
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: "var(--text-muted)", fontSize: 9 }} axisLine={false} tickLine={false} interval={Math.floor(chartData.length / 8)} />
                    <YAxis tick={{ fill: "var(--text-muted)", fontSize: 9 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<DarkTooltip />} />
                    <Bar dataKey="count" name="Aksiyon" fill="#c9a84c" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* activity log */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-[13px] font-semibold text-[var(--text-primary)]">Aktivite Geçmişi</h3>
                <span className="text-xs text-[var(--text-muted)]">{logsTotal} kayıt</span>
              </div>

              {logs.length === 0 ? (
                <p className="py-8 text-center text-xs text-[var(--text-muted)]">Henüz aktivite yok</p>
              ) : (
                <div className="space-y-0">
                  {logs.map((log) => {
                    const meta = ACTION_META[log.action] ?? { label: log.action, color: "#555" };
                    const postTitle = (log.metadata as { title?: string } | null)?.title;
                    return (
                      <div key={log.id} className="flex items-start gap-3 border-b border-[var(--border)] py-3 last:border-0">
                        <div
                          className="mt-0.5 h-2 w-2 shrink-0 rounded-full"
                          style={{ background: meta.color, boxShadow: `0 0 6px ${meta.color}50` }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-[var(--text-primary)]">{meta.label}</p>
                          {postTitle && (
                            <p className="mt-0.5 truncate text-[11px] text-[var(--text-muted)]">{postTitle}</p>
                          )}
                        </div>
                        <span className="shrink-0 text-[10px] text-[var(--text-muted)]">
                          {new Date(log.createdAt).toLocaleString("tr-TR", {
                            day: "numeric", month: "short",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {page < totalPages && (
                <button
                  onClick={() => { const next = page + 1; setPage(next); load(next); }}
                  disabled={loadingMore}
                  className="mt-4 w-full rounded-xl border border-[var(--border)] py-2 text-xs text-[var(--text-muted)] transition-colors hover:border-[#c9a84c]/30 hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {loadingMore ? "Yükleniyor…" : "Daha fazla göster"}
                </button>
              )}
            </div>
          </div>

          {/* right: dates + action breakdown */}
          <div className="space-y-5">

            {/* dates card */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
              <h3 className="mb-4 text-[13px] font-semibold text-[var(--text-primary)]">Zaman Bilgileri</h3>
              <div>
                <InfoRow label="Üye oldu" value={fmtDate(user.createdAt)} />
                <InfoRow
                  label="Son giriş"
                  accent={!!user.lastLoginAt}
                  value={
                    user.lastLoginAt ? (
                      <span>
                        <span className="block">{fmtFull(user.lastLoginAt)}</span>
                        {timeAgo(user.lastLoginAt) && (
                          <span className="text-[10px] text-[var(--text-muted)]">{timeAgo(user.lastLoginAt)}</span>
                        )}
                      </span>
                    ) : "—"
                  }
                />
                <InfoRow
                  label="Son çıkış"
                  value={
                    user.lastLogoutAt ? (
                      <span>
                        <span className="block">{fmtFull(user.lastLogoutAt)}</span>
                        {timeAgo(user.lastLogoutAt) && (
                          <span className="text-[10px] text-[var(--text-muted)]">{timeAgo(user.lastLogoutAt)}</span>
                        )}
                      </span>
                    ) : "—"
                  }
                />
              </div>
            </div>

            {/* action breakdown */}
            {actionBreakdown.length > 0 && (
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
                <h3 className="mb-4 text-[13px] font-semibold text-[var(--text-primary)]">Eylem Dağılımı</h3>
                <div className="space-y-2.5">
                  {actionBreakdown.map((a) => {
                    const meta = ACTION_META[a.action] ?? { label: a.action, color: "#555" };
                    const max = actionBreakdown[0]?.count ?? 1;
                    const pct = (a.count / max) * 100;
                    return (
                      <div key={a.action} className="flex items-center gap-2.5">
                        <div className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: meta.color }} />
                        <span className="w-28 shrink-0 truncate text-[11px] text-[var(--text-secondary)]">{meta.label}</span>
                        <div className="relative h-1 flex-1 overflow-hidden rounded-full bg-[var(--bg-raised)]">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, background: meta.color }}
                          />
                        </div>
                        <span className="w-5 shrink-0 text-right text-[11px] font-bold text-[var(--text-primary)]">{a.count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* quick actions */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
              <h3 className="mb-3 text-[13px] font-semibold text-[var(--text-primary)]">Hızlı İşlemler</h3>
              {user.username && (
                <a
                  href={`/profile/${user.username}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mb-2 flex w-full items-center justify-between rounded-xl border border-[var(--border)] px-3 py-2 text-xs text-[var(--text-muted)] transition-colors hover:border-[#c9a84c]/30 hover:text-[var(--text-primary)]"
                >
                  Profil sayfasına git
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
