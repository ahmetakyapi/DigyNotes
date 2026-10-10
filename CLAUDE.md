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
- **Production DB guard.** Cloud shells export a production (Neon) `DATABASE_URL` and dotenv never overrides it (ERR-ENV-002). Never run `prisma db push`/`migrate`, seeds or `npm run dev` against it; for local work prefix commands with `DATABASE_URL=postgresql://digynotes:digynotes_secret@localhost:5432/digynotes`. Never read `.env*`.
- Path-scoped rules load automatically: `api-routes.md` (API), `components.md` (`.tsx`), `prisma-schema.md` (Prisma), `security.md` (always).

## Stack

- Next.js 14.0.4 App Router · React 18 · TypeScript · Tailwind 3.
- Prisma 7 + `@prisma/adapter-pg` → PostgreSQL. Local: Homebrew `postgresql@16` (no Docker on the owner's machine; `docker-compose.yml` mirrors the same creds) — db/user `digynotes`, pw `digynotes_secret`, port 5432. Production: Neon eu-central-1.
- Vercel, functions pinned to `fra1` in `vercel.json` (next to Neon and Turkish users; the default `iad1` added ~1.2 s per DB round trip).
- NextAuth v4 credentials + JWT: `src/lib/auth.ts`.
- react-quill editor · framer-motion · Lenis (landing only) · recharts · react-hot-toast · sanitize-html · `@phosphor-icons/react`.
- Media search: TMDB, RAWG, Open Library (`src/components/MediaSearch.tsx`).

## Commands

```bash
npm run dev        # scripts/restart-local-4300.sh: stops running DigyNotes dev servers, wipes .next, starts on :4300
npm run typecheck  # prisma generate + tsc -p tsconfig.typecheck.json
npm run lint       # eslint, --max-warnings=0
npm test           # node:test suites in tests/*.test.mjs (pure src/lib helpers)
npm run format     # prettier + tailwind class sort
npm run db:push | db:generate | db:studio
brew services start|stop postgresql@16
```

Env names (values never in docs): `DATABASE_URL`, `NEXTAUTH_URL` (local `http://localhost:4300`), `NEXTAUTH_SECRET`, `NEXT_PUBLIC_TMDB_API_KEY`, `NEXT_PUBLIC_RAWG_API_KEY`, `NEXT_PUBLIC_SITE_URL`; optional `UPSTASH_REDIS_REST_URL`/`_TOKEN` (rate-limit store, in-memory fallback), `ENABLE_ADMIN_BOOTSTRAP`.

## Code Map

- Pages `src/app/**/page.tsx` (heavy client logic in a sibling `*Client.tsx`); APIs `src/app/api/**/route.ts` — list them with `find src/app -name route.ts`, don't keep inventories here.
- `src/lib/`: `prisma.ts` (the only PrismaClient), `auth.ts`, `api-server.ts` (`requireAuth`, `requireAdmin`, `handleApiError`, `safeParseBody`), `api-utils.ts` (`transformPostTags`, `sanitizePostContent`, field sanitizers), `rate-limit.ts`, `post-access.ts`, `categories.ts`, `metadata.ts` (`getSiteUrl`), `og-*`.
- `src/types/index.ts` shared types; `src/types/next-auth.d.ts` adds `session.user.id`.
- `src/components/ConditionalAppShell.tsx` decides the shell: never on `/`, `/login`, `/register`, `/offline`; `/discover`, `/profile`, `/collections` get it only when signed in.

## Auth & Access

- The `matcher` in `src/middleware.ts` is the single source of truth for protected routes; add every new private page or API there. It covers notes, new-post, `posts/*/edit`, category, feed, recommended, collections, watchlist, stats, notifications, profile/settings, admin, and the posts, categories, tags, bookmarks, watchlist, collections, follows, feed, recommendations, notifications, `users/me` and admin APIs.
- Public: landing, auth pages, `/discover`, `/profile/[username]`, `/tag/[name]`, `/posts/[id]` (visibility via `getPostReadAccess`: owner, admin, or public author), `/api/public`, `/api/search`, `/api/users/[username]/**`, `/api/users/search`, `/api/community/stats`, `/api/auth/*`.
- Admin = `User.isAdmin` + `requireAdmin()`. `/api/admin/setup` bootstraps only outside production unless `ENABLE_ADMIN_BOOTSTRAP=true`.
- Maintenance mode (`SiteSettings.maintenanceMode`, `MaintenanceGuard`) only applies to middleware-matched routes: it reads the `x-pathname` header the middleware sets.

## Data Rules

- `Post.userId` and `Category.userId` are nullable (legacy).
- `Post.category` is a normalized string (`normalizeCategory`; fixed slugs `movies series game book travel other` in `src/lib/categories.ts`), not a FK. `/category/[id]` takes that **name**, not a DB id (ERR-008).
- Posts are soft-deleted (`isDeleted` + `deletedAt`); list queries filter `isDeleted: false`. Other flags: `isDraft`, `isPinned`, `isArchived`.
- Tags are global and unique, lowercased + trimmed, max 10 per post; saving = upsert `Tag` + create `PostTag` (ERR-010). APIs include `{ tags: { include: { tag: true } } }` and return flat `tags: Tag[]` via `transformPostTags`.
- Quill HTML is sanitized on write (`sanitizePostContent`).

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
  - **Decimal comma** (`4,5` — `toFixed(1).replace(".", ",")`); relative times spelled out ("3 saat önce", not "3 sa").
  - **No custom cursor** (2026-10-10); normal mouse everywhere, no `data-cursor` labels.
- Wordmark: `src/components/Wordmark.tsx` — grotesk "Digy" + italic "Notes" (always capital N, no dot). The PNG logo is not used in the UI.
- Copy: all UI text Turkish. Headings, subtitles, buttons, tabs and greetings use Turkish Title Case ("Arşivini Başlat", "Giriş Yap", "İyi Geceler"); ve, ile, da/de, ki stay lowercase. Toasts, placeholders and body copy stay sentence case.
- Motion: animate `transform`/`opacity` only. The page-transition wrapper animates opacity only — transform/filter on an ancestor traps `position: fixed` children (ERR-UI-004). No per-frame width/height/clip-path/filter, no SVG filters on large layers, pause loops off-screen, no `backdrop-blur` on repeated list items (ERR-PERF-001). Honour `useReducedMotion`.
- Landing: `src/components/landing/*` (Hero = pinned scroll-cinema; Lenis + scroll effects live only here). Auth pages: `src/components/AuthShell.tsx`.

## Share Previews (WhatsApp, iMessage, X)

- Cards: `src/app/opengraph-image.tsx` (site), `src/app/posts/[id]/opengraph-image.tsx` (note), `src/app/profile/[username]/opengraph-image.tsx` (profile). Node runtime, 1200×630, returned as **JPEG** via `toJpegResponse` (`src/lib/og-image.ts`, pure-JS pngjs + jpeg-js — never sharp). Parts: `src/lib/og-parts.tsx` (`OgWordmark`, `OgStars`, `OgGlow`, `renderOgNotice`).
- Read at phone size (~0.28×): no text under ~26px, no uppercase labels, at most ~5 things to read. Fonts load from disk (`assets/og-fonts/`, listed in `outputFileTracingIncludes` in `next.config.js`), never from Google at render time.
- `og:image` always points at our card with `?v=<updatedAt>`, never at the raw cover. Private or missing content gets a "Bu Not Gizli" / "Bulunamadı" card; drafts and deleted notes are never drawn.
- In-app: `ShareButton` → `ShareSheet` (real card preview, WhatsApp/Telegram/X, copy, save as image, warning when others can't open the link).
- Details, speed numbers and the curl check: ERR-OG-001.
