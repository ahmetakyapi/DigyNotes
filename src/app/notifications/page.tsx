"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import toast from "react-hot-toast";

interface NotificationItem {
  id: string;
  type: string;
  text: string;
  href: string;
  read: boolean;
  createdAt: string;
  actor?: {
    id: string;
    name: string;
    username: string | null;
    avatarUrl: string | null;
  };
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("tr-TR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NotificationsPage() {
  const { status } = useSession();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "unread" | "read">("all");
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") {
      setLoading(true);
      return;
    }

    if (status === "unauthenticated") {
      setNotifications([]);
      setUnreadCount(0);
      setLoadError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchNotifications = async () => {
      setLoading(true);
      setLoadError(null);

      try {
        const response = await fetch("/api/notifications", { cache: "no-store" });
        if (response.status === 401) {
          if (!cancelled) {
            setNotifications([]);
            setUnreadCount(0);
          }
          return;
        }

        if (!response.ok) {
          throw new Error();
        }

        const data = await response.json();
        if (cancelled) return;

        setNotifications(Array.isArray(data?.notifications) ? data.notifications : []);
        setUnreadCount(typeof data?.unreadCount === "number" ? data.unreadCount : 0);
      } catch {
        if (!cancelled) {
          setNotifications([]);
          setUnreadCount(0);
          setLoadError("Bildirimler şu anda yüklenemedi.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchNotifications();

    return () => {
      cancelled = true;
    };
  }, [status]);

  const markAllRead = async () => {
    if (unreadCount === 0 || markingAll) return;

    setMarkingAll(true);
    try {
      const response = await fetch("/api/notifications/read-all", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error();
      }

      setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
      setUnreadCount(0);
      window.dispatchEvent(new Event("notifications:refresh"));
      toast.success("Tüm bildirimler okundu");
    } catch {
      toast.error("Bildirimler güncellenemedi");
    } finally {
      setMarkingAll(false);
    }
  };

  const filteredNotifications = useMemo(() => {
    if (activeFilter === "unread") {
      return notifications.filter((item) => !item.read);
    }
    if (activeFilter === "read") {
      return notifications.filter((item) => item.read);
    }
    return notifications;
  }, [activeFilter, notifications]);

  const unreadNotifications = filteredNotifications.filter((item) => !item.read);
  const readNotifications = filteredNotifications.filter((item) => item.read);
  const lastActivity = notifications[0]?.createdAt ? formatDate(notifications[0].createdAt) : "-";

  if (status === "unauthenticated") {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--bg-card)] px-6 py-12 text-center">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Bildirimler</h1>
          <p className="mt-3 text-sm text-[var(--text-muted)]">
            Takip, yorum ve beğeni bildirimlerini görmek için giriş yapman gerekiyor.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => signIn()}
              className="rounded-lg bg-[var(--gold)] px-4 py-2 text-sm font-semibold text-[var(--text-on-accent)]"
            >
              Giriş yap
            </button>
            <Link
              href="/discover"
              className="rounded-lg border border-[var(--border)] bg-[var(--bg-raised)] px-4 py-2 text-sm font-semibold text-[var(--text-secondary)]"
            >
              Keşfe dön
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Bildirimler</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Takip, beğeni ve yorum güncellemeleri burada.
          </p>
        </div>
        <button
          type="button"
          onClick={markAllRead}
          disabled={markingAll || unreadCount === 0}
          className="hover:border-[var(--gold)]/30 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-xs font-semibold text-[var(--text-secondary)] transition-colors hover:text-[var(--gold)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {markingAll ? "İşleniyor..." : "Tümünü okundu yap"}
        </button>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--text-muted)]">
            Okunmamış
          </p>
          <p className="mt-2 text-2xl font-black text-[var(--text-primary)]">{unreadCount}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--text-muted)]">
            Toplam
          </p>
          <p className="mt-2 text-2xl font-black text-[var(--text-primary)]">
            {notifications.length}
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--text-muted)]">
            Son Hareket
          </p>
          <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">{lastActivity}</p>
        </div>
      </div>

      <div className="mb-6 inline-flex rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-1">
        {[
          { key: "all", label: "Tümü" },
          { key: "unread", label: "Okunmamış" },
          { key: "read", label: "Okunan" },
        ].map((filter) => (
          <button
            key={filter.key}
            type="button"
            onClick={() => setActiveFilter(filter.key as "all" | "unread" | "read")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeFilter === filter.key
                ? "bg-[var(--gold)] text-[var(--text-on-accent)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {loadError && !loading && (
        <div className="border-[var(--gold)]/20 bg-[var(--gold)]/8 mb-6 rounded-2xl border px-4 py-3 text-sm text-[var(--text-secondary)]">
          {loadError}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="h-20 animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]"
            />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-6 py-10 text-center">
          <p className="text-sm text-[var(--text-muted)]">Henüz bildirimin yok.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {unreadNotifications.length > 0 && (
            <section>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                  Okunmamış
                </h2>
                <span className="rounded-full border border-[var(--border)] bg-[var(--bg-card)] px-2 py-0.5 text-[10px] font-semibold text-[var(--text-secondary)]">
                  {unreadNotifications.length}
                </span>
              </div>
              <div className="space-y-3">
                {unreadNotifications.map((notification) => (
                  <NotificationCard key={notification.id} notification={notification} />
                ))}
              </div>
            </section>
          )}

          {readNotifications.length > 0 && (
            <section>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                  Daha Önce
                </h2>
                <span className="rounded-full border border-[var(--border)] bg-[var(--bg-card)] px-2 py-0.5 text-[10px] font-semibold text-[var(--text-secondary)]">
                  {readNotifications.length}
                </span>
              </div>
              <div className="space-y-3">
                {readNotifications.map((notification) => (
                  <NotificationCard key={notification.id} notification={notification} />
                ))}
              </div>
            </section>
          )}

          {filteredNotifications.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg-card)] px-6 py-10 text-center">
              <p className="text-sm text-[var(--text-muted)]">Bu filtrede bildirim bulunamadı.</p>
            </div>
          )}
        </div>
      )}
    </main>
  );
}

function NotificationCard({ notification }: { notification: NotificationItem }) {
  return (
    <Link
      href={notification.href}
      className={`block rounded-2xl border px-4 py-4 transition-colors ${
        notification.read
          ? "border-[var(--border)] bg-[var(--bg-card)]"
          : "border-[var(--gold)]/25 bg-[var(--gold)]/6"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
            notification.read
              ? "border-[var(--border)] bg-[var(--bg-raised)] text-[var(--text-muted)]"
              : "border-[var(--gold)]/25 bg-[var(--gold)]/12 text-[var(--gold)]"
          }`}
        >
          {notification.actor?.name?.charAt(0)?.toUpperCase() ?? "•"}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {!notification.read && <span className="h-2 w-2 rounded-full bg-[var(--gold)]" />}
            <p className="text-sm text-[var(--text-primary)]">{notification.text}</p>
          </div>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            {formatDate(notification.createdAt)}
          </p>
        </div>
      </div>
    </Link>
  );
}
