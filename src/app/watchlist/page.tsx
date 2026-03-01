"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import {
  BookmarkSimple,
  MagnifyingGlass,
  Sparkle,
} from "@phosphor-icons/react";
import {
  FIXED_CATEGORIES,
  getCategoryLabel,
  getSearchTabForCategory,
  normalizeCategory,
} from "@/lib/categories";
import { ORGANIZATION_SURFACES } from "@/lib/organization";
import {
  getClientErrorMessage,
  isAuthenticationError,
  requestJson,
} from "@/lib/client-api";
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
            className="mt-4 inline-flex rounded-xl bg-[var(--gold)] px-4 py-2 text-sm font-semibold text-[var(--text-on-accent)]"
          >
            Giriş Yap
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header
        className="mb-6 rounded-[32px] border border-[var(--border)] p-6 shadow-[var(--shadow-soft)] sm:p-7"
        style={{
          background:
            "radial-gradient(circle at top left, rgba(196,162,75,0.12), transparent 30%), var(--bg-card)",
        }}
      >
        <span className="bg-[#c4a24b]/8 inline-flex rounded-full border border-[#c4a24b]/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--gold)]">
          İstek Listesi
        </span>
        <h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-[-0.03em] text-[var(--text-primary)] sm:text-4xl">
          Sonra Dönmek İstediklerini Kaydet
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)] sm:text-[15px]">
          Film, dizi, kitap, oyun ve gezi planlarını tek yerde topla. Kategori seçip ara, sonra
          gerektiğinde kolayca geri dön.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <span className="rounded-full border border-[var(--border)] bg-[var(--bg-raised)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)]">
            {items.length} kayıt
          </span>
          <span className="rounded-full border border-[var(--border)] bg-[var(--bg-raised)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)]">
            {getCategoryLabel(activeCategory)}: {countsByCategory[activeCategory] ?? 0}
          </span>
          <span className="rounded-full border border-[var(--border)] bg-[var(--bg-raised)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)]">
            {populatedCategoryCount} dolu kategori
          </span>
        </div>
      </header>

      <section className="rounded-[32px] border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-[var(--shadow-soft)] sm:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--gold)]">
              İlk aksiyon
            </p>
            <h2 className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
              Kategori seç, ara ve ekle
            </h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Önce kategoriyi belirle, sonra arama sonucunu tek dokunuşla istek listesine ekle.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 self-start rounded-full border border-[var(--border)] bg-[var(--bg-base)] px-3 py-1.5 text-xs text-[var(--text-secondary)]">
            <Sparkle size={14} weight="duotone" className="text-[var(--gold)]" />
            Şu an: {getCategoryLabel(activeCategory)}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full border border-[var(--gold)]/20 bg-[var(--gold)]/8 px-3 py-1 text-[11px] font-medium text-[var(--gold)]">
            1. Kategori
          </span>
          <span className="rounded-full border border-[var(--border)] bg-[var(--bg-base)] px-3 py-1 text-[11px] font-medium text-[var(--text-secondary)]">
            2. Ara
          </span>
          <span className="rounded-full border border-[var(--border)] bg-[var(--bg-base)] px-3 py-1 text-[11px] font-medium text-[var(--text-secondary)]">
            3. Listeye ekle
          </span>
        </div>

        <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
          {WATCHLIST_CATEGORIES.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={`min-w-[144px] rounded-2xl border px-4 py-3 text-left transition-colors ${
                activeCategory === category
                  ? "border-[#c4a24b]/28 bg-[#c4a24b]/10 text-[var(--text-primary)]"
                  : "hover:border-[#c4a24b]/18 border-[var(--border)] bg-[var(--bg-base)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold">{getCategoryLabel(category)}</span>
                <span className="text-xs text-[var(--text-faint)]">
                  {countsByCategory[category] ?? 0}
                </span>
              </div>
              <p className="mt-2 text-xs text-[var(--text-faint)]">{getPlannedLabel(category)}</p>
            </button>
          ))}
        </div>

        <div className="mt-5 rounded-[28px] border border-[var(--border)] bg-[var(--bg-base)] p-4 sm:p-5">
          <MediaSearch
            category={activeCategory}
            lockedTab={getSearchTabForCategory(activeCategory) ?? "film"}
            onSelect={setSelectedResult}
            onAction={addToWatchlist}
            actionLabel={pendingExternalId ? "Ekleniyor..." : "İstek listesine ekle"}
          />
        </div>

        {selectedResult && (
          <div className="mt-4 rounded-[28px] border border-[var(--border)] bg-[var(--bg-raised)] p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              {selectedResult.image ? (
                <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-2xl border border-[var(--border)]">
                  <ResilientImage
                    src={selectedResult.image}
                    alt={selectedResult.title}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-24 w-20 shrink-0 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--bg-base)] text-xl font-semibold text-[var(--text-faint)]">
                  {selectedResult.title.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-[#c4a24b]/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--gold)]">
                    {getCategoryLabel(activeCategory)}
                  </span>
                  <StatusBadge status={getPlannedLabel(activeCategory)} />
                </div>
                <h3 className="mt-3 line-clamp-2 text-lg font-semibold text-[var(--text-primary)]">
                  {selectedResult.title}
                </h3>
                {(selectedResult.creator || selectedResult.years) && (
                  <p className="mt-1 text-sm text-[var(--text-muted)]">
                    {[selectedResult.creator, selectedResult.years].filter(Boolean).join(" · ")}
                  </p>
                )}
                {selectedResult.excerpt && (
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--text-secondary)]">
                    {selectedResult.excerpt}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => addToWatchlist(selectedResult)}
                disabled={pendingExternalId !== null || isSelectedResultSaved}
                className="rounded-xl bg-[var(--gold)] px-4 py-3 text-sm font-semibold text-[var(--text-on-accent)] transition-colors hover:bg-[var(--gold-light)] disabled:opacity-50"
              >
                {isSelectedResultSaved
                  ? "İstek listesinde"
                  : pendingExternalId !== null
                    ? "Ekleniyor..."
                    : "İstek listesine ekle"}
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="mt-8">
        <div className="mb-4 rounded-[28px] border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-[var(--shadow-soft)]">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                {getCategoryLabel(activeCategory)} Listesi
              </h2>
              <p className="mt-1 text-sm text-[var(--text-faint)]">
                {filteredItems.length}/{countsByCategory[activeCategory] ?? 0} içerik
              </p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
              <label className="relative block w-full sm:min-w-[260px]">
                <MagnifyingGlass
                  size={16}
                  weight="bold"
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]"
                />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Liste içinde ara..."
                  className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-base)] pl-10 pr-3 text-[16px] text-[var(--text-primary)] outline-none transition-colors focus:border-[#c4a24b]/45 sm:text-sm"
                />
              </label>
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as WatchlistSort)}
                className="h-11 rounded-xl border border-[var(--border)] bg-[var(--bg-base)] px-3 text-[16px] text-[var(--text-primary)] outline-none transition-colors focus:border-[#c4a24b]/45 sm:text-sm"
              >
                <option value="recent">En yeni eklenen</option>
                <option value="title">Başlığa göre</option>
                <option value="rating">Puana göre</option>
              </select>
              {searchQuery.trim() && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="h-11 rounded-xl border border-[var(--border)] px-3 text-sm text-[var(--text-secondary)] transition-colors hover:border-[#c4a24b]/35 hover:text-[var(--gold)]"
                >
                  Temizle
                </button>
              )}
            </div>
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
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#c4a24b]/10 text-[var(--gold)]">
              <BookmarkSimple size={24} weight="duotone" />
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
                className="hover:border-[#c4a24b]/18 group overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--bg-card)] shadow-[var(--shadow-soft)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[var(--shadow-card)]"
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
                    <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(196,162,75,0.14),_transparent_58%)] text-5xl font-semibold text-[var(--text-faint)]">
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
                    <span className="border-[#c4a24b]/18 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--gold)] backdrop-blur-sm" style={{ background: "var(--bg-overlay)" }}>
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
