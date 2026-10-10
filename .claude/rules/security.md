# Security Rules (always active)

## Auth
- Every route that writes data checks the session before any other logic.
- userId comes only from the session (`requireAuth()` / `getSessionUserId()`), never from the request.
- Before UPDATE/DELETE verify `resource.userId === userId`; 403 (not 404) when it exists but isn't theirs.
- Admin-only operations check `requireAdmin()` (`User.isAdmin`).
- POST/PUT/DELETE require auth unless explicitly public (`/api/auth/register`). Public reads: `/api/public/*`, public profiles, search, community stats.

## Input
- Validate required fields before DB writes.
- Quill HTML is sanitized on write (`sanitizePostContent`, sanitize-html); `dangerouslySetInnerHTML` only for content that went through it (or static markup). No `eval()`.
- Tag names: lowercase + trim before saving.
- Prefer typed Prisma queries; `$queryRaw` only when unavoidable and never with concatenated user input.
- User-content writes, register, password and profile changes are rate-limited (`src/lib/rate-limit.ts`; login has its own limiter in `src/lib/auth.ts`); new write endpoints get one too.

## Secrets & Responses
- Never read, edit or log `.env*`, `NEXTAUTH_SECRET` or DB passwords.
- Never return password hashes or full Prisma user objects — `select` the public fields.
- Don't expose internal error messages; log server-side, return a generic Turkish message (`handleApiError`).
