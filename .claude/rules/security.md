# Security Rules (always active)

## Auth
- Every route that writes data checks the session before any other logic.
- userId comes only from the session (`requireAuth()` / `getSessionUserId()`), never from the request.
- Before UPDATE/DELETE verify `resource.userId === userId`; 403 (not 404) when it exists but isn't theirs.
- Admin-only operations check `requireAdmin()` (`User.isAdmin`).
- POST/PUT/DELETE require auth unless explicitly public (`/api/auth/register`). Public reads: `/api/public/*`, public profiles, search, community stats.

## Input
- Validate required fields before DB writes.
- Quill HTML is sanitized on write (`sanitizePostContent`, sanitize-html; only `ql-*` classes, links `rel="nofollow ugc noopener noreferrer"`); `dangerouslySetInnerHTML` only for content that went through it (or static markup). Text handed to Quill as a string is escaped with `escapeHtml` (ERR-SEC-001). No `eval()`.
- Redirect targets from the URL (`callbackUrl`, …) go through `getSafeCallbackPath` (`src/lib/safe-redirect.ts`). Server fetches of user-supplied URLs check scheme, port and resolved IP on every hop and pass `cache: "no-store"` (`src/lib/og-image.ts`).
- Tag names go through `normalizeTagName` (`src/lib/text.ts`) before saving or filtering.
- Prefer typed Prisma queries; `$queryRaw` only when unavoidable and never with concatenated user input.
- User-content writes, register, password and profile changes are rate-limited (`src/lib/rate-limit.ts`); login uses the same limiter per address and per IP inside `authorize` (`src/lib/auth.ts`). New write endpoints get one too. Cross-instance limits need `UPSTASH_REDIS_REST_URL`/`_TOKEN` in production; without them each instance counts on its own.

## Secrets & Responses
- Never read, edit or log `.env*`, `NEXTAUTH_SECRET` or DB passwords.
- Never return password hashes or full Prisma user objects — `select` the public fields.
- Don't expose internal error messages; log server-side, return a generic Turkish message (`handleApiError`).
