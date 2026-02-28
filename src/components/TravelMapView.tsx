"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MapPin } from "@phosphor-icons/react";
import { Post } from "@/types";
import {
  buildOpenStreetMapEmbedUrl,
  buildOpenStreetMapLink,
  formatCoordinate,
  hasCoordinates,
} from "@/lib/maps";
import { getPostImageSrc } from "@/lib/post-image";

const customLoader = ({ src }: { src: string }) => src;

interface PositionedPost extends Post {
  left: number;
  top: number;
}

function buildMarkerPositions(posts: Post[]): PositionedPost[] {
  const mappedPosts = posts.filter((post): post is Post & { lat: number; lng: number } =>
    hasCoordinates(post.lat, post.lng)
  );

  if (mappedPosts.length === 0) return [];
  if (mappedPosts.length === 1) {
    return [{ ...mappedPosts[0], left: 50, top: 50 }];
  }

  const minLat = Math.min(...mappedPosts.map((post) => post.lat));
  const maxLat = Math.max(...mappedPosts.map((post) => post.lat));
  const minLng = Math.min(...mappedPosts.map((post) => post.lng));
  const maxLng = Math.max(...mappedPosts.map((post) => post.lng));

  const latRange = maxLat - minLat || 1;
  const lngRange = maxLng - minLng || 1;

  return mappedPosts.map((post) => ({
    ...post,
    left: 8 + ((post.lng - minLng) / lngRange) * 84,
    top: 10 + (1 - (post.lat - minLat) / latRange) * 80,
  }));
}

export function TravelMapView({ posts }: { posts: Post[] }) {
  const points = useMemo(() => buildMarkerPositions(posts), [posts]);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(points[0]?.id ?? null);

  useEffect(() => {
    setSelectedPostId(points[0]?.id ?? null);
  }, [points]);

  const selectedPost = points.find((post) => post.id === selectedPostId) ?? points[0] ?? null;

  if (!selectedPost) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg-card)] px-5 py-10 text-center">
        <p className="text-sm font-semibold text-[var(--text-primary)]">
          Haritada gösterilecek konum yok
        </p>
        <p className="mt-2 text-xs leading-5 text-[var(--text-muted)]">
          Gezi notu oluştururken bir konum seçildiğinde harita görünümü otomatik dolacak.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_320px]">
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">
              Gezi Haritası
            </p>
            <h2 className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
              {points.length} konumluk rota ağı
            </h2>
          </div>
          <a
            href={buildOpenStreetMapLink(selectedPost.lat!, selectedPost.lng!)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-raised)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:border-[#c4a24b]/35 hover:text-[var(--text-primary)]"
          >
            <MapPin size={14} />
            OpenStreetMap'te Aç
          </a>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[radial-gradient(circle_at_top_left,rgba(196,162,75,0.22),transparent_36%),linear-gradient(180deg,rgba(15,23,42,0.92),rgba(10,14,22,0.98))]">
          <div className="absolute inset-0 opacity-30" aria-hidden>
            <div
              className="h-full w-full"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
                backgroundSize: "32px 32px",
              }}
            />
          </div>
          <div className="absolute inset-x-6 top-5 flex items-center justify-between text-[10px] uppercase tracking-[0.14em] text-white/45">
            <span>Kuzey</span>
            <span>Konum yoğunluğu</span>
          </div>
          <div className="relative h-[420px]">
            {points.map((post, index) => {
              const isSelected = post.id === selectedPost.id;

              return (
                <button
                  key={post.id}
                  type="button"
                  onClick={() => setSelectedPostId(post.id)}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 transition-transform duration-200 ${
                    isSelected ? "z-20 scale-110" : "z-10 hover:scale-105"
                  }`}
                  style={{ left: `${post.left}%`, top: `${post.top}%` }}
                >
                  <span
                    className={`flex h-11 w-11 items-center justify-center rounded-full border text-xs font-bold shadow-[0_10px_30px_rgba(0,0,0,0.35)] ${
                      isSelected
                        ? "border-[#f4d98a] bg-[#c4a24b] text-[#241807]"
                        : "border-white/15 bg-white/10 text-white backdrop-blur-md"
                    }`}
                  >
                    {index + 1}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
          <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-raised)]">
            <iframe
              title={`${selectedPost.title} konum haritası`}
              src={buildOpenStreetMapEmbedUrl(selectedPost.lat!, selectedPost.lng!)}
              className="h-[280px] w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-raised)] p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">
              Seçili Durak
            </p>
            <h3 className="mt-2 text-base font-semibold text-[var(--text-primary)]">
              {selectedPost.title}
            </h3>
            {selectedPost.excerpt && (
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                {selectedPost.excerpt}
              </p>
            )}
            <div className="mt-4 space-y-2 text-xs text-[var(--text-muted)]">
              <p>
                Lat:{" "}
                <span className="font-medium text-[var(--text-secondary)]">
                  {formatCoordinate(selectedPost.lat!)}
                </span>
              </p>
              <p>
                Lng:{" "}
                <span className="font-medium text-[var(--text-secondary)]">
                  {formatCoordinate(selectedPost.lng!)}
                </span>
              </p>
              {selectedPost.date && <p>{selectedPost.date}</p>}
            </div>
            <Link
              href={`/posts/${selectedPost.id}`}
              className="mt-4 inline-flex rounded-xl bg-[var(--gold)] px-3 py-2 text-xs font-semibold text-[var(--text-on-accent)] transition-colors hover:bg-[var(--gold-light)]"
            >
              Notu Aç
            </Link>
          </div>
        </div>
      </section>

      <aside className="space-y-2 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-3">
        {points.map((post) => {
          const isSelected = post.id === selectedPost.id;

          return (
            <button
              key={post.id}
              type="button"
              onClick={() => setSelectedPostId(post.id)}
              className={`w-full rounded-2xl border p-3 text-left transition-all ${
                isSelected
                  ? "border-[#c4a24b]/35 bg-[#c4a24b]/10"
                  : "border-[var(--border)] bg-[var(--bg-raised)] hover:border-[#c4a24b]/25"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="relative h-16 w-14 flex-shrink-0 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-card)]">
                  <Image
                    loader={customLoader}
                    src={getPostImageSrc(post.image)}
                    alt={post.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                    {post.title}
                  </p>
                  {post.years && (
                    <p className="mt-1 text-[11px] text-[var(--text-muted)]">{post.years}</p>
                  )}
                  <p className="mt-2 line-clamp-2 text-xs leading-5 text-[var(--text-secondary)]">
                    {post.excerpt || "Gezi notu"}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </aside>
    </div>
  );
}
