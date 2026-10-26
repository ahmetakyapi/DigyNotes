# DigyNotes — Claude Code Project Rules

## Commit yazarı

Commitler her zaman `Ahmet Akyapı <ahmetakyapii@gmail.com>` adına atılır;
yazarı yalnızca "Claude" olan commit atılmaz. Claude, mesajın sonundaki
`Co-Authored-By: Claude …` satırıyla ortak yazar olarak görünür. Oturum
başında, ilk committen önce:

```bash
git config user.name "Ahmet Akyapı"
git config user.email "ahmetakyapii@gmail.com"
```

Bu kural sahibinin tüm repolarında geçerli (9 Ekim 2026).

## Session Rules

- **Check `ERRORS.md` first.** Before a task or any debugging, search it by symptom or code (ERR-…) and apply the known fix instead of re-investigating. When you solve a new error, append it right away using the template at its top.
- There is no `MEMORY.md`: a confirmed pattern or owner decision goes into this file (or the matching `.claude/rules/*.md`).
- **Production DB guard.** Cloud shells export a production (Neon) `DATABASE_URL` and dotenv never overrides it (ERR-ENV-002). It may not even be DigyNotes' database (2026-10-10 it pointed at another project's Neon: no `posts` table) — check the schema before trusting it; DigyNotes' own URL lives only in Vercel env. Port 5432 is closed from the cloud sandbox; Neon's HTTPS `/sql` endpoint works. Never run `prisma db push`/`migrate`, seeds or `npm run dev` against it; for local work prefix commands with `DATABASE_URL=postgresql://digynotes:digynotes_secret@localhost:5432/digynotes`. Never read `.env*`.
- Path-scoped rules load automatically: `api-routes.md` (API), `components.md` (`.tsx`), `prisma-schema.md` (Prisma), `security.md` (always).

## Stack

