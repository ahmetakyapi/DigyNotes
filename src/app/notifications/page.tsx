"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { motion, useReducedMotion } from "framer-motion";
import {
  BellIcon,
  BellRingingIcon,
  CheckCircleIcon,
  FunnelSimpleIcon,
} from "@phosphor-icons/react";
import { AvatarImage } from "@/components/AvatarImage";
import { PageHeader, Em, Dot } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
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

const EASE = [0.16, 1, 0.3, 1] as const;

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
  const reduce = useReducedMotion();

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
          setLoadError("Bildirimler yüklenemedi. Biraz sonra tekrar dene.");
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
      <main className="mx-auto max-w-3xl px-4 pb-12 pt-8 sm:px-6 sm:pt-10">
        {/* LAYOUT: Masthead (index 10) → sign-in empty state. */}
        <PageHeader
          index="10"
          eyebrow="Bildirimler"
          title={
            <>
              <Em>Bildirimler</Em>
              <Dot />
            </>
          }
          description="Takip, beğeni ve yorumların hepsi burada."
        />
        <EmptyState
          icon={<BellIcon size={22} weight="duotone" />}
          title={
            <>
              Bildirimler İçin <Em>Giriş Yap</Em>
            </>
          }
          description="Takip, yorum ve beğeni bildirimlerini görmek için giriş yapman gerekiyor."
          primary={{ label: "Giriş Yap", onClick: () => void signIn() }}
          secondary={{ label: "Keşfet", href: "/discover" }}
        />
      </main>
    );
  }

  const headerStats = !loading
    ? [
        ...(unreadCount > 0 ? [{ value: unreadCount, label: "Okunmamış" }] : []),
        ...(notifications.length > 0 ? [{ value: notifications.length, label: "Toplam" }] : []),
      ]
    : undefined;

  const renderCards = (items: NotificationItem[]) =>
    items.map((notification, i) => (
      <motion.div
        key={notification.id}
        initial={reduce ? false : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: EASE, delay: Math.min(i, 8) * 0.05 }}
      >
        <NotificationCard notification={notification} onOpen={markNotificationRead} />
      </motion.div>
    ));

  return (
    <main className="mx-auto max-w-3xl px-4 pb-12 pt-8 sm:px-6 sm:pt-10">
      {/* LAYOUT: Masthead (index 10, mark-all action) → pill filter + last activity → grouped rows. */}
      <PageHeader
        index="10"
        eyebrow="Bildirimler"
        title={
          <>
            <Em>Bildirimler</Em>
            <Dot />
          </>
        }
        description="Takip, beğeni ve yorumların hepsi burada."
        stats={headerStats}
        actions={
          <button
            type="button"
            onClick={markAllRead}
            disabled={markingAll || unreadCount === 0}
            className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--bg-card)] px-4 text-xs font-semibold text-[var(--text-secondary)] transition-colors duration-200 hover:border-[var(--text-faint)] hover:text-[var(--gold)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <CheckCircleIcon size={14} weight="bold" />
            {markingAll ? "İşaretleniyor..." : "Tümünü Okundu İşaretle"}
          </button>
        }
      />

      {/* LAYOUT: Pill segmented filter left, mono "last activity" meta right. */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-full border border-[var(--border)] bg-[var(--bg-card)] p-1">
          {[
            { key: "all", label: "Tümü" },
            { key: "unread", label: "Okunmamış" },
            { key: "read", label: "Okunan" },
          ].map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => setActiveFilter(filter.key as "all" | "unread" | "read")}
              className={`cursor-pointer rounded-full px-4 py-1.5 text-xs font-semibold transition-colors duration-200 ${
                activeFilter === filter.key
                  ? "bg-accent text-[var(--text-on-accent)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
        {!loading && notifications.length > 0 && (
          <p className="dn-mono text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
            Son Bildirim · <span className="text-[var(--text-secondary)]">{lastActivity}</span>
          </p>
        )}
      </div>

      {loadError && !loading && (
        <div className="mb-6 rounded-[20px] border border-accent/20 bg-accent/5 px-4 py-3 text-sm text-[var(--text-secondary)]">
          {loadError}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="h-20 animate-pulse rounded-[24px] border border-[var(--border)] bg-[var(--bg-card)]"
            />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={<BellRingingIcon size={22} weight="duotone" />}
          title={
            <>
              Henüz <Em>Bildirimin</Em> Yok
            </>
          }
          description="Biri seni takip ettiğinde ya da notunu beğendiğinde burada göreceksin."
          primary={{ label: "Keşfet", href: "/discover" }}
        />
      ) : (
        <div className="space-y-8">
          {unreadNotifications.length > 0 && (
            <section>
              <div className="mb-3 flex items-center gap-3">
                <h2 className="dn-mono text-[10.5px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                  <span className="text-[var(--gold)]">(01)</span> Okunmamış
                </h2>
                <span className="h-px flex-1 bg-[var(--border)]" />
                <span className="dn-mono text-[10px] text-[var(--text-secondary)]">
                  {String(unreadNotifications.length).padStart(2, "0")}
                </span>
              </div>
              <div className="space-y-3">{renderCards(unreadNotifications)}</div>
            </section>
          )}

          {readNotifications.length > 0 && (
            <section>
              <div className="mb-3 flex items-center gap-3">
                <h2 className="dn-mono text-[10.5px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                  <span className="text-[var(--gold)]">(02)</span> Daha Önce
                </h2>
                <span className="h-px flex-1 bg-[var(--border)]" />
                <span className="dn-mono text-[10px] text-[var(--text-secondary)]">
                  {String(readNotifications.length).padStart(2, "0")}
                </span>
              </div>
              <div className="space-y-3">{renderCards(readNotifications)}</div>
            </section>
          )}

          {filteredNotifications.length === 0 && (
            <EmptyState
              compact
              icon={<FunnelSimpleIcon size={22} weight="duotone" />}
              title={
                <>
                  Burada <Em>Bildirim</Em> Yok
                </>
              }
              description="Seçtiğin filtreye uyan bildirim yok."
              primary={{ label: "Tümünü Göster", onClick: () => setActiveFilter("all") }}
            />
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
    /* LAYOUT: Avatar · (unread dot + text) · mono kind/context chips · preview · mono timestamp. */
    <Link
      href={notification.href}
      onClick={() => {
        if (!notification.read) {
          void onOpen(notification.id);
        }
      }}
      className={`group block rounded-[24px] border px-5 py-4 transition-colors duration-300 ease-out-expo ${
        notification.read
          ? "border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--text-faint)]"
          : "border-accent/25 bg-accent/[0.06] hover:border-accent/40"
      }`}
    >
      <div className="flex items-start gap-3.5">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border ${
            notification.read
              ? "border-[var(--border)] bg-[var(--bg-raised)]"
              : "border-accent/25 bg-accent/10"
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
          <div className="flex items-start gap-2">
            {!notification.read && (
              <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--gold)]" />
            )}
            <p
              className={`text-[15px] leading-snug tracking-[-0.01em] text-[var(--text-primary)] transition-colors duration-200 group-hover:text-[var(--gold)] ${
                notification.read ? "font-medium" : "font-semibold"
              }`}
            >
              {notification.text}
            </p>
          </div>
          {(notification.kindLabel || notification.contextTitle) && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {notification.kindLabel && (
                <span className="dn-mono rounded-full border border-[var(--border)] bg-[var(--bg-raised)] px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-[var(--text-faint)]">
                  {notification.kindLabel}
                </span>
              )}
              {notification.contextTitle && (
                <span className="rounded-full border border-accent/20 bg-accent/10 px-2 py-0.5 text-[11px] font-medium text-[var(--gold)]">
                  {notification.contextTitle}
                </span>
              )}
            </div>
          )}
          {notification.preview && (
            <p className="mt-2 line-clamp-2 text-[13px] leading-5 text-[var(--text-secondary)]">
              {notification.preview}
            </p>
          )}
          <p className="dn-mono mt-2 text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
            {formatDate(notification.createdAt)}
          </p>
        </div>
      </div>
    </Link>
  );
}
