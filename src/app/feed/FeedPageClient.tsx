"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import toast from "react-hot-toast";
import {
  ArrowDownIcon,
  ArrowRightIcon,
  CompassIcon,
  FireIcon,
  SparkleIcon,
  UsersThreeIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { getClientErrorMessage, requestJson } from "@/lib/client-api";
import { FEED_DEFAULT_LIMIT, parseFeedTab, type FeedPost, type FeedTab } from "@/lib/feed";
import { PageHeader, Em } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { FeedCard } from "@/components/feed/FeedCard";
import { FeedSkeleton } from "@/components/feed/FeedSkeleton";
import { FeedTabs } from "@/components/feed/FeedTabs";

const EASE = [0.16, 1, 0.3, 1] as const;
const OWN_STORAGE_KEY = "dn_feed_own";
/** Below this many following items the popular preview fills the page. */
const PREVIEW_THRESHOLD = 5;
const PREVIEW_COUNT = 3;

type TabStatus = "idle" | "loading" | "ready" | "error" | "unauthorized";

interface TabState {
  items: FeedPost[];
  nextCursor: string | null;
  status: TabStatus;
  loadingMore: boolean;
  moreFailed: boolean;
}

const EMPTY_TAB: TabState = {
  items: [],
  nextCursor: null,
  status: "idle",
  loadingMore: false,
  moreFailed: false,
};

const INITIAL_TABS: Record<FeedTab, TabState> = {
  following: EMPTY_TAB,
  popular: EMPTY_TAB,
  latest: EMPTY_TAB,
};

class FeedUnauthorizedError extends Error {}

export default function FeedPageClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = parseFeedTab(searchParams.get("tab"));
  const reduce = useReducedMotion();

  const [tabs, setTabs] = useState(INITIAL_TABS);
  /** null until localStorage has been read, so the first request uses the saved choice. */
  const [showOwn, setShowOwn] = useState<boolean | null>(null);
  /** Authors followed from this page keep their (now "Takipte") button visible. */
  const [followedHere, setFollowedHere] = useState<Set<string>>(() => new Set());

  const tabsRef = useRef(tabs);
  tabsRef.current = tabs;
  const generationRef = useRef<Record<FeedTab, number>>({ following: 0, popular: 0, latest: 0 });
  const pendingLikesRef = useRef<Set<string>>(new Set());
  const sentinelRef = useRef<HTMLDivElement>(null);

  const patchTab = useCallback((tab: FeedTab, patch: Partial<TabState>) => {
    setTabs((prev) => ({ ...prev, [tab]: { ...prev[tab], ...patch } }));
  }, []);

  /** Same note can sit in several tabs; keep them in sync. */
  const patchPosts = useCallback((match: (post: FeedPost) => boolean, patch: Partial<FeedPost>) => {
    setTabs((prev) => {
      const next = { ...prev };
      for (const tab of Object.keys(prev) as FeedTab[]) {
        next[tab] = {
          ...prev[tab],
          items: prev[tab].items.map((post) => (match(post) ? { ...post, ...patch } : post)),
        };
      }
      return next;
    });
  }, []);

  const fetchPage = useCallback(async (tab: FeedTab, cursor: string | null, own: boolean) => {
    const params = new URLSearchParams({ tab, limit: String(FEED_DEFAULT_LIMIT) });
    if (cursor) params.set("cursor", cursor);
    if (tab === "following") params.set("own", own ? "1" : "0");

    const response = await fetch(`/api/feed?${params.toString()}`);
    // An expired session comes back as the proxy's redirect to /login (ERR-RT-002).
    const loginRedirect = response.redirected && new URL(response.url).pathname === "/login";
    if (response.status === 401 || loginRedirect) throw new FeedUnauthorizedError();
    if (!response.ok) throw new Error("Feed fetch failed");
    const data = (await response.json()) as { items?: FeedPost[]; nextCursor?: string | null };
    return {
      items: Array.isArray(data.items) ? data.items : [],
      nextCursor: data.nextCursor ?? null,
    };
  }, []);

  const loadTab = useCallback(
    async (tab: FeedTab, own: boolean) => {
      const generation = ++generationRef.current[tab];
      patchTab(tab, { ...EMPTY_TAB, status: "loading" });
      try {
        const { items, nextCursor } = await fetchPage(tab, null, own);
        if (generationRef.current[tab] !== generation) return;
        patchTab(tab, { items, nextCursor, status: "ready" });
      } catch (error) {
        if (generationRef.current[tab] !== generation) return;
        patchTab(tab, {
          status: error instanceof FeedUnauthorizedError ? "unauthorized" : "error",
        });
      }
    },
    [fetchPage, patchTab]
  );

  const loadMore = useCallback(async () => {
    const tab = activeTab;
    const current = tabsRef.current[tab];
    if (!current.nextCursor || current.loadingMore || showOwn === null) return;

    const generation = generationRef.current[tab];
    patchTab(tab, { loadingMore: true, moreFailed: false });
    try {
      const { items, nextCursor } = await fetchPage(tab, current.nextCursor, showOwn);
      if (generationRef.current[tab] !== generation) return;
      setTabs((prev) => {
        const seen = new Set(prev[tab].items.map((post) => post.id));
        return {
          ...prev,
          [tab]: {
            ...prev[tab],
            items: [...prev[tab].items, ...items.filter((post) => !seen.has(post.id))],
            nextCursor,
            loadingMore: false,
          },
        };
      });
    } catch {
      if (generationRef.current[tab] !== generation) return;
      patchTab(tab, { loadingMore: false, moreFailed: true });
    }
  }, [activeTab, fetchPage, patchTab, showOwn]);

  // Saved own-notes choice (default on).
  useEffect(() => {
    let saved = true;
    try {
      saved = window.localStorage.getItem(OWN_STORAGE_KEY) !== "0";
    } catch {
      // storage blocked: keep the default
    }
    setShowOwn(saved);
  }, []);

  // Each tab loads once and keeps its list when the viewer comes back to it.
  const activeStatus = tabs[activeTab].status;
  useEffect(() => {
    if (showOwn === null || activeStatus !== "idle") return;
    void loadTab(activeTab, showOwn);
  }, [activeStatus, activeTab, loadTab, showOwn]);

  // A thin following list gets a popular preview underneath.
  const following = tabs.following;
  const needsPreview =
    activeTab === "following" &&
    following.status === "ready" &&
    following.items.length < PREVIEW_THRESHOLD &&
    !following.nextCursor;
  const popularStatus = tabs.popular.status;
  useEffect(() => {
    if (needsPreview && popularStatus === "idle" && showOwn !== null) {
      void loadTab("popular", showOwn);
    }
  }, [loadTab, needsPreview, popularStatus, showOwn]);

  // Auto-load the next page near the bottom; the button stays as a fallback.
  const current = tabs[activeTab];
  const canAutoLoad =
    current.status === "ready" &&
    Boolean(current.nextCursor) &&
    !current.loadingMore &&
    !current.moreFailed;
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !canAutoLoad || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) void loadMore();
      },
      { rootMargin: "600px 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [canAutoLoad, loadMore]);

  const changeTab = (tab: FeedTab) => {
    if (tab === activeTab) return;
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "following") params.delete("tab");
    else params.set("tab", tab);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const toggleOwn = () => {
    const next = !(showOwn ?? true);
    setShowOwn(next);
    try {
      window.localStorage.setItem(OWN_STORAGE_KEY, next ? "1" : "0");
    } catch {
      // storage blocked: the choice lasts for this visit only
    }
    generationRef.current.following++;
    patchTab("following", EMPTY_TAB);
  };

  // Stable callbacks so the memoized FeedCard only re-renders the card that changed.
  const toggleLike = useCallback(
    async (post: FeedPost) => {
      if (pendingLikesRef.current.has(post.id)) return;
      pendingLikesRef.current.add(post.id);

      const liked = !post.likedByMe;
      patchPosts((p) => p.id === post.id, {
        likedByMe: liked,
        likeCount: Math.max(0, post.likeCount + (liked ? 1 : -1)),
      });

      try {
        const data = await requestJson<{ count: number; liked: boolean }>(
          `/api/posts/${post.id}/likes`,
          { method: "POST" },
          "Beğeni işlemi tamamlanamadı."
        );
        patchPosts((p) => p.id === post.id, { likedByMe: data.liked, likeCount: data.count });
      } catch (error) {
        patchPosts((p) => p.id === post.id, {
          likedByMe: post.likedByMe,
          likeCount: post.likeCount,
        });
        toast.error(getClientErrorMessage(error, "Beğeni işlemi tamamlanamadı."));
      } finally {
        pendingLikesRef.current.delete(post.id);
      }
    },
    [patchPosts]
  );

  const handleFollowChange = useCallback(
    (authorId: string, isFollowing: boolean) => {
      setFollowedHere((prev) => new Set(prev).add(authorId));
      patchPosts((p) => p.user?.id === authorId, { isFollowing });
      // The following list changes with every follow; refetch it on the next visit.
      generationRef.current.following++;
      patchTab("following", EMPTY_TAB);
    },
    [patchPosts, patchTab]
  );

  const renderCard = (post: FeedPost, context: FeedTab) => (
    <FeedCard
      post={post}
      showFollow={
        context !== "following" &&
        !post.isOwn &&
        Boolean(post.user) &&
        (!post.isFollowing || followedHere.has(post.user?.id ?? ""))
      }
      onToggleLike={toggleLike}
      onFollowChange={handleFollowChange}
    />
  );

  const header = {
    following: {
      title: (
        <>
          Takip Ettiklerinden <Em>Son Notlar</Em>
        </>
      ),
      description:
        showOwn === false
          ? "Takip ettiğin kişilerin yeni notları, en yenisi en üstte."
          : "Takip ettiğin kişilerin ve senin yeni notların, en yenisi en üstte.",
    },
    popular: {
      title: (
        <>
          Toplulukta <Em>Popüler</Em> Olanlar
        </>
      ),
      description:
        "Son günlerde en çok beğenilen, yorumlanan ve kaydedilen notlar. Takip etmediğin yazarları da burada keşfedebilirsin.",
    },
    latest: {
      title: (
        <>
          Topluluktan <Em>Yeni</Em> Notlar
        </>
      ),
      description: "Herkese açık profillerden eklenen en yeni notlar, en yenisi en üstte.",
    },
  }[activeTab];

  const followingIds = new Set(following.items.map((post) => post.id));
  const previewItems = tabs.popular.items
    .filter((post) => !followingIds.has(post.id))
    .slice(0, PREVIEW_COUNT);

  return (
    <main className="mx-auto max-w-6xl px-4 pb-12 pt-8 sm:px-6 sm:pt-10">
      {/* LAYOUT: Editorial masthead → tab bar (+ own-notes chip) → state block (skeleton /
          error / empty / list with load-more) → popular preview under a thin following list. */}
      {/* No header stats: an infinite feed has no total, and counting the loaded
          pages grows while scrolling (ERR-DATA-013). */}
      <PageHeader index="07" title={header.title} description={header.description} />

      <FeedTabs
        active={activeTab}
        onChange={changeTab}
        showOwn={showOwn ?? true}
        onToggleOwn={toggleOwn}
      />

      {current.status === "idle" || current.status === "loading" ? (
        <FeedSkeleton count={3} />
      ) : current.status === "unauthorized" ? (
        <EmptyState
          icon={<UsersThreeIcon size={22} weight="duotone" />}
          title={
            <>
              Akışı Görmek İçin <Em>Giriş Yap</Em>
            </>
          }
          description="Akışını görmek için giriş yapman gerekiyor."
          primary={{ label: "Giriş Yap", href: "/login" }}
          secondary={{ label: "Keşfet", href: "/discover" }}
        />
      ) : current.status === "error" ? (
        <EmptyState
          icon={<WarningCircleIcon size={22} weight="duotone" />}
          title={
            <>
              Akış <Em>Yüklenemedi</Em>
            </>
          }
          description="Bir sorun oldu. Tekrar deneyebilir ya da bu arada Keşfet sayfasına göz atabilirsin."
          primary={{
            label: "Tekrar Dene",
            onClick: () => showOwn !== null && void loadTab(activeTab, showOwn),
          }}
          secondary={{ label: "Keşfet", href: "/discover" }}
        />
      ) : current.items.length === 0 ? (
        <EmptyTab tab={activeTab} onSwitch={changeTab} />
      ) : (
        <section className="space-y-4">
          {/* LAYOUT: Single-column stack of feed cards, staggered entrance. */}
          {current.items.map((post, i) => (
            <motion.div
              key={post.id}
              initial={reduce ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.7,
                ease: EASE,
                delay: Math.min(i % FEED_DEFAULT_LIMIT, 8) * 0.05,
              }}
            >
              {renderCard(post, activeTab)}
            </motion.div>
          ))}

          {current.nextCursor && (
            <div ref={sentinelRef} className="flex flex-col items-center gap-2 pt-4">
              {current.moreFailed && (
                <p className="text-[13px] font-medium text-[var(--text-muted)]">
                  Daha fazla not yüklenemedi.
                </p>
              )}
              <button
                type="button"
                onClick={() => void loadMore()}
                disabled={current.loadingMore}
                className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-card)] px-6 text-sm font-semibold text-[var(--text-secondary)] transition-colors duration-200 hover:border-[var(--text-faint)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {current.loadingMore ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
                    Yükleniyor…
                  </>
                ) : current.moreFailed ? (
                  "Tekrar Dene"
                ) : (
                  <>
                    <ArrowDownIcon size={16} weight="bold" />
                    Daha Fazla Yükle
                  </>
                )}
              </button>
            </div>
          )}
        </section>
      )}

      {needsPreview &&
        (tabs.popular.status === "loading" ||
          (tabs.popular.status === "ready" && previewItems.length > 0)) && (
          <section className="mt-12">
            {/* LAYOUT: Section heading + "see all" pill → up to three popular cards. */}
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-2xl font-extrabold tracking-[-0.035em] text-[var(--text-primary)] sm:text-[28px]">
                  Popüler <Em>Notlar</Em>
                </h2>
                <p className="mt-1.5 text-sm text-[var(--text-secondary)]">
                  Toplulukta öne çıkanlar; beğendiğin yazarları buradan takip edebilirsin.
                </p>
              </div>
              <button
                type="button"
                onClick={() => changeTab("popular")}
                className="group inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-[var(--border)] px-4 text-[13px] font-semibold text-[var(--text-secondary)] transition-colors duration-200 hover:border-[var(--text-faint)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
              >
                Tümünü Gör
                <ArrowRightIcon
                  size={12}
                  weight="bold"
                  className="transition-transform duration-300 ease-out-expo group-hover:translate-x-1"
                />
              </button>
            </div>
            {tabs.popular.status === "loading" ? (
              <FeedSkeleton count={2} />
            ) : (
              <div className="space-y-4">
                {previewItems.map((post) => (
                  <div key={post.id}>{renderCard(post, "popular")}</div>
                ))}
              </div>
            )}
          </section>
        )}
    </main>
  );
}

