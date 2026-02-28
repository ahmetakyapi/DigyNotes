"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCategoryLabel } from "@/lib/categories";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface StatsData {
  kpis: {
    totalPosts: number;
    avgRating: number;
    postsThisYear: number;
    uniqueTags: number;
  };
  monthlySeries: { month: string; count: number }[];
  categories: { name: string; count: number }[];
  statuses: { name: string; count: number }[];
  topTags: { name: string; count: number }[];
  ratingDistribution: { label: string; count: number }[];
}

const CHART_COLORS = ["#c4a24b", "#818cf8", "#34d399", "#60a5fa", "#f472b6", "#fb923c"];

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
      <h2 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">{title}</h2>
      {children}
    </section>
  );
}

function Kpi({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">
        {label}
      </p>
      <p className="mt-2 text-3xl font-black text-[var(--text-primary)]">{value}</p>
    </div>
  );
}

export default function PersonalStatsPage() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/users/me/stats")
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        setData(payload);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const ratedCount = data?.ratingDistribution.reduce((total, item) => total + item.count, 0) ?? 0;
  const ratedShare =
    data && data.kpis.totalPosts > 0 ? Math.round((ratedCount / data.kpis.totalPosts) * 100) : 0;
  const topCategory = data?.categories[0];
  const strongestMonth =
    data && data.monthlySeries.length > 0
      ? data.monthlySeries.reduce((best, item) => (item.count > best.count ? item : best))
      : null;
  const topStatus = data?.statuses[0];

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-28 animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]"
            />
          ))}
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-80 animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]"
            />
          ))}
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-6 py-10 text-center">
          <p className="text-sm text-[var(--text-muted)]">İstatistikler yüklenemedi.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Kişisel İstatistikler</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Üretim ritmini, kategorilerini ve puan dağılımını takip et.
        </p>
      </div>

      {data.kpis.totalPosts === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg-card)] px-6 py-12 text-center">
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            Henüz analiz edilecek not yok.
          </p>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            İlk notunu eklediğinde kategori, puan ve ritim trendleri burada görünür.
          </p>
          <Link
            href="/new-post"
            className="mt-4 inline-flex rounded-xl bg-[var(--gold)] px-4 py-2 text-sm font-semibold text-[var(--text-on-accent)] transition-colors hover:bg-[var(--gold-light)]"
          >
            İlk notu oluştur
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-6 grid gap-3 lg:grid-cols-3">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--text-muted)]">
                En Güçlü Kategori
              </p>
              <p className="mt-2 text-lg font-semibold text-[var(--text-primary)]">
                {topCategory ? getCategoryLabel(topCategory.name) : "-"}
              </p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                {topCategory ? `${topCategory.count} not ile önde` : "Yeterli veri yok"}
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--text-muted)]">
                En Üretken Dönem
              </p>
              <p className="mt-2 text-lg font-semibold text-[var(--text-primary)]">
                {strongestMonth?.month ?? "-"}
              </p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                {strongestMonth ? `${strongestMonth.count} not` : "Yeterli veri yok"}
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--text-muted)]">
                Puanlanan İçerik Oranı
              </p>
              <p className="mt-2 text-lg font-semibold text-[var(--text-primary)]">%{ratedShare}</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                {topStatus ? `En sık durum: ${topStatus.name}` : "Durum verisi hazır"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Kpi label="Toplam Not" value={data.kpis.totalPosts} />
            <Kpi
              label="Ortalama Puan"
              value={data.kpis.avgRating > 0 ? data.kpis.avgRating : "-"}
            />
            <Kpi label="Bu Yıl" value={data.kpis.postsThisYear} />
            <Kpi label="Benzersiz Etiket" value={data.kpis.uniqueTags} />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <Card title="Aylık Üretim">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.monthlySeries}>
                    <defs>
                      <linearGradient id="statsArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#c4a24b" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#c4a24b" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                    <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} />
                    <YAxis allowDecimals={false} stroke="var(--text-muted)" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        background: "var(--bg-card)",
                        border: "1px solid var(--border)",
                        borderRadius: 14,
                        color: "var(--text-primary)",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#c4a24b"
                      fill="url(#statsArea)"
                      strokeWidth={2.5}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card title="Kategori Dağılımı">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.categories}
                      dataKey="count"
                      nameKey="name"
                      innerRadius={64}
                      outerRadius={96}
                      paddingAngle={3}
                    >
                      {data.categories.map((entry, index) => (
                        <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "var(--bg-card)",
                        border: "1px solid var(--border)",
                        borderRadius: 14,
                        color: "var(--text-primary)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                {data.categories.slice(0, 5).map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                      />
                      <span className="text-[var(--text-secondary)]">
                        {getCategoryLabel(item.name)}
                      </span>
                    </div>
                    <span className="font-semibold text-[var(--text-primary)]">{item.count}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card title="Puan Dağılımı">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.ratingDistribution}>
                    <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                    <XAxis dataKey="label" stroke="var(--text-muted)" fontSize={12} />
                    <YAxis allowDecimals={false} stroke="var(--text-muted)" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        background: "var(--bg-card)",
                        border: "1px solid var(--border)",
                        borderRadius: 14,
                        color: "var(--text-primary)",
                      }}
                    />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]} fill="#c4a24b" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card title="Durumlar ve Etiketler">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                    Durum Dağılımı
                  </p>
                  <div className="space-y-2.5">
                    {data.statuses.map((item) => (
                      <div key={item.name} className="flex items-center justify-between text-xs">
                        <span className="text-[var(--text-secondary)]">{item.name}</span>
                        <span className="font-semibold text-[var(--text-primary)]">
                          {item.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                    En Aktif Etiketler
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {data.topTags.length === 0 ? (
                      <span className="text-xs text-[var(--text-muted)]">Henüz etiket yok</span>
                    ) : (
                      data.topTags.map((tag) => (
                        <span
                          key={tag.name}
                          className="rounded-full border border-[var(--border)] bg-[var(--bg-raised)] px-3 py-1 text-xs text-[var(--text-secondary)]"
                        >
                          #{tag.name} · {tag.count}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}
    </main>
  );
}
