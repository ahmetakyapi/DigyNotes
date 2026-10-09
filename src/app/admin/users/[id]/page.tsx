"use client";

/* LAYOUT: Editorial user dossier (max-w-5xl, inside AppShell).
   ROW 1: pill back link "Admin Paneli" · mono eyebrow "(16) — Yönetim / Kullanıcı".
   ROW 2: serif-italic initial disc, big grotesk name with accent dot, mono meta line
          (@username · e-posta · üyelik), bio, then a hairline.
   ROW 3: calm stat strip — 4 hairline-divided cells, serif italic numbers + mono labels.
   ROW 4: two-column grid (lg 2/3 + 1/3):
     - Left: range pills + activity bar chart card, activity log list (paginated)
     - Right: time info card, action breakdown, quick actions
*/

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { ArrowLeftIcon, ArrowUpRightIcon } from "@phosphor-icons/react";
import { FormStatusMessage } from "@/components/FormStatusMessage";
import { Dot } from "@/components/ui/PageHeader";
import { getClientErrorMessage, requestJson } from "@/lib/client-api";

/* ─── types ─── */
interface UserDetail {
  id: string;
  name: string;
  email: string;
  username: string | null;
  bio: string | null;
  avatarUrl: string | null;
  isAdmin: boolean;
  isPublic: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  lastLogoutAt: string | null;
  postCount: number;
  followerCount: number;
  followingCount: number;
  activityCount: number;
}

interface LogEntry {
  id: string;
  action: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

interface ChartBucket {
  label: string;
  count: number;
}
interface ActionStat {
  action: string;
  count: number;
}

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
  { key: "24h", label: "24s" },
  { key: "7d", label: "7 Gün" },
  { key: "30d", label: "30 Gün" },
  { key: "90d", label: "90 Gün" },
  { key: "365d", label: "1 Yıl" },
];

const RANGE_LABELS: Record<RangeKey, string> = {
  "24h": "Son 24 Saat",
  "7d": "Son 7 Gün",
  "30d": "Son 30 Gün",
  "90d": "Son 90 Gün",
  "365d": "Son 1 Yıl",
};

const ACTION_META: Record<string, { label: string; color: string }> = {
  "post.create": { label: "Not Oluşturuldu", color: "var(--gold)" },
  "post.update": { label: "Not Güncellendi", color: "rgb(var(--gold-rgb) / 0.55)" },
  "post.delete": { label: "Not Silindi", color: "var(--danger)" },
  "user.register": { label: "Kayıt Oldu", color: "var(--accent-2)" },
  "category.create": { label: "Kategori Oluşturuldu", color: "rgb(var(--accent-2-rgb) / 0.6)" },
  "user.follow": { label: "Takip Etti", color: "var(--text-muted)" },
};

/* ─── helpers ─── */
function fmtFull(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
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
function StatCell({ value, label, index }: { value: number; label: string; index: string }) {
  return (
    <div className="bg-[var(--bg-card)] px-5 py-5 transition-colors duration-300 ease-out-expo hover:bg-[var(--bg-raised)]">
      <p className="dn-eyebrow">{label}</p>
      <p className="dn-display mt-3 text-[44px] italic tabular-nums leading-none tracking-[-0.02em] text-[var(--text-primary)]">
        {value}
      </p>
    </div>
  );
}

function InfoRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] py-3 last:border-0">
      <span className="shrink-0 pt-0.5 text-[12.5px] font-medium text-[var(--text-muted)]">
        {label}
      </span>
      <span
        className={`text-right text-[13px] ${accent ? "font-semibold text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}`}
      >
        {value}
      </span>
    </div>
  );
}

