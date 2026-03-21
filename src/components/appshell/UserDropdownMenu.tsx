"use client";
import React from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import {
  BellIcon,
  BookOpenIcon,
  BookmarkSimpleIcon,
  CalendarIcon,
  ChartBarIcon,
  GearIcon,
  MoonIcon,
  ShieldStarIcon,
  SignOutIcon,
  SunIcon,
  UserIcon,
} from "@phosphor-icons/react";

interface UserDropdownMenuProps {
  readonly session: {
    user?: { name?: string | null; email?: string | null } | null;
  };
  readonly userUsername: string | null;
  readonly userInitial: string;
  readonly isAdmin: boolean;
  readonly notificationCount: number;
  readonly theme: string;
  readonly toggleTheme: () => void;
  readonly onClose: () => void;
}

export function UserDropdownMenu({
  session,
  userUsername,
  userInitial,
  isAdmin,
  notificationCount,
  theme,
  toggleTheme,
  onClose,
}: UserDropdownMenuProps) {
  return (
    <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-56 overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-header)] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.4),0_20px_50px_-8px_rgba(0,0,0,0.6)]">
      {/* User info */}
      <div className="flex items-center gap-3 border-b border-[var(--border-header)] px-3.5 py-3">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-[#10b981]/20 bg-[#10b981]/10">
          <span className="text-xs font-bold text-[#34d399]">{userInitial}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold leading-tight text-[var(--text-primary)]">
            {session.user?.name}
          </p>
          <p className="mt-0.5 truncate text-[10px] leading-tight text-[var(--text-muted)]">
            {session.user?.email}
          </p>
        </div>
      </div>

      {/* Nav items */}
      <div className="py-1">
        {userUsername && (
          <DropdownLink href={`/profile/${userUsername}`} onClose={onClose} icon={<UserIcon size={14} />}>
            Profilim
          </DropdownLink>
        )}
        <DropdownLink href="/profile/settings" onClose={onClose} icon={<GearIcon size={14} />}>
          Ayarlar
        </DropdownLink>
      </div>

      {/* Mobile-only: Bildirimler & Tema — compact row */}
      <div className="flex items-center border-b border-t border-[var(--border-header)] sm:hidden">
        <Link
          href="/notifications"
          onClick={onClose}
          className="flex flex-1 items-center justify-center gap-2 py-2.5 text-[13px] text-[var(--text-secondary)] transition-colors duration-100 hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)]"
        >
          <span className="relative">
            <BellIcon size={15} weight={notificationCount > 0 ? "fill" : "regular"} />
            {notificationCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex min-w-[14px] items-center justify-center rounded-full bg-[#10b981] px-0.5 text-[8px] font-bold leading-[14px] text-white">
                {notificationCount > 9 ? "9+" : notificationCount}
              </span>
            )}
          </span>
          {" "}Bildirimler
        </Link>
        <div className="h-5 w-px bg-[var(--border-header)]" />
        <button
          onClick={() => {
            toggleTheme();
            onClose();
          }}
          className="flex flex-1 items-center justify-center gap-2 py-2.5 text-[13px] text-[var(--text-secondary)] transition-colors duration-100 hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)]"
        >
          {theme === "dark" ? <SunIcon size={15} /> : <MoonIcon size={15} />}
          {theme === "dark" ? "Açık Tema" : "Koyu Tema"}
        </button>
      </div>

      {/* Nav items continued */}
      <div className="py-1">
        <DropdownLink href="/collections" onClose={onClose} icon={<BookOpenIcon size={14} />}>
          Koleksiyonlar
        </DropdownLink>
        <DropdownLink href="/watchlist" onClose={onClose} icon={<BookmarkSimpleIcon size={14} />}>
          İstek Listesi
        </DropdownLink>
        <DropdownLink href="/stats" onClose={onClose} icon={<ChartBarIcon size={14} />}>
          İstatistikler
        </DropdownLink>
        <DropdownLink href="/stats/year-in-review" onClose={onClose} icon={<CalendarIcon size={14} />}>
          Yılın Özeti
        </DropdownLink>
      </div>

      {isAdmin && (
        <>
          <div className="border-t border-[var(--border-header)]" />
          <div className="py-1">
            <Link
              href="/admin"
              onClick={onClose}
              className="bg-[#10b981]/8 hover:bg-[#10b981]/14 mx-1 flex items-center gap-2.5 rounded-lg border border-[#10b981]/25 px-3 py-2 text-[13px] font-semibold text-[var(--gold)] transition-colors duration-100 hover:border-[#10b981]/40 hover:text-[var(--gold-light)]"
            >
              <ShieldStarIcon size={14} />
              Admin Paneli
              <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[var(--gold)] opacity-85 shadow-[0_0_0_3px_rgba(16,185,129,0.14)]" />
            </Link>
          </div>
        </>
      )}

      <div className="border-t border-[var(--border-header)]" />

      <div className="py-1">
        <button
          onClick={() => {
            localStorage.removeItem("dn_username");
            signOut({ callbackUrl: "/" });
          }}
          className="hover:bg-[var(--danger)]/5 flex w-full items-center gap-2.5 px-3.5 py-3 text-left text-[13px] text-[var(--text-muted)] transition-colors duration-100 hover:text-[var(--danger)]"
        >
          <SignOutIcon size={14} />
          Çıkış Yap
        </button>
      </div>
    </div>
  );
}

/* ── Dropdown link helper ── */
function DropdownLink({
  href,
  onClose,
  icon,
  children,
}: {
  readonly href: string;
  readonly onClose: () => void;
  readonly icon: React.ReactNode;
  readonly children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClose}
      className="flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-[var(--text-secondary)] transition-colors duration-100 hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)]"
    >
      {icon}
      {children}
    </Link>
  );
}
