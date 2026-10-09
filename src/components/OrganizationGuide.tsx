"use client";

import Link from "next/link";
import { ArrowRightIcon } from "@phosphor-icons/react";
import {
  ORGANIZATION_SURFACES,
  OrganizationSurfaceDefinition,
  OrganizationSurfaceKey,
} from "@/lib/organization";

const SURFACE_ORDER: OrganizationSurfaceKey[] = ["bookmarks", "watchlist", "collections"];

/*
  LAYOUT: Calm editorial explainer — no boxed panel.
  TOP: hairline, then mono eyebrow "Organizasyon" + optional "Şu an" marker on the right,
       Title Case heading and a one-paragraph description.
  ROWS: one row per surface separated by hairlines —
        [mono index + short label] [label + description] [CTA link | "Buradasın" marker].
*/
export function OrganizationGuide({
  current,
  title = "Neyi Nereye Kaydetmeli?",
  description = "Kaydettiklerim, İstek Listesi ve Koleksiyonlar farklı işler görür. Hangisi ne işe yarar, kısaca burada.",
}: {
  current?: OrganizationSurfaceKey;
  title?: string;
  description?: string;
}) {
  const surfaces: OrganizationSurfaceDefinition[] = SURFACE_ORDER.map(
    (key) => ORGANIZATION_SURFACES[key]
  );
  const currentSurface = current ? ORGANIZATION_SURFACES[current] : null;

  return (
    <section className="border-t border-[var(--border)] pt-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <p className="dn-mono text-[10.5px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
            Düzenleme
          </p>
          <h2 className="mt-3 text-xl font-extrabold tracking-[-0.03em] text-[var(--text-primary)] sm:text-2xl">
            {title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{description}</p>
        </div>
        {currentSurface && (
          <span className="dn-mono inline-flex w-fit items-center gap-2 text-[10.5px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
            Şu an: {currentSurface.label}
          </span>
        )}
      </div>

      <ul className="mt-6 divide-y divide-[var(--border)] border-y border-[var(--border)]">
        {surfaces.map((surface, index) => {
          const isCurrent = current === surface.key;

          return (
            <li
              key={surface.key}
              className="grid gap-2 py-5 sm:grid-cols-[160px_minmax(0,1fr)_auto] sm:items-baseline sm:gap-6"
            >
              <p className="dn-mono text-[10.5px] uppercase tracking-[0.16em] text-[var(--text-faint)]">
                <span className={isCurrent ? "text-[var(--gold)]" : ""}>
                  ({String(index + 1).padStart(2, "0")})
                </span>{" "}
                {surface.shortLabel}
              </p>
              <div className="min-w-0">
                <h3
                  className={`text-base font-bold tracking-[-0.02em] ${
                    isCurrent ? "text-[var(--gold)]" : "text-[var(--text-primary)]"
                  }`}
                >
                  {surface.label}
                </h3>
                <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
                  {surface.description}
                </p>
              </div>
              <div className="flex items-center sm:justify-end">
                {isCurrent ? (
                  <span className="dn-mono text-[10.5px] uppercase tracking-[0.16em] text-[var(--gold)]">
                    Buradasın
                  </span>
                ) : (
                  <Link
                    href={surface.href}
                    className="group inline-flex items-center gap-1.5 text-sm font-medium text-[var(--text-secondary)] transition-colors duration-200 hover:text-[var(--text-primary)]"
                  >
                    {surface.cta}
                    <ArrowRightIcon
                      size={13}
                      weight="bold"
                      className="transition-transform duration-500 ease-out-expo group-hover:translate-x-0.5"
                    />
                  </Link>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
