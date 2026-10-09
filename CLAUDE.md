# DigyNotes — Claude Code Project Rules

## Self-Improvement Protocol

**CRITICAL: Claude MUST follow these rules every session:**

1. Before starting any task → read `ERRORS.md` to check for known solutions
2. When an error is encountered and solved → append it to `ERRORS.md` immediately
3. When the same error appears again → consult `ERRORS.md` first, apply known fix, do NOT repeat the investigation
4. When a new pattern/architecture decision is confirmed → update `MEMORY.md` accordingly
5. Keep `ERRORS.md` and `MEMORY.md` updated as the single source of truth for this project

---

## Stack

- **Framework**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **DB**: PostgreSQL (Homebrew v16) via Prisma ORM v7
- **Prisma adapter**: `@prisma/adapter-pg` (required — plain `new PrismaClient()` will NOT work)
- **Auth**: NextAuth v4 (credentials + JWT), config in `src/lib/auth.ts`
- **Editor**: react-quill — always `dynamic(..., { ssr: false })`

---

## Key Files

| File                       | Purpose                                             |
| -------------------------- | --------------------------------------------------- |
| `ERRORS.md`                | Known error log — check here FIRST before debugging |
| `src/lib/prisma.ts`        | Prisma singleton with PrismaPg adapter              |
| `src/lib/auth.ts`          | NextAuth config                                     |
| `src/middleware.ts`        | Route protection                                    |
| `src/types/index.ts`       | Shared Post, Category, Tag interfaces               |
| `src/types/next-auth.d.ts` | Session type augmentation (user.id)                 |
| `prisma/schema.prisma`     | DB schema (datasource has NO `url` field)           |
| `prisma.config.ts`         | Prisma v7 config — DB URL lives here                |

---

## Full Component Inventory

| Component                | File                                        | Notes                                       |
| ------------------------ | ------------------------------------------- | ------------------------------------------- |
| `AppShell`               | `src/components/AppShell.tsx`               | Main nav shell                              |
| `ConditionalAppShell`    | `src/components/ConditionalAppShell.tsx`    | Hides shell on `/`, `/login`, `/register`   |
| `SessionProviderWrapper` | `src/components/SessionProviderWrapper.tsx` | NextAuth client wrapper                     |
| `FollowButton`           | `src/components/FollowButton.tsx`           | Follow/unfollow by username                 |
| `FollowListModal`        | `src/components/FollowListModal.tsx`        | Followers/following modal                   |
| `MediaSearch`            | `src/components/MediaSearch.tsx`            | TMDB/RAWG/OpenLibrary search, `onSelect` cb |
| `TagInput`               | `src/components/TagInput.tsx`               | Debounced autocomplete, Enter/comma to add  |
| `TagBadge`               | `src/components/TagBadge.tsx`               | Clickable filter badge, removable           |
| `StarRating`             | `src/components/StarRating.tsx`             | 0–5 stars, 0.5 step                         |
| `StatusBadge`            | `src/components/StatusBadge.tsx`            | Post status display                         |
| `PostsList`              | `src/components/PostsList.tsx`              | Posts grid/list                             |
| `UserCard`               | `src/components/UserCard.tsx`               | User card for discover/profile              |
| `SearchBar`              | `src/components/SearchBar.tsx`              | Search input                                |
| `SortFilterBar`          | `src/components/SortFilterBar.tsx`          | Sort/filter controls                        |
| `StatsPanel`             | `src/components/StatsPanel.tsx`             | User stats                                  |
| `CommunityStatsCard`     | `src/components/CommunityStatsCard.tsx`     | Community stats                             |
| `AddCategoryModal`       | `src/components/AddCategoryModal.tsx`       | Category creation modal                     |
| `ConfirmModal`           | `src/components/ConfirmModal.tsx`           | Generic confirm dialog                      |
| `FullScreenLoader`       | `src/components/FullScreenLoader.tsx`       | Loading overlay                             |
| `KeyboardShortcuts`      | `src/components/KeyboardShortcuts.tsx`      | Global keyboard shortcuts (N/S/H/F/D/?)     |
| `ShortcutHelpModal`      | `src/components/ShortcutHelpModal.tsx`      | Keyboard shortcut help overlay              |
| `ScrollToTop`            | `src/components/ScrollToTop.tsx`            | Scroll-to-top floating button               |
| `RecentlyViewed`         | `src/components/RecentlyViewed.tsx`         | Recently viewed posts (localStorage)        |
| `PasswordStrength`       | `src/components/PasswordStrength.tsx`       | Password strength indicator                 |

---

## API Routes

```
GET/POST        /api/posts
GET/PUT/DELETE  /api/posts/[id]
GET             /api/posts/related
GET             /api/public/posts
GET/POST        /api/categories
GET/PUT/DELETE  /api/categories/[id]
GET             /api/tags?q=...
GET/POST/DELETE /api/follows
GET/PUT         /api/users/me
GET             /api/users/[username]
GET             /api/users/[username]/followers
GET             /api/users/[username]/following
GET             /api/users/search
GET             /api/feed
GET             /api/recommendations
GET             /api/community/stats
GET             /api/users/me/year-in-review?year=YYYY
```

---

## Page Routes

