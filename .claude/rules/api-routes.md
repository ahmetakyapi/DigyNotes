---
paths:
  - "src/app/api/**/*.ts"
---

# API Route Rules

- DB: `import { prisma } from "@/lib/prisma"` — never instantiate PrismaClient.
- Auth: `const [userId, res] = await requireAuth(); if (res) return res;` (`@/lib/api-server`); `getSessionUserId()` when auth is optional; `requireAdmin()` for admin routes. Raw session: `(session.user as { id: string }).id` (ERR-012).
- Wrap the handler in `try/catch` and end with `return handleApiError(error, "<Turkish fallback>")` — it always logs server-side, maps P2002/P2003 to 400 and P2025 to 404, answers 500 with the fallback for everything else, rethrows Next's own control-flow errors, and never leaks internals.
- Errors are always `{ error: string }`: 400 invalid input · 401 no session · 403 not yours · 404 missing · 409 duplicate · 429 rate limited · 500 unexpected.
- Input: `safeParseBody`; validate with `requireStringField` / `sanitizeStringField` / `sanitizeRating` (`@/lib/api-utils`) before any write.
- Writes on user content go through `consumeRateLimit({ action, req, userId, limit, windowMs })` + `createRateLimitErrorResponse` (`@/lib/rate-limit`).
- Ownership before UPDATE/DELETE: load the row → 404 if missing → 403 if `row.userId !== userId`. Post reads go through `getPostReadAccess` (`@/lib/post-access`).
- Per-user responses: `export const dynamic = "force-dynamic"`.
- Dynamic params (Next 16, a Promise): `export async function GET(req: NextRequest, { params: paramsPromise }: { params: Promise<{ id: string }> }) { const params = await paramsPromise; … }` (ERR-TS-002).
- A new private route must be added to the `matcher` in `src/proxy.ts`; unauthenticated calls to matched APIs get the login page HTML, not JSON (ERR-RT-002).
