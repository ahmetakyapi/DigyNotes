"use client";
import React from "react";
import Link from "next/link";
import { NavigationArrowIcon, StarIcon, UsersThreeIcon } from "@phosphor-icons/react";

interface DesktopGlobalNavProps {
  readonly isFeed: boolean;
  readonly isRecommended: boolean;
  readonly isDiscover: boolean;
}

export function DesktopGlobalNav({ isFeed, isRecommended, isDiscover }: DesktopGlobalNavProps) {
  return (
    <div className="flex flex-shrink-0 items-center gap-0.5 px-1">
      <NavLink href="/feed" active={isFeed} icon={<NavigationArrowIcon size={11} />}>
        Akış
      </NavLink>
      <NavLink href="/recommended" active={isRecommended} icon={<StarIcon size={11} />}>
        Öneriler
      </NavLink>
      <NavLink href="/discover" active={isDiscover} icon={<UsersThreeIcon size={11} />}>
        Keşfet
      </NavLink>
    </div>
  );
}

function NavLink({
  href,
  active,
  icon,
  children,
}: {
  readonly href: string;
  readonly active: boolean;
  readonly icon: React.ReactNode;
  readonly children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`flex flex-shrink-0 items-center gap-1 whitespace-nowrap border-b-2 px-2.5 pb-[11px] pt-[10px] text-[13px] font-semibold transition-all duration-150 ${
        active
          ? "border-[#10b981] text-[var(--text-primary)]"
          : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      }`}
    >
      {icon}
      {children}
    </Link>
  );
}
