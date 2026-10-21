/**
 * The page entries of the middleware matcher (src/middleware.ts), for client code.
 *
 * Next needs the matcher as a literal inside the middleware file, so the page entries are
 * repeated here; tests/protected-routes.test.mjs fails when the two lists drift apart.
 * The middleware only lets a request onto these pages with a token, so when the client
 * finds no session there, the token was revoked (password changed or reset, user banned
 * or deleted) and ConditionalAppShell sends the device to /login. Pure, unit-tested.
 */

export const PROTECTED_PAGE_MATCHERS = [
  "/notes/:path*",
  "/saved",
  "/new-post/:path*",
  "/posts/:path*/edit",
  "/category/:path*",
  "/profile/settings/:path*",
  "/profile/settings",
  "/feed",
  "/feed/:path*",
  "/recommended",
  "/recommended/:path*",
  "/collections",
  "/watchlist",
  "/stats",
  "/stats/:path*",
  "/notifications",
  "/notifications/:path*",
  "/admin",
  "/admin/:path*",
] as const;

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Same reading as Next's matcher: `:path*` stands for zero or more path segments.
function matcherToRegExp(matcher: string) {
  const source = matcher
    .split("/")
    .filter(Boolean)
    .map((segment) => (segment === ":path*" ? "(?:/[^/]+)*" : `/${escapeRegExp(segment)}`))
    .join("");
  return new RegExp(`^${source}/?$`);
}

const PROTECTED_PAGE_PATTERNS = PROTECTED_PAGE_MATCHERS.map(matcherToRegExp);

export function isProtectedPagePath(pathname: string | null | undefined) {
  if (!pathname) return false;
  return PROTECTED_PAGE_PATTERNS.some((pattern) => pattern.test(pathname));
}
