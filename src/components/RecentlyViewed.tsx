"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  ClockCounterClockwiseIcon,
  XIcon,
  CaretLeftIcon,
  CaretRightIcon,
} from "@phosphor-icons/react";
import { getPostImageSrc } from "@/lib/post-image";
import { ResilientImage } from "@/components/ResilientImage";
import { getCategoryLabel } from "@/lib/categories";

const STORAGE_KEY = "dn_recent_views";
const MAX_ITEMS = 8;

export interface RecentViewItem {
  id: string;
  title: string;
  category: string;
  image: string;
  rating: number;
  viewedAt: number;
}

/**
 * Bir notu "son görüntülenen" listesine ekler.
 * Post detay sayfasından çağrılır.
 */
export function addRecentView(post: {
  id: string;
  title: string;
  category: string;
  image: string;
  rating: number;
}) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const items: RecentViewItem[] = raw ? JSON.parse(raw) : [];

    const filtered = items.filter((item) => item.id !== post.id);
    filtered.unshift({
      ...post,
      viewedAt: Date.now(),
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered.slice(0, MAX_ITEMS)));
  } catch {
    // localStorage erişim hatası
  }
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Az önce";
  if (mins < 60) return `${mins} dakika önce`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} saat önce`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Dün";
  if (days < 7) return `${days} gün önce`;
  if (days < 30) return `${Math.floor(days / 7)} hafta önce`;
  if (days < 365) return `${Math.floor(days / 30)} ay önce`;
  return `${Math.floor(days / 365)} yıl önce`;
}

/**
 * Son görüntülenen notlar — inline yatay şerit.
 */
export default function RecentlyViewed() {
  const [items, setItems] = useState<RecentViewItem[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Drag-to-scroll state
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragScrollLeft = useRef(0);
  const hasDragged = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: RecentViewItem[] = JSON.parse(raw);
        setItems(parsed.slice(0, MAX_ITEMS));
      }
    } catch {
      // noop
    }
  }, []);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [items, checkScroll]);

  const scroll = useCallback((dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -200 : 200, behavior: "smooth" });
  }, []);

  // Mouse drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const el = scrollRef.current;
    if (!el) return;
    isDragging.current = true;
    hasDragged.current = false;
    dragStartX.current = e.pageX - el.offsetLeft;
    dragScrollLeft.current = el.scrollLeft;
    el.style.cursor = "grabbing";
    el.style.userSelect = "none";
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const el = scrollRef.current;
    if (!el) return;
    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    const walk = (x - dragStartX.current) * 1.5;
    if (Math.abs(walk) > 3) hasDragged.current = true;
    el.scrollLeft = dragScrollLeft.current - walk;
  }, []);

  const handleMouseUpOrLeave = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const el = scrollRef.current;
    if (!el) return;
    el.style.cursor = "grab";
    el.style.userSelect = "";
  }, []);

  // Prevent click navigation when dragging
  const handleClickCapture = useCallback((e: React.MouseEvent) => {
    if (hasDragged.current) {
      e.preventDefault();
      e.stopPropagation();
      hasDragged.current = false;
    }
  }, []);

  const handleClearAll = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setItems([]);
    setDismissed(true);
  }, []);

  if (dismissed || items.length === 0) return null;

  return (
    <section className="mb-1 sm:mb-2">
      {/* Header */}
      <div className="mb-2 flex items-center gap-2 sm:mb-2.5">
        <ClockCounterClockwiseIcon
          size={14}
          weight="bold"
          className="flex-shrink-0 text-[var(--text-muted)]"
        />
        <h2 className="text-[13.5px] font-semibold text-[var(--text-secondary)]">
          Son Görüntülenenler
        </h2>

        <div className="ml-auto flex items-center gap-1">
          {/* Scroll okları — sadece taşma varsa göster */}
          {(canScrollLeft || canScrollRight) && (
            <div className="mr-1 hidden items-center gap-0.5 sm:flex">
              <button
                onClick={() => scroll("left")}
                disabled={!canScrollLeft}
                className="flex h-6 w-6 items-center justify-center rounded-md text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-raised)] hover:text-[var(--text-secondary)] disabled:pointer-events-none disabled:opacity-0"
              >
                <CaretLeftIcon size={12} weight="bold" />
              </button>
              <button
                onClick={() => scroll("right")}
                disabled={!canScrollRight}
                className="flex h-6 w-6 items-center justify-center rounded-md text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-raised)] hover:text-[var(--text-secondary)] disabled:pointer-events-none disabled:opacity-0"
              >
                <CaretRightIcon size={12} weight="bold" />
              </button>
            </div>
          )}

          <button
            onClick={handleClearAll}
            title="Geçmişi Temizle"
            className="flex h-6 w-6 items-center justify-center rounded-md text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-raised)] hover:text-[var(--danger,var(--danger))]"
          >
            <XIcon size={12} weight="bold" />
          </button>
        </div>
      </div>

      {/* Kart şeridi */}
      <div className="relative">
        {/* Sol fade */}
        {canScrollLeft && (
          <div className="pointer-events-none absolute bottom-0 left-0 top-0 z-10 w-8 bg-gradient-to-r from-[var(--bg-base)] to-transparent" />
        )}
        {/* Sağ fade */}
        {canScrollRight && (
          <div className="pointer-events-none absolute bottom-0 right-0 top-0 z-10 w-8 bg-gradient-to-l from-[var(--bg-base)] to-transparent" />
        )}

        <div
          ref={scrollRef}
          className="scrollbar-hide -mx-1 flex cursor-grab gap-2.5 overflow-x-auto px-1 pb-1 sm:gap-3"
          style={{ touchAction: "pan-x" }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          onClickCapture={handleClickCapture}
        >
          {items.map((item) => (
            <Link key={item.id} href={`/posts/${item.id}`} className="group flex-shrink-0">
              <div className="w-[168px] flex-shrink-0 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] transition-[border-color,transform,box-shadow] duration-300 ease-out-expo group-hover:-translate-y-0.5 group-hover:border-accent/30 group-hover:shadow-[0_10px_30px_-12px_rgb(var(--gold-rgb)/0.35)] sm:w-[196px]">
                {/* Poster */}
                <div className="relative h-20 w-full overflow-hidden sm:h-24">
                  <ResilientImage
                    src={getPostImageSrc(item.image, item.category)}
                    alt={item.title}
                    fill
                    className="object-cover transition-transform duration-500 ease-out-expo group-hover:scale-[1.06]"
                    sizes="260px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between gap-1">
                    <span className="rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm">
                      {getCategoryLabel(item.category)}
                    </span>
                    {item.rating > 0 && (
                      <span className="flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm">
                        <span className="text-[#b9a8ff]">★</span>
                        {item.rating.toFixed(1).replace(".", ",")}
                      </span>
                    )}
                  </div>
                </div>

                {/* Bilgi */}
                <div className="px-3 py-2.5">
                  <p className="truncate text-[13px] font-semibold leading-tight text-[var(--text-primary)] transition-colors duration-200 group-hover:text-[var(--gold)]">
                    {item.title}
                  </p>
                  <p className="mt-1 text-[12px] font-medium text-[var(--text-muted)]">
                    {timeAgo(item.viewedAt)}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
