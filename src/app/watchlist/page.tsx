"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { BookmarkSimpleIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";
import {
  FIXED_CATEGORIES,
  getCategoryLabel,
  getSearchTabForCategory,
  normalizeCategory,
} from "@/lib/categories";
import { ORGANIZATION_SURFACES } from "@/lib/organization";
import { getClientErrorMessage, isAuthenticationError, requestJson } from "@/lib/client-api";
import { OrganizationGuide } from "@/components/OrganizationGuide";
import { MediaSearch, MediaSearchResult } from "@/components/MediaSearch";
import { ResilientImage } from "@/components/ResilientImage";
import { StatusBadge, getStatusOptions } from "@/components/StatusBadge";
import { WishlistItem } from "@/types";
const WATCHLIST_CATEGORIES = FIXED_CATEGORIES.filter((category) => category !== "other");
type WatchlistSort = "recent" | "title" | "rating";
const WATCHLIST_LABEL = ORGANIZATION_SURFACES.watchlist.label;

function getPlannedLabel(category: string) {
  const options = getStatusOptions(category);
  return options[options.length - 1] ?? "Planlandı";
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function WatchlistPage() {
  const router = useRouter();
  const { status } = useSession();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [activeCategory, setActiveCategory] =
    useState<(typeof WATCHLIST_CATEGORIES)[number]>("movies");
  const [selectedResult, setSelectedResult] = useState<MediaSearchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingExternalId, setPendingExternalId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<WatchlistSort>("recent");

  useEffect(() => {
    if (status === "unauthenticated") {
      setLoading(false);
      return;
    }

    if (status !== "authenticated") {
      return;
    }

    fetch("/api/watchlist")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        const nextItems = Array.isArray(data) ? data : [];
        setItems(nextItems);
        const firstCategoryWithItems = WATCHLIST_CATEGORIES.find((category) =>
          nextItems.some((item) => normalizeCategory(item.category) === category)
        );
        if (firstCategoryWithItems) {
          setActiveCategory(firstCategoryWithItems);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [status]);

  useEffect(() => {
    setSelectedResult(null);
    setSearchQuery("");
  }, [activeCategory]);

  const countsByCategory = useMemo(
    () =>
      WATCHLIST_CATEGORIES.reduce(
        (acc, category) => {
          acc[category] = items.filter(
            (item) => normalizeCategory(item.category) === category
          ).length;
          return acc;
        },
        {} as Record<(typeof WATCHLIST_CATEGORIES)[number], number>
      ),
    [items]
  );

  const populatedCategoryCount = useMemo(
    () => WATCHLIST_CATEGORIES.filter((category) => (countsByCategory[category] ?? 0) > 0).length,
    [countsByCategory]
  );

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const nextItems = items.filter((item) => {
      if (normalizeCategory(item.category) !== activeCategory) return false;
      if (!query) return true;

      return [item.title, item.creator ?? "", item.excerpt ?? "", item.years ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });

    return nextItems.sort((left, right) => {
      if (sortBy === "title") {
        return left.title.localeCompare(right.title, "tr");
      }

      if (sortBy === "rating") {
        return (right.externalRating ?? 0) - (left.externalRating ?? 0);
      }

      return new Date(right.addedAt).getTime() - new Date(left.addedAt).getTime();
    });
  }, [activeCategory, items, searchQuery, sortBy]);

  const getResultExternalId = (result: MediaSearchResult) =>
    result.externalId || `${activeCategory}:${result.title}:${result.years ?? ""}`;

  const isSelectedResultSaved = Boolean(
    selectedResult &&
    items.some(
      (item) =>
        normalizeCategory(item.category) === activeCategory &&
        item.externalId === getResultExternalId(selectedResult)
    )
  );

  const addToWatchlist = async (result: MediaSearchResult) => {
    const externalId = getResultExternalId(result);

    if (
      items.some(
        (item) =>
          normalizeCategory(item.category) === activeCategory && item.externalId === externalId
      )
    ) {
      setSelectedResult(result);
      toast(`Bu içerik zaten ${WATCHLIST_LABEL.toLocaleLowerCase("tr-TR")}nde`);
      return;
    }
    setPendingExternalId(externalId);

    try {
      const data = await requestJson<WishlistItem>(
        "/api/watchlist",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category: activeCategory,
            title: result.title,
            creator: result.creator,
            years: result.years,
            image: result.image,
            excerpt: result.excerpt,
            externalRating: result.externalRating ?? null,
            externalId,
          }),
        },
        `${WATCHLIST_LABEL} kaydı eklenemedi.`
      );

      setItems((prev) => {
        const next = prev.filter((item) => item.id !== data.id);
        return [data, ...next];
      });
      setSelectedResult(result);
      toast.success(`${WATCHLIST_LABEL}ne eklendi`);
    } catch (error) {
      toast.error(getClientErrorMessage(error, `${WATCHLIST_LABEL} kaydı eklenemedi.`));
      if (isAuthenticationError(error)) {
        router.push("/login");
      }
    } finally {
      setPendingExternalId(null);
    }
  };

  const removeItem = async (id: string) => {
    setDeletingId(id);
    try {
      await requestJson<{ success: boolean }>(
        `/api/watchlist/${id}`,
        { method: "DELETE" },
        `${WATCHLIST_LABEL} kaydı silinemedi.`
      );
      setItems((prev) => prev.filter((item) => item.id !== id));
      toast.success(`${WATCHLIST_LABEL}nden kaldırıldı`);
    } catch (error) {
      toast.error(getClientErrorMessage(error, `${WATCHLIST_LABEL} kaydı silinemedi.`));
      if (isAuthenticationError(error)) {
        router.push("/login");
      }
    } finally {
      setDeletingId(null);
    }
  };

  if (status === "unauthenticated") {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center px-4">
        <div className="w-full rounded-3xl border border-[var(--border)] bg-[var(--bg-card)] p-8 text-center shadow-[var(--shadow-soft)]">
          <p className="text-sm text-[var(--text-secondary)]">
            İstek listesi oluşturmak ve sonra bakacaklarını takip etmek için giriş yap.
          </p>
          <Link
            href="/login"
            className="mt-4 inline-flex rounded-xl bg-gradient-to-r from-[#10b981] via-[#059669] to-[#047857] px-4 py-2 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(16,185,129,0.28)] transition-all hover:brightness-110"
          >
            Giriş Yap
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* ── Header ── */}
      <header className="mb-6">
        <div className="flex items-baseline justify-between gap-4">
          <div className="flex items-baseline gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              İstek Listesi
            </h1>
            {!loading && (
              <span className="text-sm text-[var(--text-muted)]">
                {items.length} kayıt · {populatedCategoryCount} kategori
              </span>
            )}
          </div>
        </div>
        <div className="mt-3 h-px w-full bg-[var(--border)]" />
      </header>

      {/* ── Kategori seçimi + Arama ── */}
      <section className="mb-6">
        <div className="mb-4 flex gap-2 overflow-x-auto">
          {WATCHLIST_CATEGORIES.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={`flex shrink-0 items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-medium transition-colors duration-200 ${
                activeCategory === category
                  ? "border-[#10b981]/30 bg-[#10b981]/10 text-[var(--text-primary)]"
                  : "border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:border-[#10b981]/20 hover:text-[var(--text-primary)]"
              }`}
            >
              {getCategoryLabel(category)}
              <span className="text-[var(--text-faint)]">{countsByCategory[category] ?? 0}</span>
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
          <MediaSearch
            category={activeCategory}
            lockedTab={getSearchTabForCategory(activeCategory) ?? "film"}
            onSelect={setSelectedResult}
            onAction={addToWatchlist}
            actionLabel={pendingExternalId ? "Ekleniyor..." : "Listeye ekle"}
          />
        </div>

        {selectedResult && (
          <div className="mt-3 flex items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
            {selectedResult.image ? (
              <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-lg border border-[var(--border)]">
                <ResilientImage
                  src={selectedResult.image}
                  alt={selectedResult.title}
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex h-20 w-14 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg-base)] text-lg font-semibold text-[var(--text-faint)]">
                {selectedResult.title.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="line-clamp-1 text-sm font-semibold text-[var(--text-primary)]">
                {selectedResult.title}
              </h3>
              {(selectedResult.creator || selectedResult.years) && (
                <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                  {[selectedResult.creator, selectedResult.years].filter(Boolean).join(" · ")}
                </p>
              )}
              {selectedResult.excerpt && (
                <p className="mt-1 line-clamp-1 text-xs text-[var(--text-secondary)]">
                  {selectedResult.excerpt}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => addToWatchlist(selectedResult)}
              disabled={pendingExternalId !== null || isSelectedResultSaved}
              className="shrink-0 rounded-lg bg-[#10b981] px-4 py-2 text-xs font-medium text-white transition-colors duration-200 hover:bg-[#059669] active:scale-95 disabled:opacity-50"
            >
              {isSelectedResultSaved
                ? "Listede"
                : pendingExternalId !== null
                  ? "Ekleniyor..."
                  : "Ekle"}
            </button>
          </div>
        )}
      </section>

      {/* ── Liste ── */}
      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-2">
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              {getCategoryLabel(activeCategory)} Listesi
            </h2>
            <span className="text-xs text-[var(--text-muted)]">
              {filteredItems.length}/{countsByCategory[activeCategory] ?? 0}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <label className="relative block">
              <MagnifyingGlassIcon
                size={14}
                weight="bold"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
              />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Ara..."
                className="h-9 w-44 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] pl-8 pr-3 text-[16px] text-[var(--text-primary)] outline-none transition-colors focus:border-[#10b981]/40 focus:ring-1 focus:ring-[#10b981]/10 sm:text-xs"
              />
            </label>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as WatchlistSort)}
              className="h-9 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-2 text-[16px] text-[var(--text-secondary)] outline-none transition-colors focus:border-[#10b981]/40 sm:text-xs"
            >
              <option value="recent">Yeni</option>
              <option value="title">A-Z</option>
              <option value="rating">Puan</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-64 animate-pulse rounded-[28px] border border-[var(--border)] bg-[var(--bg-card)]"
              />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-[var(--border)] bg-[var(--bg-card)] px-6 py-16 text-center shadow-[var(--shadow-soft)]">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#10b981]/10 text-[var(--gold)]">
              <BookmarkSimpleIcon size={24} weight="duotone" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-[var(--text-primary)]">
              {searchQuery.trim()
                ? "Aramana uyan kayıt bulunamadı."
                : "Bu kategori için henüz kayıt yok."}
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--text-secondary)]">
              {searchQuery.trim()
                ? "Daha farklı bir anahtar kelime deneyebilir veya aramayı temizleyebilirsin."
                : "Yukarıdan arama yaparak bu kategoriye ilk kaydını ekleyebilirsin."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredItems.map((item) => (
              <article
                key={item.id}
                className="hover:border-[#10b981]/18 group overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--bg-card)] shadow-[var(--shadow-soft)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[var(--shadow-card)]"
              >
                <div className="relative h-52 bg-[var(--bg-raised)]">
                  {item.image ? (
                    <ResilientImage
                      src={item.image}
                      alt={item.title}
                      fill
                      sizes="420px"
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.12),_transparent_58%)] text-5xl font-semibold text-[var(--text-faint)]">
                      {item.title.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(180deg, transparent 10%, var(--media-overlay-mid) 68%, var(--media-overlay-strong) 100%)",
                    }}
                  />
                  <div className="absolute left-4 top-4 flex flex-wrap items-center gap-2">
                    <span
                      className="border-[#10b981]/18 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--gold)] backdrop-blur-sm"
                      style={{ background: "var(--bg-overlay)" }}
                    >
                      {getCategoryLabel(item.category)}
                    </span>
                    <StatusBadge status={getPlannedLabel(normalizeCategory(item.category))} />
                  </div>
                  {typeof item.externalRating === "number" && item.externalRating > 0 && (
                    <div
                      className="absolute right-4 top-4 rounded-full px-2.5 py-1 text-[11px] font-semibold text-[var(--media-text-primary)] backdrop-blur-sm"
                      style={{ background: "var(--bg-overlay)" }}
                    >
                      {item.externalRating.toFixed(1)}
                    </div>
                  )}
                </div>
                <div className="space-y-4 p-5">
                  <div>
                    <h3 className="line-clamp-2 text-xl font-semibold text-[var(--text-primary)]">
                      {item.title}
                    </h3>
                    {(item.creator || item.years) && (
                      <p className="mt-1 text-sm text-[var(--text-muted)]">
                        {[item.creator, item.years].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                  {item.excerpt && (
                    <p className="line-clamp-3 text-sm leading-6 text-[var(--text-secondary)]">
                      {item.excerpt}
                    </p>
                  )}
                  <div className="flex items-center justify-between border-t border-[var(--border)] pt-4 text-xs text-[var(--text-faint)]">
                    <span>Eklendi {formatDate(item.addedAt)}</span>
                    <span>{getPlannedLabel(normalizeCategory(item.category))}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    disabled={deletingId === item.id}
                    className="border-[#e53e3e]/18 hover:bg-[#e53e3e]/8 w-full rounded-xl border px-3 py-2.5 text-xs font-semibold text-[#e67a7a] transition-colors disabled:opacity-50"
                  >
                    {deletingId === item.id ? "Kaldırılıyor..." : "İstek listesinden kaldır"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="mt-8">
        <OrganizationGuide
          current="watchlist"
          title="İstek listesi ne zaman doğru yer?"
          description="Henüz nota dönüştürmediğin içerikler burada bekler. Hızlı geri dönüş için Kaydettiklerim'i, bitmiş notları kalıcı seçkilerde toplamak için Koleksiyonlar'ı kullan."
        />
      </section>
    </main>
  );
}