- Next.js 16 App Router (Turbopack build) · React 19 · TypeScript · Tailwind v4 · ESLint 9 flat config. Node ≥ 20.9 (CI: 24).
- Prisma 7 + `@prisma/adapter-pg` → PostgreSQL. Local: Homebrew `postgresql@16` (no Docker on the owner's machine; `docker-compose.yml` mirrors the same creds) — db/user `digynotes`, pw `digynotes_secret`, port 5432. Production: Neon eu-central-1.
- Vercel, functions pinned to `fra1` in `vercel.json` (next to Neon and Turkish users; the default `iad1` added ~1.2 s per DB round trip).
- NextAuth v4 credentials + JWT: `src/lib/auth.ts`.
- react-quill-new editor (Quill 2) · `motion` (imports from `motion/react`) · Lenis (landing only) · recharts · react-hot-toast · sanitize-html · `@phosphor-icons/react`.
- Media search: TMDB, RAWG, Open Library (`src/components/MediaSearch.tsx`).

Platform rules (Next 16 / React 19 / Tailwind v4, migrated 2026-10-26):

- Request APIs are async: `params`/`searchParams` are Promises (`await` in server code, `use()` in client pages), and so are `cookies()`/`headers()`. Route handlers: `{ params }: { params: Promise<{ id: string }> }`. Global route types (`PageProps`, `RouteContext`) live in `.next/types` and appear after `npm run build` or `npx next typegen`.
- `next build` no longer lints; `npm run lint` is its own step (CI too). React Compiler rules `react-hooks/set-state-in-effect`, `refs`, `purity` are off in `eslint.config.mjs` until the compiler is adopted.
- Tailwind v4 reads the v3 JS config through `@config` in `src/app/globals.css` (`tailwind.config.mts`; no `@theme` port yet). Partials sit in cascade layers — an unlayered rule beats every utility, so new global CSS goes in `@layer base/components/utilities`.
- v4 traps the v3 code relied on (ERR-TW4-001): `space-x/y-*` no longer overrides a child's own margin; a `leading-*` now beats a later `sm:text-lg` line-height; `rotate-*`/`translate-*`/`scale-*` are separate CSS properties that motion's inline `transform` no longer cancels; `shadow-[var(--x)]` is now a real shadow (v3 read it as a colour and drew nothing). Renamed: `shadow-xs`/`shadow-sm`, `rounded-xs`/`rounded-sm`, `outline-hidden`, `shrink-0`; stacked variants apply left to right (`prose-a:hover:underline`).

## Commands

```bash
npm run dev        # scripts/restart-local-4300.sh: stops running DigyNotes dev servers, wipes .next, starts on :4300
npm run typecheck  # prisma generate + tsc -p tsconfig.typecheck.json
npm run lint       # eslint, --max-warnings=0
npm test           # node:test suites in tests/*.test.mjs (pure src/lib helpers)
npm run format     # prettier + tailwind class sort (v4 order; not yet run repo-wide after the migration)
npm run db:push | db:generate | db:studio
brew services start|stop postgresql@16
```

Env names (values never in docs): `DATABASE_URL`, `NEXTAUTH_URL` (local `http://localhost:4300`), `NEXTAUTH_SECRET`, `NEXT_PUBLIC_TMDB_API_KEY`, `NEXT_PUBLIC_RAWG_API_KEY`, `NEXT_PUBLIC_SITE_URL`; optional `UPSTASH_REDIS_REST_URL`/`_TOKEN` (rate-limit store, in-memory fallback), `ENABLE_ADMIN_BOOTSTRAP`, `RESEND_API_KEY` + `EMAIL_FROM` (password-reset mail via Resend's HTTP API; without the key non-production logs the reset link to the server console).

## Code Map

- Pages `src/app/**/page.tsx` (heavy client logic in a sibling `*Client.tsx`); APIs `src/app/api/**/route.ts` — list them with `find src/app -name route.ts`, don't keep inventories here.
- `src/lib/`: `prisma.ts` (the only PrismaClient), `auth.ts`, `api-server.ts` (`requireAuth`, `requireAdmin`, `handleApiError`, `safeParseBody`, `getServerAuthSession` — the session cached per server render), `api-utils.ts` (`transformPostTags`, `sanitizePostContent`, field sanitizers), `rate-limit.ts`, `post-access.ts`, `categories.ts`, `metadata.ts` (`getSiteUrl`), `og-*`.
- `src/types/index.ts` shared types; `src/types/next-auth.d.ts` adds `session.user.id`.
- `src/components/ConditionalAppShell.tsx` decides the shell: never on `/`, `/login`, `/register`, `/forgot-password`, `/reset-password`, `/offline`, `/maintenance`; `/discover`, `/profile`, `/collections` get it only when signed in (same tree as the other pages, so AppShell isn't remounted).
- One react-hot-toast `<Toaster>`: `src/components/AppToaster.tsx`, mounted in the root layout. Root error boundary page: `src/app/error.tsx`.

## Auth & Access

- The `matcher` in `src/proxy.ts` (Next 16 name for middleware; `export function proxy` wraps next-auth's `withAuth`) is the single source of truth for protected routes; add every new private page or API there, and private pages also to `PROTECTED_PAGE_MATCHERS` (`src/lib/protected-routes.ts`; a test fails when they drift). It covers notes, saved, new-post, `posts/*/edit`, category, feed, recommended, collections, watchlist, stats, notifications, profile/settings, admin, and the posts, categories, tags, bookmarks, watchlist, collections, follows, feed, recommendations, notifications, `users/me` and admin APIs.
- Saved notes ("Kaydettiklerim") live in the saved tab of `/notes` (`?tab=kaydedilenler`); `/saved` redirects there and is the link used everywhere (`ORGANIZATION_SURFACES.bookmarks.href`, user menu, command palette, `B` shortcut).
- Public: landing, auth pages, `/discover`, `/profile/[username]`, `/tag/[name]`, `/posts/[id]` (visibility via `getPostReadAccess`/`canReadPost`: owner and admin always; others only published — not draft, not deleted — notes of a public author), `/api/public`, `/api/search`, `/api/users/[username]/**`, `/api/users/search`, `/api/community/stats`, `/api/auth/*`. The proxy's `authorized` callback also lets anonymous **GET** through to `/api/posts/[id]`, `…/likes`, `…/comments` and `/api/posts/related` (handlers check access themselves); writes there still need a session.
- Password reset: `/forgot-password` → `POST /api/auth/forgot-password` (always `{ ok: true }`, no user enumeration; rate-limited per IP and per address) mails a link to `/reset-password?token=…` (`src/lib/email.ts`); `GET|POST /api/auth/reset-password` verifies it. Tokens are stateless (`src/lib/password-reset.ts`, tested): HMAC with `NEXTAUTH_SECRET` over user id, expiry (60 min) and the current password hash, so they die once the password changes. Both pages are noindex, outside the app shell and the sitemap.
- Sessions are bound to the password: the JWT carries `pwv`, a fingerprint of the hash (`src/lib/password-version.ts`). The session callback drops banned, deleted and pre-change sessions; the proxy treats tokens without `pwv` as signed out; a token that passes the proxy but has no session is sent to `/login?callbackUrl=…` (`MaintenanceGuard` on the server, `ConditionalAppShell` in an open tab). A DB error in the lookup (after one retry) keeps the cookie but drops the identity for that request, so always check the id itself, never just `session.user` (ERR-AUTH-001).
- Login: honours `?callbackUrl=` through `getSafeCallbackPath` (`src/lib/safe-redirect.ts`, same-origin page paths only); limited per address (8 / 5 min) and per IP (30 / 5 min) with `consumeRateLimit` — a limited attempt throws `RATE_LIMITED`, which the login page shows. Register: name ≤ 80, password 8–128 (same as reset and change), usernames `/^[a-z0-9_]{3,30}$/` everywhere, minus `RESERVED_USERNAMES` (`src/lib/usernames.ts`). Forgot-password answers in ≥ 1 s either way.
- A banned author counts as private everywhere others read: `canReadPost`, `publicPostsWhere`, profile access, collections, sitemap, liked/saved lists, tags, community stats.
- Admin = `User.isAdmin` + `requireAdmin()`. `/api/admin/setup` bootstraps only outside production unless `ENABLE_ADMIN_BOOTSTRAP=true`. Admins can't ban or demote themselves (bulk actions skip the caller); admin user/role/ban/delete actions write `ActivityLog` audit entries (ids only) in the same transaction; deleting a user also deletes their own activity logs; admin note delete is a deliberate hard delete.
- Maintenance mode (`SiteSettings.maintenanceMode`, `MaintenanceGuard`) only applies to proxy-matched routes: it reads the `x-pathname` header the proxy sets.

## Data Rules

- `Post.userId` and `Category.userId` are nullable (legacy).
- `Post.category` is a normalized string (`normalizeCategory`; fixed slugs `movies series game book travel other` in `src/lib/categories.ts`), not a FK. `/category/[id]` takes that **name**, not a DB id (ERR-008).
- Posts are soft-deleted (`isDeleted` + `deletedAt`); list queries filter `isDeleted: false`. Other flags: `isDraft`, `isPinned`, `isArchived`.
- Tags are global and unique, lowercased + trimmed, max 10 per post; saving = upsert `Tag` + create `PostTag` (ERR-010). APIs include `{ tags: { include: { tag: true } } }` and return flat `tags: Tag[]` via `transformPostTags`.
- Quill HTML is sanitized on write (`sanitizePostContent`) and again on read in `getPostDetail`: only Quill's `ql-*` classes survive and links get `rel="nofollow ugc noopener noreferrer"`. Plain text that enters Quill as a string (URL params, search excerpts) goes through `escapeHtml` first (ERR-SEC-001). Field limits live in `src/lib/post-form.ts` (content ≤ 200k after sanitizing, cover an http(s) URL or site path ≤ 2000, …); tags go through TagInput's `cleanTagName` and are de-duplicated.
- Server-side calendar buckets (day, month, year, "this month", streaks, `Post.date`) are Istanbul time: `getIstanbul{Day,Month,Year}Start`, `getIstanbulDateParts`, `getIstanbulDateKey` (`src/lib/number-format.ts`), `buildActivityBuckets` (`src/lib/admin-buckets.ts`), `timeZone: "Europe/Istanbul"` in `toLocale*` — never the local `Date` getters (ERR-DATA-014).
- Post: only title, category and content are required; `image` may be `""` (render through `getPostImageSrc`), `creator`/`years` null.
- Comments: `CommentLike` (2026-10-13; production needs the table, ERR-DB-005 — until then `src/lib/comments.ts` serves comments without likes and the like API answers 503). GET `/api/posts/[id]/comments` pages ROOT comments newest first with all their replies (`{ items, nextCursor, total }`); replies are capped at 12 levels on write (`resolveReplyParent`, `src/lib/comment-thread.ts`), so `parentId` is not always the comment being answered. Deleting a comment deletes the notifications of its whole branch. `@username` mentions are parsed in `src/lib/mentions.ts`.
- Notification types and `referenceId`: `follow` (actor id, at most once per follower per 24 h), `like` (`postId:actorId`), `comment` and `mention` (comment id), `comment_like` (`commentId:actorId`). GET `/api/notifications` pages with `?cursor=` → `{ notifications, unreadCount, total, nextCursor }` (total on the first page); `?countOnly=1` → `{ unreadCount }` for the AppShell badge.
- Local composer drafts live under `digynotes-draft:<userId>[:<postId>]` (`src/lib/local-drafts.ts`); sign-out calls `clearAllLocalDrafts()`.
- `/notes` lists page with a cursor, so numbers never come from the loaded slice (ERR-DATA-013): first pages ask `/api/posts?…&summary=1` (`{ total, avgRating, thisMonth }`, month in Istanbul time) and the main list adds `pinned=first` (all pinned matches on page one, the cursor stream skips them; `applySortFilter(…, { pinnedFirst })` keeps them on top in the default order). Drafts and archive page the same way.
- Profiles: first 30 notes from `getProfilePageData`, the rest from `GET /api/users/[username]/posts?offset=` (same visibility). Public surfaces (profile, Keşfet cards) never show `lastLoginAt`; they show `lastNoteAt` (newest published note, relative). Counts and stats (`/api/users/me/stats`, year in review, community stats, Keşfet) cover published notes only (`isDeleted: false, isDraft: false`).
- Collections list and count only published notes (trashed ones stay linked and return on restore). List loaders and cards use `omit: { content: true }` — the note HTML only goes to the note page.
- `externalRating` is TMDB 0–10 for films/series and Metacritic/20 (0–5) for games; display through `getExternalRatingMeta(category)` (`src/lib/external-rating.ts`).
- Indexes added 2026-10-21 (`follows(followingId, createdAt)`, `post_tags(tagId)`, `post_likes(userId, createdAt)`, `bookmarks(userId, createdAt)` + `(postId)`, `activity_logs(createdAt)` + `(userId, createdAt)`) must be applied on Neon by the owner with `CREATE INDEX CONCURRENTLY IF NOT EXISTS …` (names as Prisma generates them); missing indexes only cost speed.
- Recommendations: `src/lib/recommendations.ts` (tested) scores other people's public notes (two candidate pools: up to 200 sharing a tag, 100 sharing only a category) by weighted tag overlap + category share, skips titles you already noted, caps 4 per author, and returns a `recommendationReason` line per note.

## Design System — "Cinémathèque" (2026-10)

Tokens: `src/styles/theme-variables.css`. Dark (default) = warm ink; light = bone paper via `html.light` (`ThemeProvider`, localStorage `dn_theme`).

| Token | Dark / Light |
| --- | --- |
| `--bg-base` · `--bg-card` · `--bg-raised` | `#0b0b0a` `#131311` `#1c1b18` / `#f1ede4` `#faf8f3` `#e8e3d8` |
| `--border` (`-subtle`, `-header`) | `#282722` / `#d8d1c3` |
| `--text-primary` · `secondary` · `muted` · `faint` | `#f2efe8` … / `#14130f` … |
| `--gold` = accent | `#b9a8ff` lavender / `#5b42d6` violet |
| `--accent-2` | `#ffb088` apricot / `#b4541f` |
| `--text-on-accent` | ink on lavender / paper on violet |
| `--danger` | `#ff5a4e` / `#d4342a` |

- Use `bg-[var(--bg-card)]`, `text-[var(--text-muted)]`, `border-[var(--border)]`; accent via Tailwind `accent` / `accent-2` with alpha (`bg-accent/10`, `border-accent-2/30`) or `rgb(var(--gold-rgb)/0.2)`; `text-[var(--text-on-accent)]` on accent fills; `ink` (`bg-ink/70`) for theme-independent scrims. Tailwind `gold` / `dn-*` aliases exist but are unused — don't spread them.
- No hex in themed UI. Literal colours only where CSS variables don't resolve — OG images (`OG` in `src/lib/og-fonts.ts`), `manifest.ts`, viewport `themeColor` (ERR-UI-005) — and in the always-dark intro/landing film scenes.
- Fonts (`src/app/layout.tsx`): Schibsted Grotesk `--font-sans` (body + headings); Newsreader `--font-display` / `.dn-display` + `italic` for accent words (opsz axis); JetBrains Mono `.dn-mono` only for numbers, dates, URLs.
- Headlines: tracking no tighter than `-0.04em`; no lone word on the last line (`[text-wrap:balance]`); landing two-part headings live in ONE `MaskLine` (`src/components/landing/Motion.tsx`).
- Signature: serif-italic accent word inside a bold grotesk headline, pill buttons (`rounded-full`), hairline borders, film grain (`.dn-grain`).
- Owner rules:
  - **No eyebrows/kickers above headings** (2026-10-09) — the heading carries the section. `.dn-eyebrow` only for functional labels (notification groups, settings sections), never with `(01)` indexes. `PageHeader`'s `eyebrow` prop is ignored; don't pass it.
  - **No trailing period/dot** on headings or the wordmark (2026-10-10); question marks stay.
  - **Readable labels** (2026-10-09): no tiny uppercase mono labels. Labels/meta/chips are sans, normal case, `font-medium`, min 11px (12–12.5px typical), `--text-muted` or stronger.
  - **Decimal comma** (`4,5` — `formatRating` / `formatRatingFixed` in `src/lib/number-format.ts`); relative times spelled out ("3 saat önce", not "3 sa"); sentences use full month names ("Ekim"), chart axes the short ones.
  - In-page search folds Turkish case with `foldSearchText` (`src/lib/text.ts`): "İstanbul", "ISTANBUL" and "istanbul" match.
  - **No custom cursor** (2026-10-10); normal mouse everywhere, no `data-cursor` labels.
- Wordmark: `src/components/Wordmark.tsx` — grotesk "Digy" + italic "Notes" (always capital N, no dot). The PNG logo is not used in the UI.
- Copy: all UI text Turkish. Headings, subtitles, buttons, tabs and greetings use Turkish Title Case ("Arşivini Başlat", "Giriş Yap", "İyi Geceler"); ve, ile, da/de, ki stay lowercase. Toasts, placeholders and body copy stay sentence case.
- Server-rendered content never ships hidden: framer `initial` on SSR content uses `initial={reduce || hydrating ? false : …}` with `useIsHydrating()` (`src/hooks/useIsHydrating.ts`, ERR-UI-008), and markup that branches on reduced motion uses `useHydratedReducedMotion()` (`src/hooks/useReducedMotion.ts`, ERR-UI-009), not framer's hook. recharts loads lazily (`next/dynamic`, `ssr: false`; see `src/app/stats/StatsCharts.tsx`).
- Motion: animate `transform`/`opacity` only. The page-transition wrapper animates opacity only — transform/filter on an ancestor traps `position: fixed` children (ERR-UI-004). No per-frame width/height/clip-path/filter, no SVG filters on large layers, pause loops off-screen, no `backdrop-blur` on repeated list items (ERR-PERF-001). Honour `useReducedMotion`.
- Landing: `src/components/landing/*` (Hero = pinned scroll-cinema; Lenis + scroll effects live only here). Auth pages: `src/components/AuthShell.tsx`.

## SEO

- Public pages are server-rendered with their data: `posts/[id]` (`getPostDetail`, `src/lib/post-detail.ts`), `profile/[username]` (`getProfilePageData`, `src/lib/profile-data.ts`), `tag/[name]` and `/discover` (`src/lib/public-posts.ts`, `public-users.ts`) read on the server and pass it to the `*Client` component as initial state; the API routes use the same loaders. The root layout passes the server session to `SessionProvider`, otherwise `ConditionalAppShell` renders only a loader for `/discover` and `/profile` on the server. Dates rendered on the server use `timeZone: "Europe/Istanbul"` (hydration).
- JSON-LD: builders in `src/lib/structured-data.ts` (tested), rendered by `src/components/JsonLd.tsx` (escapes `<`). Landing: `WebSite` + `Organization` (no `SearchAction`: there is no public search URL). Note: `Review` with typed `itemReviewed` (Movie, TVSeries, VideoGame, Book, TouristDestination, CreativeWork) when rated, else `Article`; profile: `ProfilePage` + `Person`; `BreadcrumbList` on note, profile, tag, discover. Only for publicly visible content.
- Metadata: `buildPageMetadata` (`src/lib/metadata.ts`) gives title, description, canonical and full share tags; a page's `openGraph` replaces the layout's, so always go through it.
- noindex: private pages get `X-Robots-Tag: noindex` from the proxy (anonymous crawlers are redirected to `/login`, itself noindex); auth, offline, maintenance, 404, `/collections/*`, empty tag pages, private profiles and non-public notes carry `robots: NO_INDEX`. `robots.ts` disallows only `/api/` — don't add private pages there, a blocked URL never shows its noindex.
- `sitemap.ts`: landing, `/discover`, public profiles, public notes, tags with public notes, capped below 50k URLs; regenerated at most hourly (`revalidate = 3600`), so `next build` runs its read-only queries (prefix local builds with the local `DATABASE_URL`; a failed read serves the static entries). Missing notes/profiles render the 404 page with noindex but status 200 (Next 14 + `loading.tsx` streams first).

## Share Previews (WhatsApp, iMessage, X)

- Cards: `src/app/opengraph-image.tsx` (site), `src/app/posts/[id]/opengraph-image.tsx` (note), `src/app/profile/[username]/opengraph-image.tsx` (profile). Node runtime, 1200×630, returned as **JPEG** via `toJpegResponse` (`src/lib/og-image.ts`, pure-JS pngjs + jpeg-js — never sharp). Parts: `src/lib/og-parts.tsx` (`OgWordmark`, `OgStars`, `OgGlow`, `renderOgNotice`).
- Read at phone size (~0.28×): no text under ~26px, no uppercase labels, at most ~5 things to read. Fonts load from disk (`assets/og-fonts/`, listed in `outputFileTracingIncludes` in `next.config.js`), never from Google at render time.
- `og:image` always points at our card with `?v=<updatedAt>`, never at the raw cover. Private or missing content gets a "Bu Not Gizli" / "Bulunamadı" card; drafts and deleted notes are never drawn. Spoiler notes (`hidesSpoilerText`, `src/lib/post-config.ts`) never show their text on the card, in `og:description`, the share sheet or JSON-LD. Cover fetches: ports 80/443 only, DNS checked on every hop, ≤ 3 MB, `cache: "no-store"`.
- In-app: `ShareButton` → `ShareSheet` (real card preview, WhatsApp/Telegram/X, copy, save as image, warning when others can't open the link).
- Details, speed numbers and the curl check: ERR-OG-001.

## Security Headers, PWA

- `next.config.js` sends a baseline CSP (`base-uri`, `object-src`, `frame-ancestors`, `form-action`) without `script-src` — a strict script policy needs a per-request nonce. `images.remotePatterns` has no `**`: a new remote `<Image>` uses `customLoader` / `ResilientImage` or `unoptimized` (ERR-006); list covers can opt into `responsive` (`cdnImageLoader`, TMDB/RAWG sizes).
- `public/sw.js` never caches navigations (pages carry the session); it precaches `/offline` without cookies and runtime-caches only ok same-origin static assets. Bump `CACHE_VERSION` when the caching rules change. Sign-out clears the `*-runtime` caches, recently viewed notes and composer drafts.
