# DigyNotes — Claude Code Project Rules

## Stack
- **Framework**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **DB**: PostgreSQL (Homebrew v16) via Prisma ORM v7
- **Prisma adapter**: `@prisma/adapter-pg` (required — plain `new PrismaClient()` will NOT work)
- **Auth**: NextAuth v4 (credentials + JWT), config in `src/lib/auth.ts`
- **Editor**: react-quill — always `dynamic(..., { ssr: false })`

## Key Files
| File | Purpose |
|------|---------|
| `src/lib/prisma.ts` | Prisma singleton with PrismaPg adapter |
| `src/lib/auth.ts` | NextAuth config |
| `src/middleware.ts` | Route protection |
| `src/types/index.ts` | Shared Post, Category, Tag interfaces |
| `prisma/schema.prisma` | DB schema (datasource has NO `url` field) |
| `prisma.config.ts` | Prisma v7 config — DB URL lives here |

## API Routes
```
GET/POST   /api/posts
GET/PUT/DELETE /api/posts/[id]
GET/POST   /api/categories
GET/PUT/DELETE /api/categories/[id]
GET        /api/tags?q=...
GET/POST/DELETE /api/follows
GET/PUT    /api/users/me
GET        /api/users/[username]
GET        /api/users/[username]/followers
GET        /api/users/[username]/following
GET        /api/users/search
```

## Design System (Dark Premium)
```
bg-base:   #0c0c0c
bg-card:   #161616
border:    #2a2a2a
gold:      #c9a84c  (hover: #e0c068)
text:      #f0ede8  (secondary: #888888, muted: #555555)
danger:    #e53e3e
```
Profile pages use a slightly different blue-tinted dark: `#0c0e16` / `#0d0f1a` / `#1a1e2e`.

## Architecture Patterns

### Database
- All API routes use `prisma` from `src/lib/prisma.ts`
- After `prisma db push` + `prisma generate`, **restart dev server** — new models are undefined until restart
- DB: host=localhost, db=digynotes, user=digynotes, pw=digynotes_secret (port 5432)
- Docker NOT installed — use Homebrew PostgreSQL

### Auth
- Protected routes: `/notes/**`, `/new-post`, `/posts/**`, `/category/**`, `/api/posts/**`, `/api/categories/**`
- Session has `user.id` (augmented in `src/types/next-auth.d.ts`)
- Get userId in API: `(session.user as { id: string }).id`

### Data
- `Post.userId` and `Category.userId` are nullable `String?` (legacy)
- Category routing: `/category/[id]` uses category **name**, not DB id
- Tags: global (shared), max 10 per post, lowercase unique name

### Components
- `FollowButton` — follow/unfollow a user by username
- `FollowListModal` — shows followers or following list in a modal
- `MediaSearch` — external API search (TMDB/RAWG/OpenLibrary), `onSelect` callback
- `TagInput` — debounced autocomplete, Enter/comma to add
- `TagBadge` — clickable for filtering, removable
- `StarRating` — interactive 0–5 stars, 0.5 step increments
- `StatusBadge` — displays post status
- `ConditionalAppShell` — hides AppShell on `/`, `/login`, `/register`
- `SessionProviderWrapper` — client-side NextAuth SessionProvider

## Public Profile System
- `isPublic: false` by default — users must opt-in via `/profile/settings`
- `/profile/[username]` — public profile page
- `/discover` — public user discovery

## Coding Conventions
- Use `"use client"` at top of client components
- Use `next/image` with `unoptimized` + custom loader for external images
- Tailwind classes only — no CSS modules
- Turkish UI text throughout the app
- API error responses: `{ error: string }` with appropriate HTTP status
- No Docker — local PostgreSQL only

## Local Dev Commands
```bash
# Start dev server
npm run dev

# DB operations
npx prisma db push --accept-data-loss   # push schema (Neon cloud DB)
npx prisma generate                      # regenerate client
npx prisma studio                        # DB GUI

# PostgreSQL (if needed)
brew services start postgresql@16
brew services stop postgresql@16
```

## Common Gotchas
1. After schema changes: always `prisma generate` + restart dev server
2. `prisma.follow` undefined at runtime → server not restarted after schema push
3. `_count.select` with new relation fields → restart first, or use `prisma.follow.count()` separately
4. `MediaSearch` after selection: `skipNextSearchRef.current = true` + `setResults([])` prevents dropdown re-opening
5. The `[username]` folder under `src/app/api/users/` handles both the main profile and sub-routes (followers, following)
