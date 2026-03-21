"use client";
import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileTextIcon,
  NavigationArrowIcon,
  StarIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react";

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
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border-header)] bg-[var(--bg-header)] backdrop-blur-xl sm:hidden">
      <div
        className="mx-auto flex max-w-xl items-center gap-1 px-1.5"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <MobileTab href="/notes" active={isNotes} label="Notlarım" icon={<FileTextIcon size={18} />} />
        <MobileTab href="/feed" active={isFeed} label="Akış" icon={<NavigationArrowIcon size={18} />} />
        <MobileTab href="/recommended" active={isRecommended} label="Öneriler" icon={<StarIcon size={18} />} />
        <MobileTab href="/discover" active={isDiscover} label="Keşfet" icon={<UsersThreeIcon size={18} />} />
        <button
          onClick={() =>
            router.push(userUsername ? `/profile/${userUsername}` : "/profile/settings")
          }
          className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-2.5 transition-all duration-150 ${
            isProfile ? "bg-[#10b981]/12 text-[#34d399]" : "text-[var(--text-secondary)]"
          }`}
        >
          <div
            className={`flex h-[18px] w-[18px] items-center justify-center rounded-full text-[9px] font-bold transition-colors duration-150 ${
              isProfile
                ? "bg-[#10b981]/20 text-[#34d399] ring-1 ring-[#10b981]/50"
                : "bg-[var(--bg-raised)] text-[var(--text-muted)] ring-1 ring-[var(--border)]"
            }`}
          >
            {userInitial}
          </div>
          <span className="text-[10px] font-medium">Profil</span>
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
      className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-2.5 transition-all duration-150 ${
        active ? "bg-[#10b981]/12 text-[#34d399]" : "text-[var(--text-secondary)]"
      }`}
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </Link>
  );
}
