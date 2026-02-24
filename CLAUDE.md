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
| File | Purpose |
|------|---------|
| `ERRORS.md` | Known error log — check here FIRST before debugging |
| `src/lib/prisma.ts` | Prisma singleton with PrismaPg adapter |
| `src/lib/auth.ts` | NextAuth config |
| `src/middleware.ts` | Route protection |
| `src/types/index.ts` | Shared Post, Category, Tag interfaces |
| `src/types/next-auth.d.ts` | Session type augmentation (user.id) |
| `prisma/schema.prisma` | DB schema (datasource has NO `url` field) |
| `prisma.config.ts` | Prisma v7 config — DB URL lives here |

---

## Full Component Inventory
| Component | File | Notes |
|-----------|------|-------|
| `AppShell` | `src/components/AppShell.tsx` | Main nav shell |
| `ConditionalAppShell` | `src/components/ConditionalAppShell.tsx` | Hides shell on `/`, `/login`, `/register` |
| `SessionProviderWrapper` | `src/components/SessionProviderWrapper.tsx` | NextAuth client wrapper |
| `FollowButton` | `src/components/FollowButton.tsx` | Follow/unfollow by username |
| `FollowListModal` | `src/components/FollowListModal.tsx` | Followers/following modal |
| `MediaSearch` | `src/components/MediaSearch.tsx` | TMDB/RAWG/OpenLibrary search, `onSelect` cb |
| `TagInput` | `src/components/TagInput.tsx` | Debounced autocomplete, Enter/comma to add |
| `TagBadge` | `src/components/TagBadge.tsx` | Clickable filter badge, removable |
| `StarRating` | `src/components/StarRating.tsx` | 0–5 stars, 0.5 step |
| `StatusBadge` | `src/components/StatusBadge.tsx` | Post status display |
| `PostsList` | `src/components/PostsList.tsx` | Posts grid/list |
| `UserCard` | `src/components/UserCard.tsx` | User card for discover/profile |
| `SearchBar` | `src/components/SearchBar.tsx` | Search input |
| `SortFilterBar` | `src/components/SortFilterBar.tsx` | Sort/filter controls |
| `StatsPanel` | `src/components/StatsPanel.tsx` | User stats |
| `CommunityStatsCard` | `src/components/CommunityStatsCard.tsx` | Community stats |
| `AddCategoryModal` | `src/components/AddCategoryModal.tsx` | Category creation modal |
| `ConfirmModal` | `src/components/ConfirmModal.tsx` | Generic confirm dialog |
| `FullScreenLoader` | `src/components/FullScreenLoader.tsx` | Loading overlay |

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

## Design System (Dark Premium)
```
bg-base:   #0c0c0c
bg-card:   #161616
border:    #2a2a2a
gold:      #c9a84c  (hover: #e0c068)
text:      #f0ede8  (secondary: #888888, muted: #555555)
danger:    #e53e3e
```
Profile/social pages: `#0c0e16` / `#0d0f1a` / `#1a1e2e` (blue-tinted dark).

---

## Frontend UI Rules (Vibe Coding)

### Önce Yapı, Sonra Kod
- Yeni bir sayfa/section yazmadan önce layout'u bir comment bloğu olarak tanımla
- `/* LAYOUT: İki kolon desktop, sol sidebar w-64, sağ flex-1, gap-6 */`
- Yapı netleştikten sonra JSX yaz — asla rastgele başlama

### Mevcut Componenti Referans Al
Yeni bir şey yazmadan önce en yakın mevcut component'ı oku, onun spacing/border/hover stilini takip et:
- İçerik kartı → `PostsList.tsx`
- Kullanıcı satırı → `UserCard.tsx`
- Modal → `ConfirmModal.tsx` veya `FollowListModal.tsx`
- Form sayfası → `src/app/profile/settings/page.tsx`

### Renk Kuralları
- Tailwind default renk isimleri (`blue-500`, `gray-800`) **yasak** — anında "AI yaptı" teli
- Sadece DigyNotes hex paleti kullanılır (bkz. Design System bölümü)
- Palette dışına çıkma — referans görseldeki renkler bile olsa

### Yasaklı Kalıplar
- `from-purple-500 to-blue-600` tipi jenerik AI gradyanları
- `shadow-lg` / `shadow-xl` — DigyNotes gölge değil border kullanır
- `bg-white`, `text-gray-*`, `rounded-full` (avatar dışında)
- Emoji UI ikonu olarak, Lucide React ikonları (AI teli)
- `p-2` kart padding'i — minimum `p-4`, standart `p-6`

### Tipografi Skalası
- Sayfa başlığı: `text-2xl font-bold text-[#f0ede8]`
- Bölüm başlığı: `text-xl font-semibold text-[#f0ede8]`
- Kart başlığı: `text-base font-medium text-[#f0ede8]`
- Gövde: `text-sm text-[#888888]`
- Meta/tarih: `text-xs text-[#555555]`

### Tıklanabilir Her Element
- Mutlaka: `transition-colors duration-200 cursor-pointer`
- Hover state, `active:scale-95`, `disabled:opacity-50 disabled:cursor-not-allowed`
- Hiçbir interaktif element geçişsiz bırakılmaz

### İkon Kütüphanesi
- Lucide **kullanma** — Phosphor kullan: `npm install @phosphor-icons/react`
- `import { Star, House, BookOpen } from '@phosphor-icons/react'`
- Phosphor kurulu değilse inline SVG yaz, Lucide kurma

### Referans Görsel Geldiğinde
- Yapısını al (kolon sayısı, hiyerarşi, boşluk ritmi)
- Renklerini alma — her zaman DigyNotes paleti geçerli
- "Bu stili kopyala" = yapı + spacing + hiyerarşiyi al, renkleri çevir

### Font
- Şu an: `Inter` (global AI teli — `src/app/layout.tsx`)
- Upgrade adayları: `DM Sans`, `Plus Jakarta Sans`, `Sora` (onay alarak değiştir)

---

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
