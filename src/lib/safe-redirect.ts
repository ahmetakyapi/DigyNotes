/**
 * Where to send a user after signing in. The middleware adds `?callbackUrl=<path+search>`
 * when it bounces an anonymous request to /login; only a same-origin page path is
 * honoured, everything else falls back (no open redirect).
 *
 * Rejected: other origins (`https://evil.com`, `//evil.com`, `/\evil.com`), non-http
 * schemes (`javascript:`), paths that normalise to a protocol-relative URL
 * (`/..//evil.com` → `//evil.com`), API routes (raw JSON) and the auth pages themselves.
 */
export function getSafeCallbackPath(
  raw: string | null | undefined,
  origin: string,
  fallback = "/notes"
): string {
  if (!raw) return fallback;
  const value = raw.trim();
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;

  let url: URL;
  try {
    url = new URL(value, origin);
  } catch {
    return fallback;
  }
  if (url.origin !== new URL(origin).origin) return fallback;

  const { pathname } = url;
  if (pathname.startsWith("//") || pathname.startsWith("/\\")) return fallback;
  if (pathname === "/api" || pathname.startsWith("/api/")) return fallback;
  if (["/login", "/register"].includes(pathname)) return fallback;

  return `${pathname}${url.search}${url.hash}`;
}
