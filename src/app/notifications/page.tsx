"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { BellIcon, BellRingingIcon, CheckCircleIcon } from "@phosphor-icons/react";
import { AvatarImage } from "@/components/AvatarImage";
import toast from "react-hot-toast";

interface NotificationItem {
  id: string;
  type: string;
  text: string;
  href: string;
  read: boolean;
  createdAt: string;
  kindLabel?: string | null;
  contextTitle?: string | null;
  preview?: string | null;
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

  const markNotificationRead = async (notificationId: string) => {
    let shouldRequest = false;

    setNotifications((prev) =>
      prev.map((item) => {
        if (item.id !== notificationId || item.read) {
          return item;
        }
        shouldRequest = true;
        return { ...item, read: true };
      })
    );

    if (!shouldRequest) return;

    setUnreadCount((prev) => Math.max(0, prev - 1));
    window.dispatchEvent(new Event("notifications:refresh"));

    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error();
      }
    } catch {
      setNotifications((prev) =>
        prev.map((item) => (item.id === notificationId ? { ...item, read: false } : item))
      );
      setUnreadCount((prev) => prev + 1);
      window.dispatchEvent(new Event("notifications:refresh"));
    }
  };

  if (status === "unauthenticated") {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg-card)] px-6 py-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#10b981]/10 text-[var(--gold)]">
            <BellIcon size={24} weight="duotone" />
          </div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Bildirimler</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-[var(--text-muted)]">
            Takip, yorum ve beğeni bildirimlerini görmek için giriş yapman gerekiyor.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => signIn()}
              className="rounded-lg bg-[#10b981] px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#059669] active:scale-95"
            >
              Giriş yap
            </button>
            <Link
              href="/discover"
              className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-5 py-2.5 text-sm font-semibold text-[var(--text-secondary)] transition-colors duration-200 hover:text-[var(--text-primary)]"
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
      <header className="mb-6">
        <div className="flex items-baseline justify-between gap-4">
          <div className="flex items-baseline gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Bildirimler
            </h1>
            <p className="hidden text-sm text-[var(--text-muted)] sm:block">
              Takip, beğeni ve yorum güncellemeleri
            </p>
          </div>
          <button
            type="button"
            onClick={markAllRead}
            disabled={markingAll || unreadCount === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-xs font-semibold text-[var(--text-secondary)] transition-colors duration-200 hover:border-[#10b981]/30 hover:text-[var(--gold)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <CheckCircleIcon size={14} weight="bold" />
            {markingAll ? "İşleniyor..." : "Tümünü okundu yap"}
          </button>
        </div>
        <div className="mt-3 h-px w-full bg-[var(--border)]" />
      </header>

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
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors duration-200 ${
              activeFilter === filter.key
                ? "bg-[#10b981] text-white"
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
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg-card)] px-6 py-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#10b981]/10 text-[var(--gold)]">
            <BellRingingIcon size={24} weight="duotone" />
          </div>
          <p className="text-sm font-medium text-[var(--text-secondary)]">Henüz bildirimin yok</p>
          <p className="mx-auto mt-1 max-w-xs text-xs text-[var(--text-muted)]">
            Birisi seni takip ettiğinde, notlarını beğendiğinde veya yorum yaptığında burada görünecek.
          </p>
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
                  <NotificationCard
                    key={notification.id}
                    notification={notification}
                    onOpen={markNotificationRead}
                  />
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
                  <NotificationCard
                    key={notification.id}
                    notification={notification}
                    onOpen={markNotificationRead}
                  />
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

function NotificationCard({
  notification,
  onOpen,
}: {
  notification: NotificationItem;
  onOpen: (notificationId: string) => Promise<void>;
}) {
  return (
    <Link
      href={notification.href}
      onClick={() => {
        if (!notification.read) {
          void onOpen(notification.id);
        }
      }}
      className={`group block rounded-2xl border px-4 py-4 transition-all duration-200 hover:-translate-y-0.5 ${
        notification.read
          ? "border-[var(--border)] bg-[var(--bg-card)] hover:border-[#10b981]/20"
          : "border-[var(--gold)]/25 bg-[var(--gold)]/6 hover:border-[var(--gold)]/40"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border ${
            notification.read
              ? "border-[var(--border)] bg-[var(--bg-raised)]"
              : "border-[var(--gold)]/25 bg-[var(--gold)]/12"
          }`}
        >
          <AvatarImage
            src={notification.actor?.avatarUrl ?? null}
            alt={notification.actor?.name ?? ""}
            name={notification.actor?.name ?? "?"}
            size={40}
            className="h-full w-full object-cover"
            textClassName={`text-sm font-bold ${notification.read ? "text-[var(--text-muted)]" : "text-[var(--gold)]"}`}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {!notification.read && (
              <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--gold)]" />
            )}
            <p className="text-sm text-[var(--text-primary)] transition-colors group-hover:text-[var(--gold)]">
              {notification.text}
            </p>
          </div>
          {(notification.kindLabel || notification.contextTitle) && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {notification.kindLabel && (
                <span className="rounded-full border border-[var(--border)] bg-[var(--bg-raised)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-faint)]">
                  {notification.kindLabel}
                </span>
              )}
              {notification.contextTitle && (
                <span className="rounded-full border border-[var(--gold)]/20 bg-[var(--gold)]/8 px-2 py-0.5 text-[10px] font-medium text-[var(--gold)]">
                  {notification.contextTitle}
                </span>
              )}
            </div>
          )}
          {notification.preview && (
            <p className="mt-2 line-clamp-2 text-xs leading-5 text-[var(--text-secondary)]">
              {notification.preview}
            </p>
          )}
          <p className="mt-1.5 text-xs text-[var(--text-muted)]">
            {formatDate(notification.createdAt)}
          </p>
        </div>
      </div>
    </Link>
  );
}