function EmptyTab({ tab, onSwitch }: Readonly<{ tab: FeedTab; onSwitch: (tab: FeedTab) => void }>) {
  if (tab === "popular") {
    return (
      <EmptyState
        icon={<FireIcon size={22} weight="duotone" />}
        title={
          <>
            Henüz <Em>Popüler</Em> Not Yok
          </>
        }
        description="Topluluğun notları beğenildikçe, yorumlandıkça ve kaydedildikçe burada sıralanır."
        primary={{ label: "Yeni Notlara Bak", onClick: () => onSwitch("latest") }}
        secondary={{ label: "Keşfet", href: "/discover" }}
      />
    );
  }

  if (tab === "latest") {
    return (
      <EmptyState
        icon={<SparkleIcon size={22} weight="duotone" />}
        title={
          <>
            Henüz <Em>Yeni</Em> Not Yok
          </>
        }
        description="Topluluktan henüz herkese açık bir not eklenmedi. İlk notu sen ekleyebilirsin."
        primary={{ label: "Not Ekle", href: "/new-post" }}
        secondary={{ label: "Keşfet", href: "/discover" }}
      />
    );
  }

  return (
    <EmptyState
      icon={<CompassIcon size={22} weight="duotone" />}
      title={
        <>
          Akışın Henüz <Em>Sessiz</Em>
        </>
      }
      description="Takip ettiğin kişilerin yeni notları burada görünür. Popüler notlara göz at, beğendiğin yazarları takip et; akışın dolmaya başlasın."
      primary={{ label: "Popüler Notlara Bak", onClick: () => onSwitch("popular") }}
      secondary={{ label: "Keşfet", href: "/discover" }}
    />
  );
}
