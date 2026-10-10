import { PNG } from "pngjs";
import jpeg from "jpeg-js";
import type { ImageResponse } from "next/og";

/**
 * Share-card plumbing shared by the `opengraph-image` routes (Node runtime).
 *
 * WhatsApp is the strictest consumer: it skips the image when the file is large
 * (the old PNG cards were ~535 KB) or slow, and it caches whatever it got for a long
 * time. So cards are re-encoded as JPEG (~60–150 KB) and cached at the CDN.
 *
 * Pure JS on purpose (pngjs + jpeg-js): sharp's native binary built fine locally but the
 * Vercel deployment with it failed (2026-10-10), and a 1200×630 encode is ~100 ms anyway.
 */
export const OG_SIZE = { width: 1200, height: 630 } as const;

/** One day at the CDN, a week of stale-while-revalidate. URLs carry `?v=<updatedAt>`. */
const CACHE_PUBLIC = "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800";
/** Placeholder cards (private / missing note) must not stick once the note is shared. */
const CACHE_SHORT = "public, max-age=60, s-maxage=300";
/** Covers are embedded as-is; anything bigger would slow the card past chat timeouts. */
const MAX_COVER_BYTES = 3_000_000;

export async function toJpegResponse(image: ImageResponse, opts: { short?: boolean } = {}) {
  const png = PNG.sync.read(Buffer.from(await image.arrayBuffer()));
  const out = jpeg.encode({ data: png.data, width: png.width, height: png.height }, 84).data;
  return new Response(new Uint8Array(out), {
    headers: {
      "Content-Type": "image/jpeg",
      "Content-Length": String(out.byteLength),
      "Cache-Control": opts.short ? CACHE_SHORT : CACHE_PUBLIC,
    },
  });
}

/**
 * Covers are user-supplied URLs fetched by the server, so keep the fetch to public
 * hosts: http(s) only, no IP literals, no localhost / internal names — checked again on
 * every redirect hop.
 */
function isPublicImageUrl(src: string) {
  try {
    const { protocol, hostname } = new URL(src);
    if (protocol !== "https:" && protocol !== "http:") return false;
    const host = hostname.toLowerCase();
    if (host === "localhost" || !host.includes(".")) return false;
    if (/^[\d.]+$/.test(host) || host.includes(":") || host.startsWith("[")) return false;
    return !/\.(local|internal|localhost)$/.test(host);
  } catch {
    return false;
  }
}

/**
 * Fetches a cover and returns it as a data URL for Satori, which draws JPEG and PNG only
 * (no WebP) and scales it with `objectFit`. Returns null on any failure or other format:
 * the card then draws a typographic tile instead.
 */
export async function loadCover(src: string | null | undefined) {
  if (!src) return null;
  try {
    // Follow redirects by hand (Open Library covers redirect to archive.org) so every
    // hop passes the same public-host check.
    let url = src;
    let res: Response | null = null;
    const signal = AbortSignal.timeout(3500);
    for (let hop = 0; hop < 4; hop += 1) {
      if (!isPublicImageUrl(url)) return null;
      res = await fetch(url, {
        headers: { "User-Agent": "DigyNotesOG/1.0" },
        redirect: "manual",
        signal,
      });
      const next = res.status >= 300 && res.status < 400 ? res.headers.get("location") : null;
      if (!next) break;
      url = new URL(next, url).toString();
      res = null;
    }
    const type = (res?.headers.get("content-type") ?? "").split(";")[0].trim();
    if (!res || !res.ok || !/^image\/(jpeg|jpg|png)$/.test(type)) return null;
    if (Number(res.headers.get("content-length") ?? 0) > MAX_COVER_BYTES) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength > MAX_COVER_BYTES) return null;
    return `data:${type === "image/jpg" ? "image/jpeg" : type};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}
