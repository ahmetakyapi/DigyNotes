"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { motion, useReducedMotion } from "framer-motion";
import {
  BookmarkSimpleIcon,
  MagnifyingGlassIcon,
  MinusCircleIcon,
  StarIcon,
} from "@phosphor-icons/react";
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
import { PageHeader, Em, Dot } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { WishlistItem } from "@/types";

const EASE = [0.16, 1, 0.3, 1] as const;
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
  const reduceMotion = useReducedMotion();
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
        <div className="w-full">
          <EmptyState
            icon={<BookmarkSimpleIcon size={22} weight="duotone" />}
            title={
              <>
                İstek Listen İçin <Em>Giriş Yap</Em>
              </>
            }
            description="Sonra izlemek, okumak ya da gitmek istediklerini kaydetmek için giriş yapman gerekiyor."
            primary={{ label: "Giriş Yap", href: "/login" }}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <PageHeader
        index="12"
        eyebrow="İstek Listesi"
        title={
          <>
            <Em>İstek Listen</Em>
            <Dot />
          </>
        }
        description="Sonra izlemek, okumak ya da gitmek istediklerini buraya ekle."
        stats={
          loading
            ? undefined
            : [
                { value: items.length, label: "Kayıt" },
                { value: populatedCategoryCount, label: "Kategori" },
              ]
        }
      />

      {/* ── Kategori seçimi + Arama ── */}
      <section className="mb-6">
        {/* LAYOUT: Pill category tabs (horizontal scroll on mobile) → search composer card → selected result strip. */}
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          {WATCHLIST_CATEGORIES.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={`flex shrink-0 cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium transition-colors duration-200 ${
                activeCategory === category
                  ? "border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--bg-base)]"
                  : "border-[var(--border)] bg-transparent text-[var(--text-secondary)] hover:border-[var(--text-faint)] hover:text-[var(--text-primary)]"
              }`}
            >
              {getCategoryLabel(category)}
              <span
                className={`dn-mono text-[10px] ${
                  activeCategory === category ? "opacity-60" : "text-[var(--text-faint)]"
                }`}
              >
                {String(countsByCategory[category] ?? 0).padStart(2, "0")}
              </span>
            </button>
          ))}
        </div>

        <div className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-card)] p-4 transition-colors duration-500 ease-out-expo focus-within:border-[var(--text-faint)] sm:p-5">
          <p className="dn-mono mb-3 text-[10.5px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
            {getCategoryLabel(activeCategory)} Ara ve Ekle
          </p>
          <MediaSearch
            category={activeCategory}
            lockedTab={getSearchTabForCategory(activeCategory) ?? "film"}
            onSelect={setSelectedResult}
            onAction={addToWatchlist}
            actionLabel={pendingExternalId ? "Ekleniyor..." : "Listeye Ekle"}
          />
        </div>

        {selectedResult && (
          <div className="mt-3 flex items-center gap-4 rounded-[22px] border border-[var(--border)] bg-[var(--bg-card)] p-4">
            {selectedResult.image ? (
              <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-[12px] border border-[var(--border)]">
                <ResilientImage
                  src={selectedResult.image}
                  alt={selectedResult.title}
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="dn-display flex h-20 w-14 shrink-0 items-center justify-center rounded-[12px] border border-[var(--border)] bg-[var(--bg-base)] text-2xl italic text-[var(--text-faint)]">
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
              className="inline-flex h-10 shrink-0 cursor-pointer items-center rounded-full bg-[var(--gold)] px-5 text-xs font-semibold text-[var(--text-on-accent)] transition-all duration-300 hover:bg-[var(--gold-light)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
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
        {/* LAYOUT: Section heading (mono count + grotesk title) left, search + sort pills right; 1/2/3 col poster cards. */}
        <div className="mb-5 mt-12 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="dn-mono text-[10.5px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
              {filteredItems.length}/{countsByCategory[activeCategory] ?? 0} kayıt
            </p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.03em] text-[var(--text-primary)]">
              {getCategoryLabel(activeCategory)} <Em>Listesi</Em>
            </h2>
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
                className="h-9 w-44 rounded-full border border-[var(--border)] bg-[var(--bg-card)] pl-8 pr-3 text-[16px] text-[var(--text-primary)] outline-none transition-colors focus:border-accent/40 focus:ring-1 focus:ring-accent/10 sm:text-xs"
              />
            </label>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as WatchlistSort)}
              className="h-9 cursor-pointer rounded-full border border-[var(--border)] bg-[var(--bg-card)] px-3 text-[16px] text-[var(--text-secondary)] outline-none transition-colors focus:border-accent/40 sm:text-xs"
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
                className="h-80 animate-pulse rounded-[24px] border border-[var(--border)] bg-[var(--bg-card)]"
              />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <EmptyState
            compact={Boolean(searchQuery.trim())}
            icon={
              searchQuery.trim() ? (
                <MagnifyingGlassIcon size={22} weight="duotone" />
              ) : (
                <BookmarkSimpleIcon size={22} weight="duotone" />
              )
            }
            title={
              searchQuery.trim() ? (
                <>
                  Aramana Uyan <Em>Kayıt</Em> Yok
                </>
              ) : (
                <>
                  {getCategoryLabel(activeCategory)} Listen Henüz <Em>Boş</Em>
                </>
              )
            }
            description={
              searchQuery.trim()
                ? "Başka bir kelime dene ya da aramayı temizle."
                : "Yukarıdaki aramayı kullanarak ilk kaydını ekleyebilirsin."
            }
            primary={
              searchQuery.trim()
                ? { label: "Aramayı Temizle", onClick: () => setSearchQuery("") }
                : undefined
            }
          />
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredItems.map((item, i) => (
              <motion.article
                key={item.id}
                initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: EASE, delay: Math.min(i, 8) * 0.05 }}
                className="group flex flex-col overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--bg-card)] transition-colors duration-500 ease-out-expo hover:border-[var(--text-faint)]"
              >
                <div className="relative h-56 overflow-hidden bg-[var(--bg-raised)]">
                  {item.image ? (
                    <ResilientImage
                      src={item.image}
                      alt={item.title}
                      fill
                      sizes="420px"
                      className="object-cover transition-transform duration-[1400ms] ease-out-expo group-hover:scale-[1.06]"
                    />
                  ) : (
                    <div className="dn-display flex h-full items-center justify-center bg-[radial-gradient(circle_at_top,_rgb(var(--gold-rgb)/0.12),_transparent_58%)] text-6xl italic text-[var(--text-faint)]">
                      {item.title.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[var(--bg-card)] to-transparent" />
                  <div className="absolute left-4 top-4 flex flex-wrap items-center gap-2">
                    <span className="dn-mono rounded-full border border-[var(--border)] bg-[var(--bg-overlay)] px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-[var(--text-primary)]">
                      {getCategoryLabel(item.category)}
                    </span>
                    <StatusBadge status={getPlannedLabel(normalizeCategory(item.category))} />
                  </div>
                  {typeof item.externalRating === "number" && item.externalRating > 0 && (
                    <div className="dn-mono absolute right-4 top-4 inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--bg-overlay)] px-2.5 py-1 text-[10.5px] text-[var(--text-primary)]">
                      <StarIcon size={10} weight="fill" className="text-[var(--gold)]" />
                      {item.externalRating.toFixed(1)}
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-3 px-5 pb-5 pt-1">
                  <div>
                    <h3 className="line-clamp-2 text-xl font-extrabold leading-tight tracking-[-0.03em] text-[var(--text-primary)]">
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
                  <div className="dn-mono mt-auto flex items-center justify-between border-t border-[var(--border)] pt-4 text-[10.5px] uppercase tracking-[0.12em] text-[var(--text-faint)]">
                    <span>Eklendi {formatDate(item.addedAt)}</span>
                    <span>{getPlannedLabel(normalizeCategory(item.category))}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    disabled={deletingId === item.id}
                    className="inline-flex h-9 w-full cursor-pointer items-center justify-center gap-1.5 rounded-full border border-[var(--border)] text-xs font-medium text-[var(--text-muted)] transition-colors duration-200 hover:border-[var(--danger)] hover:text-[var(--danger)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <MinusCircleIcon size={13} weight="bold" />
                    {deletingId === item.id ? "Kaldırılıyor..." : "Listeden Kaldır"}
                  </button>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </section>

      <section className="mt-14">
        <OrganizationGuide
          current="watchlist"
          title="İstek Listesi Ne İşe Yarar?"
          description="Henüz izlemediğin, okumadığın ya da gitmediğin şeyleri burada tutarsın. Sonra tekrar bakmak istediğin notlar için Kaydettiklerim'i, notlarını bir konu altında toplamak için Koleksiyonlar'ı kullan."
        />
      </section>
    </main>
  );
}
