import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
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

/** Phase timer for the `Server-Timing` header (visible in curl -D - and devtools). */
export function ogTimer() {
  const start = performance.now();
  let last = start;
  const marks: string[] = [];
  return {
    mark(name: string) {
      const now = performance.now();
      marks.push(`${name};dur=${Math.round(now - last)}`);
      last = now;
    },
    header: () => [...marks, `total;dur=${Math.round(performance.now() - start)}`].join(", "),
  };
}

export async function toJpegResponse(
  image: ImageResponse,
  opts: { short?: boolean; timer?: ReturnType<typeof ogTimer> } = {}
) {
  const raw = Buffer.from(await image.arrayBuffer());
  opts.timer?.mark("render");
  const png = PNG.sync.read(raw);
  const out = jpeg.encode({ data: png.data, width: png.width, height: png.height }, 84).data;
  opts.timer?.mark("encode");
  return new Response(new Uint8Array(out), {
    headers: {
      "Content-Type": "image/jpeg",
      "Content-Length": String(out.byteLength),
      "Cache-Control": opts.short ? CACHE_SHORT : CACHE_PUBLIC,
      ...(opts.timer ? { "Server-Timing": opts.timer.header() } : {}),
    },
  });
}

/**
 * Covers are user-supplied URLs fetched by the server, so keep the fetch to public
 * hosts: http(s) on the default ports only, no IP literals, no localhost / internal
 * names (a trailing dot doesn't get around it) — checked again on every redirect hop,
 * together with `resolvesToPublicHost`.
 */
export function isPublicImageUrl(src: string) {
  try {
    const { protocol, hostname, port } = new URL(src);
    if (protocol !== "https:" && protocol !== "http:") return false;
    if (port && port !== "80" && port !== "443") return false;
    const host = hostname.toLowerCase().replace(/\.+$/, "");
    if (host === "localhost" || !host.includes(".")) return false;
    if (/^[\d.]+$/.test(host) || host.includes(":") || host.startsWith("[")) return false;
    return !/\.(local|internal|localhost)$/.test(host);
  } catch {
    return false;
  }
}

/** Loopback, private, link-local, CGNAT, benchmark, multicast and reserved ranges. */
export function isPrivateAddress(ip: string): boolean {
  const v = ip.toLowerCase();
  if (v.startsWith("::ffff:")) {
    const mapped = v.slice(7);
    return isIP(mapped) === 4 ? isPrivateAddress(mapped) : true;
  }
  // IPv6: only global unicast (2000::/3) counts as public.
  if (isIP(v) === 6) return !/^[23][0-9a-f]{3}:/.test(v);
  if (isIP(v) !== 4) return true;
  const [a, b] = v.split(".").map(Number);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    a >= 224 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 198 && (b === 18 || b === 19))
  );
}

/**
 * Names such as `127.0.0.1.nip.io` pass the string check, so resolve them and reject
 * any private address. fetch resolves the name again (a DNS-rebinding window we accept);
 * a failed check only costs the cover, the card draws its typographic tile instead.
 */
async function resolvesToPublicHost(src: string, signal: AbortSignal) {
  try {
    signal.throwIfAborted();
    const addrs = await Promise.race([
      lookup(new URL(src).hostname, { all: true }),
      new Promise<never>((_, reject) => {
        signal.addEventListener("abort", () => reject(signal.reason), { once: true });
      }),
    ]);
    return addrs.length > 0 && addrs.every((a) => !isPrivateAddress(a.address));
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
      if (!isPublicImageUrl(url) || !(await resolvesToPublicHost(url, signal))) return null;
      // `cache: "no-store"` is required for the byte cap below: otherwise Next's patched
      // fetch auto-caches this route's GETs and reads the whole body into the Data Cache
      // before fetch() even resolves (and fills that cache with user-chosen URLs).
      res = await fetch(url, {
        headers: { "User-Agent": "DigyNotesOG/1.0" },
        redirect: "manual",
        signal,
        cache: "no-store",
      });
      const next = res.status >= 300 && res.status < 400 ? res.headers.get("location") : null;
      if (!next) break;
      url = new URL(next, url).toString();
      res = null;
    }
    const type = (res?.headers.get("content-type") ?? "").split(";")[0].trim();
    if (!res || !res.ok || !/^image\/(jpeg|jpg|png)$/.test(type)) return null;
    if (Number(res.headers.get("content-length") ?? 0) > MAX_COVER_BYTES) return null;
    // Read with a running cap: without content-length, arrayBuffer() would buffer
    // whatever a chunked response streams until the timeout.
    const reader = res.body?.getReader();
    if (!reader) return null;
    const chunks: Uint8Array[] = [];
    let total = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_COVER_BYTES) {
        await reader.cancel().catch(() => {});
        return null;
      }
      chunks.push(value);
    }
    const buf = Buffer.concat(chunks);
    return `data:${type === "image/jpg" ? "image/jpeg" : type};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}
