"use client";

import Link from "next/link";
import {
  ORGANIZATION_SURFACES,
  OrganizationSurfaceDefinition,
  OrganizationSurfaceKey,
} from "@/lib/organization";

const SURFACE_ORDER: OrganizationSurfaceKey[] = ["bookmarks", "watchlist", "collections"];

export function OrganizationGuide({
  current,
  title = "Organizasyon katmanları",
  description = "Her yüzey farklı bir ihtiyacı çözer; hızlı kayıt, sonra bakma ve uzun vadeli gruplama aynı şey değil.",
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
    <section className="rounded-3xl border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-[var(--shadow-soft)] sm:p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{description}</p>
        </div>
        {currentSurface && (
          <span className="inline-flex w-fit items-center rounded-full border border-[var(--gold)]/24 bg-[var(--gold)]/10 px-3 py-1 text-[11px] font-medium text-[var(--gold)]">
            Şu an: {currentSurface.label}
          </span>
        )}
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-base)] divide-y divide-[var(--border)]">
        {surfaces.map((surface) => {
          const isCurrent = current === surface.key;

          return (
            <div
              key={surface.key}
              className={`grid gap-3 px-4 py-4 transition-colors sm:grid-cols-[140px_minmax(0,1fr)_auto] sm:items-center ${
                isCurrent
                  ? "bg-[var(--gold)]/8"
                  : "bg-transparent"
              }`}
            >
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-faint)]">
                  {surface.shortLabel}
                </p>
                <h3 className="mt-1 text-base font-semibold text-[var(--text-primary)]">
                  {surface.label}
                </h3>
              </div>
              <p className="text-sm leading-6 text-[var(--text-secondary)]">
                {surface.description}
              </p>
              <div className="flex items-center sm:justify-end">
                {isCurrent ? (
                  <span className="rounded-full border border-[var(--gold)]/30 px-2.5 py-1 text-[10px] font-semibold text-[var(--gold)]">
                    Buradasın
                  </span>
                ) : (
                  <Link
                    href={surface.href}
                    className="inline-flex text-sm font-medium text-[var(--gold)] transition-colors hover:text-[var(--gold-light)]"
                  >
                    {surface.cta} →
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
