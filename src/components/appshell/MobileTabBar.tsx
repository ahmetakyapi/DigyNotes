"use client";
import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileTextIcon, NavigationArrowIcon, StarIcon, UsersThreeIcon } from "@phosphor-icons/react";

interface MobileTabBarProps {
  readonly isNotes: boolean;
  readonly isFeed: boolean;
  readonly isRecommended: boolean;
  readonly isDiscover: boolean;
  readonly isProfile: boolean;
  readonly userInitial: string;
  readonly userUsername: string | null;
}

export function MobileTabBar({
  isNotes,
  isFeed,
  isRecommended,
  isDiscover,
  isProfile,
  userInitial,
  userUsername,
}: MobileTabBarProps) {
  const router = useRouter();

  return (
    <nav
      className="fixed inset-x-3 z-40 sm:hidden"
      style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 10px)" }}
    >
      <div className="mx-auto flex max-w-xl items-center gap-1 rounded-[22px] border border-[var(--border)] bg-[var(--header-glass)] p-1.5 shadow-[0_20px_40px_-16px_rgb(var(--ink-rgb)/0.55)] backdrop-blur-2xl backdrop-saturate-150">
        <MobileTab
          href="/notes"
          active={isNotes}
          label="Notlarım"
          icon={<FileTextIcon size={18} />}
        />
        <MobileTab
          href="/feed"
          active={isFeed}
          label="Akış"
          icon={<NavigationArrowIcon size={18} />}
        />
        <MobileTab
          href="/recommended"
          active={isRecommended}
          label="Öneriler"
          icon={<StarIcon size={18} />}
        />
        <MobileTab
          href="/discover"
          active={isDiscover}
          label="Keşfet"
          icon={<UsersThreeIcon size={18} />}
        />
        <button
          onClick={() =>
            router.push(userUsername ? `/profile/${userUsername}` : "/profile/settings")
          }
          className={`flex flex-1 flex-col items-center gap-0.5 rounded-2xl py-2 transition-all duration-300 ease-out-expo ${
            isProfile ? "bg-[var(--gold)] text-[var(--text-on-accent)]" : "text-[var(--text-muted)] active:text-[var(--text-primary)]"
          }`}
        >
          <div
            className={`flex h-[18px] w-[18px] items-center justify-center rounded-full text-[9px] font-bold transition-colors duration-150 ${
              isProfile
                ? "bg-[var(--text-on-accent)] text-[var(--gold)]"
                : "bg-[var(--bg-raised)] text-[var(--text-muted)] ring-1 ring-[var(--border)]"
            }`}
          >
            {userInitial}
          </div>
          <span className="text-[10px] font-semibold tracking-[0.01em]">Profil</span>
        </button>
      </div>
    </nav>
  );
}

function MobileTab({
  href,
  active,
  label,
  icon,
}: {
  readonly href: string;
  readonly active: boolean;
  readonly label: string;
  readonly icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`flex flex-1 flex-col items-center gap-0.5 rounded-2xl py-2 transition-all duration-300 ease-out-expo ${
        active ? "bg-[var(--gold)] text-[var(--text-on-accent)]" : "text-[var(--text-muted)] active:text-[var(--text-primary)]"
      }`}
    >
      {icon}
      <span className="text-[10px] font-semibold tracking-[0.01em]">{label}</span>
    </Link>
  );
}