function SectionTitle({
  index,
  title,
  aside,
}: {
  index: string;
  title: string;
  aside?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-[12.5px] font-medium text-[var(--gold)]">({index})</p>
        <h3 className="mt-1 text-[15px] font-semibold tracking-[-0.01em] text-[var(--text-primary)]">
          {title}
        </h3>
      </div>
      {aside}
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
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-3.5 py-2.5 text-xs shadow-[var(--shadow-soft)]">
      {label && <p className="mb-1 text-[12px] font-medium text-[var(--text-muted)]">{label}</p>}
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: p.color }} />
          <span className="dn-display text-base italic leading-none text-[var(--text-primary)]">
            {p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

const CARD = "rounded-[24px] border border-[var(--border)] bg-[var(--bg-card)] p-5 sm:p-6";

/* ─── main ─── */
export default function UserDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [range, setRange] = useState<RangeKey>("24h");
  const [error, setError] = useState("");

  const load = useCallback(
    async (p: number, replace = false, r?: RangeKey) => {
      const activeRange = r ?? range;
      if (p === 1) setLoading(true);
      else setLoadingMore(true);

      try {
        const res = await requestJson<ApiResponse>(
          `/api/admin/users/${params.id}?page=${p}&range=${activeRange}`,
          undefined,
          "Kullanıcı detayı yüklenemedi."
        );
        setData((prev) => (replace || !prev ? res : { ...res, logs: [...prev.logs, ...res.logs] }));
        setError("");
      } catch (error) {
        const message = getClientErrorMessage(error, "Kullanıcı detayı yüklenemedi.");
        setError(message);
        toast.error(message);
      } finally {
        if (p === 1) setLoading(false);
        else setLoadingMore(false);
      }
    },
    [params.id, range]
  );

  useEffect(() => {
    void load(1, true);
  }, [load]);

  function handleRangeChange(r: RangeKey) {
    setRange(r);
    setPage(1);
    load(1, true, r);
  }

  async function togglePublic() {
    if (!data?.user) return;
    const next = !data.user.isPublic;
    try {
      await requestJson(
        `/api/admin/users/${params.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isPublic: next }),
        },
        "Profil görünürlüğü güncellenemedi."
      );
      setData((prev) => (prev ? { ...prev, user: { ...prev.user, isPublic: next } } : prev));
      toast.success(next ? "Profil herkese açık" : "Profil gizlendi");
    } catch (error) {
      toast.error(getClientErrorMessage(error, "Profil görünürlüğü güncellenemedi."));
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-[var(--border)] border-t-accent" />
      </main>
    );
  }

  if (!data?.user) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="w-full max-w-lg px-4">
          <FormStatusMessage message={error || "Kullanıcı bulunamadı."} />
        </div>
      </main>
    );
  }

  const { user, logs, logsTotal, totalPages, chartData, actionBreakdown } = data;
  const chartTotal = chartData.reduce((s, h) => s + h.count, 0);

  return (
    <main className="mx-auto max-w-5xl px-4 pb-20 pt-8 sm:px-6 sm:pt-10">
      {/* ── back + eyebrow ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => router.push("/admin")}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[var(--border)] px-3.5 py-1.5 text-[12px] font-medium text-[var(--text-secondary)] transition-colors duration-200 hover:border-[var(--text-muted)] hover:text-[var(--text-primary)] active:scale-95"
        >
          <ArrowLeftIcon size={12} weight="bold" />
          Admin Paneli
        </button>
      </div>

      {/* ── editorial header ── */}
      <header className="mt-8 flex flex-col gap-5 sm:flex-row sm:items-end">
        <span className="dn-display flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-card)] text-[44px] italic leading-none text-[var(--gold)]">
          {user.name.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {user.isAdmin && (
              <span className="rounded-full border border-accent/35 px-2.5 py-0.5 text-[12px] font-medium text-accent">
                Admin
              </span>
            )}
            <span
              className={`rounded-full border px-2.5 py-0.5 text-[12px] font-medium ${
                user.isPublic
                  ? "border-accent-2/35 text-accent-2"
                  : "border-[var(--border)] text-[var(--text-muted)]"
              }`}
            >
              {user.isPublic ? "Açık Profil" : "Gizli Profil"}
            </span>
          </div>
          <h1 className="mt-3 break-words text-[clamp(2.2rem,6vw,4rem)] font-extrabold leading-[0.95] tracking-[-0.035em] text-[var(--text-primary)]">
            {user.name}
            <Dot />
          </h1>
          <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] font-medium text-[var(--text-muted)]">
            {user.username && (
              <>
                <span className="normal-case tracking-normal text-[var(--text-secondary)]">
                  @{user.username}
                </span>
                <span className="text-[var(--text-faint)]">·</span>
              </>
            )}
            <span className="normal-case tracking-normal">{user.email}</span>
            <span className="text-[var(--text-faint)]">·</span>
            <span>Üye · {fmtDate(user.createdAt)}</span>
          </p>
          {user.bio && (
            <p className="mt-3 line-clamp-2 max-w-[560px] text-[15px] leading-relaxed text-[var(--text-secondary)]">
              {user.bio}
            </p>
          )}
        </div>
      </header>
      <div className="mt-6 h-px w-full bg-[var(--border)]" />

      <div className="mt-6 space-y-5">
        {error && <FormStatusMessage message={error} />}

        {/* ── stat strip ── */}
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--border)] sm:grid-cols-4">
          <StatCell index="01" value={user.postCount} label="Not" />
          <StatCell index="02" value={user.followerCount} label="Takipçi" />
          <StatCell index="03" value={user.followingCount} label="Takip" />
          <StatCell index="04" value={user.activityCount} label="Aksiyon" />
        </div>

        {/* ── two-column grid ── */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* left: charts + logs */}
          <div className="space-y-5 lg:col-span-2">
            {/* activity chart */}
            <section className={CARD}>
              <SectionTitle
                index="A"
                title={`${RANGE_LABELS[range]} Aktivitesi`}
                aside={
                  <p className="flex items-baseline gap-2 text-[12.5px] font-medium text-[var(--text-muted)]">
                    <span className="dn-display text-2xl normal-case italic tracking-normal text-[var(--text-primary)]">
                      {chartTotal}
                    </span>
                    Aksiyon
                  </p>
                }
              />
              <div className="mb-5 inline-flex flex-wrap rounded-full border border-[var(--border)] bg-[var(--bg-base)] p-1">
                {RANGE_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => handleRangeChange(opt.key)}
                    className={`cursor-pointer rounded-full px-3.5 py-1.5 text-[11.5px] font-semibold transition-colors duration-200 ease-out-expo active:scale-95 ${
                      range === opt.key
                        ? "bg-accent text-[var(--text-on-accent)]"
                        : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {chartTotal === 0 ? (
                <div className="flex h-32 items-center justify-center rounded-[18px] border border-dashed border-[var(--border)] text-sm text-[var(--text-muted)]">
                  {RANGE_LABELS[range]} aktivite yok
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: "var(--text-muted)", fontSize: 9 }}
                      axisLine={false}
                      tickLine={false}
                      interval={Math.floor(chartData.length / 8)}
                    />
                    <YAxis
                      tick={{ fill: "var(--text-muted)", fontSize: 9 }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip content={<DarkTooltip />} cursor={{ fill: "var(--bg-raised)" }} />
                    <Bar
                      dataKey="count"
                      name="Aksiyon"
                      fill="var(--gold)"
                      radius={[999, 999, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </section>

            {/* activity log */}
            <section className={CARD}>
              <SectionTitle
                index="B"
                title="Aktivite Geçmişi"
                aside={
                  <span className="text-[12.5px] font-medium text-[var(--text-muted)]">
                    {logsTotal} Kayıt
                  </span>
                }
              />

              {logs.length === 0 ? (
                <p className="rounded-[18px] border border-dashed border-[var(--border)] py-10 text-center text-sm text-[var(--text-muted)]">
                  Henüz aktivite yok
                </p>
              ) : (
                <div>
                  {logs.map((log) => {
                    const meta = ACTION_META[log.action] ?? {
                      label: log.action,
                      color: "var(--text-faint)",
                    };
                    const postTitle = (log.metadata as { title?: string } | null)?.title;
                    return (
                      <div
                        key={log.id}
                        className="flex items-start gap-3 border-b border-[var(--border)] py-3 last:border-0"
                      >
                        <span
                          className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ background: meta.color }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-medium text-[var(--text-primary)]">
                            {meta.label}
                          </p>
                          {postTitle && (
                            <p className="mt-0.5 truncate text-[12px] text-[var(--text-muted)]">
                              {postTitle}
                            </p>
                          )}
                        </div>
                        <span className="shrink-0 pt-0.5 text-[12px] font-medium text-[var(--text-muted)]">
                          {new Date(log.createdAt).toLocaleString("tr-TR", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {page < totalPages && (
                <button
                  type="button"
                  onClick={() => {
                    const next = page + 1;
                    setPage(next);
                    load(next);
                  }}
                  disabled={loadingMore}
                  className="mt-4 w-full cursor-pointer rounded-full border border-[var(--border)] py-2.5 text-[12.5px] font-medium text-[var(--text-secondary)] transition-colors duration-200 hover:border-[var(--text-muted)] hover:text-[var(--text-primary)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {loadingMore ? "Yükleniyor…" : "Daha Fazla Göster"}
                </button>
              )}
            </section>
          </div>

          {/* right: dates + action breakdown */}
          <div className="space-y-5">
            {/* dates card */}
            <section className={CARD}>
              <SectionTitle index="C" title="Zaman Bilgileri" />
              <div>
                <InfoRow label="Üye Oldu" value={fmtDate(user.createdAt)} />
                <InfoRow
                  label="Son Giriş"
                  accent={!!user.lastLoginAt}
                  value={
                    user.lastLoginAt ? (
                      <span>
                        <span className="block">{fmtFull(user.lastLoginAt)}</span>
                        {timeAgo(user.lastLoginAt) && (
                          <span className="text-[12px] font-medium font-normal text-[var(--gold)]">
                            {timeAgo(user.lastLoginAt)}
                          </span>
                        )}
                      </span>
                    ) : (
                      "—"
                    )
                  }
                />
                <InfoRow
                  label="Son Çıkış"
                  value={
                    user.lastLogoutAt ? (
                      <span>
                        <span className="block">{fmtFull(user.lastLogoutAt)}</span>
                        {timeAgo(user.lastLogoutAt) && (
                          <span className="text-[12px] font-medium text-[var(--text-muted)]">
                            {timeAgo(user.lastLogoutAt)}
                          </span>
                        )}
                      </span>
                    ) : (
                      "—"
                    )
                  }
                />
              </div>
            </section>

            {/* action breakdown */}
            {actionBreakdown.length > 0 && (
              <section className={CARD}>
                <SectionTitle index="D" title="Eylem Dağılımı" />
                <div className="space-y-3">
                  {actionBreakdown.map((a) => {
                    const meta = ACTION_META[a.action] ?? {
                      label: a.action,
                      color: "var(--text-faint)",
                    };
                    const max = actionBreakdown[0]?.count ?? 1;
                    const pct = (a.count / max) * 100;
                    return (
                      <div key={a.action}>
                        <div className="mb-1.5 flex items-baseline justify-between gap-2">
                          <span className="truncate text-[12.5px] text-[var(--text-secondary)]">
                            {meta.label}
                          </span>
                          <span className="dn-display text-lg italic leading-none text-[var(--text-primary)]">
                            {a.count}
                          </span>
                        </div>
                        <div className="relative h-1 overflow-hidden rounded-full bg-[var(--bg-raised)]">
                          <div
                            className="h-full rounded-full transition-all duration-700 ease-out-expo"
                            style={{ width: `${pct}%`, background: meta.color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* quick actions */}
            <section className={CARD}>
              <SectionTitle index="E" title="Hızlı İşlemler" />
              <div className="flex w-full items-center justify-between gap-3 rounded-[18px] border border-[var(--border)] px-4 py-3">
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-[var(--text-primary)]">
                    Profil Görünürlüğü
                  </p>
                  <p className="mt-0.5 text-[12px] text-[var(--text-muted)]">
                    {user.isPublic
                      ? "Herkese açık — herkes görebilir"
                      : "Gizli — sadece kendisi ve adminler"}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={user.isPublic}
                  onClick={togglePublic}
                  title={user.isPublic ? "Profili Gizle" : "Profili Herkese Aç"}
                  aria-label={user.isPublic ? "Profili Gizle" : "Profili Herkese Aç"}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border transition-colors duration-300 ease-out-expo ${user.isPublic ? "border-transparent bg-accent-2" : "border-[var(--border)] bg-[var(--bg-raised)]"}`}
                >
                  <span
                    className={`absolute h-3.5 w-3.5 rounded-full transition-all duration-300 ease-out-expo ${user.isPublic ? "left-[17px] bg-[var(--text-on-accent)]" : "left-[3px] bg-[var(--text-muted)]"}`}
                  />
                </button>
              </div>
              {user.username && (
                <a
                  href={`/profile/${user.username}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 flex w-full cursor-pointer items-center justify-between rounded-full border border-[var(--border)] px-4 py-2.5 text-[12.5px] font-medium text-[var(--text-secondary)] transition-colors duration-200 hover:border-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  Profil Sayfasına Git
                  <ArrowUpRightIcon size={13} weight="bold" />
                </a>
              )}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