```
/              — Landing (public, no AppShell)
/login         — Login
/register      — Register
/notes         — Home (protected)
/new-post      — Create post (protected)
/posts/[id]    — Post detail (protected)
/posts/[id]/edit — Edit post (protected)
/category/[id] — Category posts ([id] = category NAME)
/tag/[name]    — Tag posts
/feed          — Following feed
/recommended   — Recommended posts
/discover      — User discovery (public)
/profile/[username] — Public profile
/profile/settings  — Profile settings (protected)
```

---

## Design System — "Cinémathèque" (2026-10 redesign)

The old "Dark Premium" gold palette and the Turkish UI rules that referenced it are retired.
All colours come from CSS variables in `src/styles/theme-variables.css` (dark = warm ink, light = bone paper).

```
bg-base   var(--bg-base)    #0b0b0a / #f1ede4
bg-card   var(--bg-card)    #131311 / #faf8f3
border    var(--border)     #282722 / #d8d1c3
text      var(--text-primary) #f2efe8 / #14130f  (secondary, muted, faint)
accent    var(--gold)       #d4f53c (acid lime) / #4f7300 (olive)  → Tailwind `accent`, `gold`
accent-2  var(--accent-2)   #b1a4ff (lilac) / #5b46d8
on-accent var(--text-on-accent)  ink on lime (dark) / paper on olive (light)
```

- Alpha variants: use Tailwind `bg-accent/10`, `border-accent-2/30` or `rgb(var(--gold-rgb)/0.2)` — never hardcode hex.
- Fonts: Hanken Grotesk (sans, `--font-sans`), Instrument Serif (`.dn-display`, italic accents), JetBrains Mono (`.dn-mono`, index labels/meta).
- Signature patterns: mono index labels `(01)`, serif-italic accent word inside bold grotesk headlines, lime period/dot, pill buttons (`rounded-full`), hairline borders, film grain (`.dn-grain`).
- Logo: `src/components/Wordmark.tsx` (typographic) — the PNG logo is no longer used in the UI.
- Landing: `src/components/landing/*` (Lenis smooth scroll + framer-motion scroll effects). Auth: `src/components/AuthShell.tsx`.

## Architecture Patterns

### Database

- All API routes use `prisma` from `src/lib/prisma.ts`
- **After `prisma db push` + `prisma generate`, ALWAYS restart dev server** — new models are undefined until restart
- DB: host=localhost, db=digynotes, user=digynotes, pw=digynotes_secret (port 5432)
- Docker NOT installed — use Homebrew PostgreSQL

### Prisma v7 Rules

- `schema.prisma` datasource has NO `url` field — URL lives in `prisma.config.ts`
- PrismaClient MUST use PrismaPg adapter (see `src/lib/prisma.ts`)
- `_count.select` with new relation fields fails until server restart → use `prisma.modelName.count()` separately

### Auth

- Protected routes: `/notes/**`, `/new-post`, `/posts/**`, `/category/**`, `/api/posts/**`, `/api/categories/**`
- Session has `user.id` (augmented in `src/types/next-auth.d.ts`)
- Get userId in API: `(session.user as { id: string }).id`

### Data

- `Post.userId` and `Category.userId` are nullable `String?` (legacy)
- Category routing: `/category/[id]` uses category **name**, not DB id
- Tags: global (shared), max 10 per post, lowercase unique name
- Posts API includes: `{ tags: { include: { tag: true } } }` → transform to flat `tags: Tag[]`

### MediaSearch Component

- After selection: set `skipNextSearchRef.current = true` + `setResults([])` to prevent dropdown re-opening
- Props: `onSelect` callback receives selected media object

### External Images

- Always use `next/image` with `unoptimized` prop for external URLs
- Or provide a custom loader function

---

## Coding Conventions

- `"use client"` at top of every client component (forget this → hydration errors)
- Tailwind classes only — no CSS modules or inline styles
- Turkish UI text throughout the app
- API error responses: `{ error: string }` with appropriate HTTP status
- No Docker — local PostgreSQL only
- react-quill: always `dynamic(() => import('react-quill'), { ssr: false })`

---

## Local Dev Commands

```bash
# Start dev server
npm run dev

# DB operations
npx prisma db push --accept-data-loss   # push schema changes
npx prisma generate                      # regenerate client after schema change
npx prisma studio                        # DB GUI

# PostgreSQL (if needed)
brew services start postgresql@16
brew services stop postgresql@16
```

---

## Common Gotchas (quick reference — details in ERRORS.md)

1. `prisma.follow undefined` → restart dev server after schema push → **ERR-001**
2. `_count.select` fails with new relations → restart first → **ERR-002**
3. react-quill SSR crash → use `dynamic(..., { ssr: false })` → **ERR-003**
4. MediaSearch dropdown re-opens after selection → use `skipNextSearchRef` → **ERR-004**
5. `[username]` folder handles profile + followers/following sub-routes → **ERR-005**
6. External images broken → add `unoptimized` to `next/image` → **ERR-006**
7. Missing `"use client"` on client components → hydration errors → **ERR-007**
8. Category `[id]` param = category NAME, not DB id → **ERR-008**
9. `new PrismaClient()` without adapter fails in Prisma v7 → **ERR-009**
10. Tags not persisting → must upsert Tag + create PostTag join records → **ERR-010**
