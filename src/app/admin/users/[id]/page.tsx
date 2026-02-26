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

interface HourlyBucket { label: string; count: number }
interface ActionStat { action: string; count: number }

interface ApiResponse {
  user: UserDetail;
  logs: LogEntry[];
  logsTotal: number;
  page: number;
  totalPages: number;
  hourlyData: HourlyBucket[];
  actionBreakdown: ActionStat[];
}

/* ─── constants ─── */
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
      <div className="text-[26px] font-black leading-none text-[#f0ede8]">{value}</div>
      <div className="mt-1.5 text-[10px] font-semibold uppercase tracking-widest text-[#3a3a5a]">{label}</div>
    </div>
  );
}

function InfoRow({ label, value, accent }: { label: string; value: React.ReactNode; accent?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-[#1a1e2e] last:border-0">
      <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wider text-[#3a3a5a]">{label}</span>
      <span className={`text-right text-xs ${accent ? "font-semibold text-[#c9a84c]" : "text-[#888]"}`}>{value}</span>
    </div>
  );
}

const DarkTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-[#252d40] bg-[#080a10] px-3 py-2 text-xs">
      {label && <p className="mb-1 text-[#555]">{label}</p>}
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

  async function load(p: number, replace = false) {
    if (p === 1) setLoading(true); else setLoadingMore(true);
    const res = await fetch(`/api/admin/users/${params.id}?page=${p}`).then((r) => r.json());
    setData((prev) =>
      replace || !prev
        ? res
        : { ...res, logs: [...prev.logs, ...res.logs] }
    );
    if (p === 1) setLoading(false); else setLoadingMore(false);
  }

  useEffect(() => { load(1, true); }, [params.id]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#070910]">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#1a1e2e] border-t-[#c9a84c]" />
      </main>
    );
  }

  if (!data?.user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#070910]">
        <p className="text-sm text-[#555]">Kullanıcı bulunamadı.</p>
      </main>
    );
  }

  const { user, logs, logsTotal, totalPages, hourlyData, actionBreakdown } = data;
  const maxHourly = Math.max(...hourlyData.map((h) => h.count), 1);
  const last24hTotal = hourlyData.reduce((s, h) => s + h.count, 0);

  return (
    <main className="min-h-screen bg-[#070910] pb-20">

      {/* ── sticky header ── */}
      <div className="sticky top-0 z-30 border-b border-[#1a1e2e] bg-[#070910]/95 backdrop-blur-md">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex h-14 items-center gap-3">
            <button
              onClick={() => router.push("/admin")}
              className="flex items-center gap-1.5 rounded-lg border border-[#1a1e2e] px-3 py-1.5 text-[11px] font-semibold text-[#555] transition-colors hover:border-[#c9a84c]/30 hover:text-[#f0ede8] active:scale-95"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
              Admin Paneli
            </button>
            <span className="text-[#2a2a4a]">/</span>
            <span className="text-sm font-semibold text-[#f0ede8]">{user.name}</span>
            {user.isAdmin && (
              <span className="rounded bg-[#c9a84c]/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#c9a84c]">admin</span>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-5 px-4 pt-6 sm:px-6">

        {/* ── hero card ── */}
        <div className="rounded-2xl border border-[#1a1e2e] bg-[#0d0f1a] p-5">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#c9a84c]/20 bg-[#c9a84c]/10 text-xl font-black text-[#c9a84c]">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-bold text-[#f0ede8]">{user.name}</h1>
                {user.isAdmin && (
                  <span className="rounded bg-[#c9a84c]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#c9a84c]">admin</span>
                )}
                {!user.isPublic && (
                  <span className="rounded bg-[#3a3a5a]/40 px-2 py-0.5 text-[10px] font-semibold text-[#555]">gizli</span>
                )}
              </div>
              {user.username && <p className="text-sm text-[#555]">@{user.username}</p>}
              <p className="mt-0.5 text-xs text-[#444]">{user.email}</p>
              {user.bio && <p className="mt-1.5 text-xs text-[#666] line-clamp-2">{user.bio}</p>}
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[10px] uppercase tracking-wider text-[#3a3a5a]">Üye tarihi</p>
              <p className="text-sm font-semibold text-[#888]">{fmtDate(user.createdAt)}</p>
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

            {/* last 24h chart */}
            <div className="rounded-2xl border border-[#1a1e2e] bg-[#0d0f1a] p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-[13px] font-semibold text-[#f0ede8]">Son 24 Saat Aktivitesi</h3>
                <span className="rounded-lg border border-[#c9a84c]/20 bg-[#c9a84c]/10 px-2 py-0.5 text-[11px] font-bold text-[#c9a84c]">
                  {last24hTotal} aksiyon
                </span>
              </div>
              {maxHourly === 0 ? (
                <div className="flex h-32 items-center justify-center text-xs text-[#333]">Son 24 saatte aktivite yok</div>
              ) : (
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={hourlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a1e2e" vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: "#333", fontSize: 9 }} axisLine={false} tickLine={false} interval={3} />
                    <YAxis tick={{ fill: "#2a2a4a", fontSize: 9 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<DarkTooltip />} />
                    <Bar dataKey="count" name="Aksiyon" fill="#c9a84c" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* activity log */}
            <div className="rounded-2xl border border-[#1a1e2e] bg-[#0d0f1a] p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-[13px] font-semibold text-[#f0ede8]">Aktivite Geçmişi</h3>
                <span className="text-xs text-[#444]">{logsTotal} kayıt</span>
              </div>

              {logs.length === 0 ? (
                <p className="py-8 text-center text-xs text-[#333]">Henüz aktivite yok</p>
              ) : (
                <div className="space-y-0">
                  {logs.map((log) => {
                    const meta = ACTION_META[log.action] ?? { label: log.action, color: "#555" };
                    const postTitle = (log.metadata as { title?: string } | null)?.title;
                    return (
                      <div key={log.id} className="flex items-start gap-3 border-b border-[#0a0c12] py-3 last:border-0">
                        <div
                          className="mt-0.5 h-2 w-2 shrink-0 rounded-full"
                          style={{ background: meta.color, boxShadow: `0 0 6px ${meta.color}50` }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-[#f0ede8]">{meta.label}</p>
                          {postTitle && (
                            <p className="mt-0.5 truncate text-[11px] text-[#555]">{postTitle}</p>
                          )}
                        </div>
                        <span className="shrink-0 text-[10px] text-[#3a3a5a]">
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
                  className="mt-4 w-full rounded-xl border border-[#1a1e2e] py-2 text-xs text-[#555] transition-colors hover:border-[#c9a84c]/30 hover:text-[#f0ede8] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {loadingMore ? "Yükleniyor…" : "Daha fazla göster"}
                </button>
              )}
            </div>
          </div>

          {/* right: dates + action breakdown */}
          <div className="space-y-5">

            {/* dates card */}
            <div className="rounded-2xl border border-[#1a1e2e] bg-[#0d0f1a] p-5">
              <h3 className="mb-4 text-[13px] font-semibold text-[#f0ede8]">Zaman Bilgileri</h3>
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
                          <span className="text-[10px] text-[#444]">{timeAgo(user.lastLoginAt)}</span>
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
                          <span className="text-[10px] text-[#444]">{timeAgo(user.lastLogoutAt)}</span>
                        )}
                      </span>
                    ) : "—"
                  }
                />
              </div>
            </div>

            {/* action breakdown */}
            {actionBreakdown.length > 0 && (
              <div className="rounded-2xl border border-[#1a1e2e] bg-[#0d0f1a] p-5">
                <h3 className="mb-4 text-[13px] font-semibold text-[#f0ede8]">Eylem Dağılımı</h3>
                <div className="space-y-2.5">
                  {actionBreakdown.map((a) => {
                    const meta = ACTION_META[a.action] ?? { label: a.action, color: "#555" };
                    const max = actionBreakdown[0]?.count ?? 1;
                    const pct = (a.count / max) * 100;
                    return (
                      <div key={a.action} className="flex items-center gap-2.5">
                        <div className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: meta.color }} />
                        <span className="w-28 shrink-0 truncate text-[11px] text-[#666]">{meta.label}</span>
                        <div className="relative h-1 flex-1 overflow-hidden rounded-full bg-[#1a1e2e]">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, background: meta.color }}
                          />
                        </div>
                        <span className="w-5 shrink-0 text-right text-[11px] font-bold text-[#f0ede8]">{a.count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* quick actions */}
            <div className="rounded-2xl border border-[#1a1e2e] bg-[#0d0f1a] p-4">
              <h3 className="mb-3 text-[13px] font-semibold text-[#f0ede8]">Hızlı İşlemler</h3>
              {user.username && (
                <a
                  href={`/profile/${user.username}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mb-2 flex w-full items-center justify-between rounded-xl border border-[#1a1e2e] px-3 py-2 text-xs text-[#555] transition-colors hover:border-[#c9a84c]/30 hover:text-[#f0ede8]"
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
