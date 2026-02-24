# DigyNotes — Error Log & Solutions

> **Claude Protocol**: Before debugging any error, search this file by symptom or error code.
> When a new error is solved, append it here immediately using the template below.
> Never investigate a known error from scratch — apply the documented fix directly.

---

## Template for New Errors

```
## ERR-XXX: Short descriptive title
**First seen**: YYYY-MM-DD
**Symptom**: Exact error message or unexpected behavior description
**Root cause**: Why this happens
**Fix**: Step-by-step solution
**Prevention**: How to avoid in the future
**Files**: Relevant file paths
```

---

## ERR-001: `prisma.follow` (or any new model) undefined at runtime

**First seen**: 2024-12
**Symptom**: `TypeError: Cannot read properties of undefined (reading 'findMany')` or `prisma.follow is not a function`
**Root cause**: After `prisma db push` + `prisma generate`, the Next.js dev server still uses the old Prisma client bundle in memory. New models don't exist until the server process restarts.
**Fix**:

```bash
npx prisma db push --accept-data-loss
npx prisma generate
# Then restart the dev server: Ctrl+C → npm run dev
```

**Prevention**: Always restart dev server after any schema change. No exceptions.
**Files**: `prisma/schema.prisma`, `src/lib/prisma.ts`

---

## ERR-002: `_count.select` fails with new relation fields

**First seen**: 2024-12
**Symptom**: Prisma query with `_count: { select: { followers: true } }` returns error or wrong results after adding a new relation
**Root cause**: Same as ERR-001 — stale Prisma client in memory doesn't know about new relations in `_count`
**Fix**: Restart dev server first. As a workaround before restart, use separate count query:

```typescript
// Instead of _count.select:
const count = await prisma.follow.count({ where: { followingId: userId } });
```

**Prevention**: Restart after schema changes. Prefer `prisma.model.count()` for new relations in development.
**Files**: Any API route using `_count.select` with new relation fields

---

## ERR-003: react-quill SSR crash / `document is not defined`

**First seen**: 2024-11
**Symptom**: `ReferenceError: document is not defined` on any page using react-quill
**Root cause**: react-quill accesses `document` on import — fails in Next.js server-side rendering
**Fix**: Always load react-quill with dynamic import:

```typescript
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
```

**Prevention**: Never import react-quill directly at the top of a file. Always use `dynamic`.
**Files**: `src/app/new-post/page.tsx`, `src/app/posts/[id]/edit/page.tsx`

---

## ERR-004: MediaSearch dropdown re-opens after item selection

**First seen**: 2024-12
**Symptom**: User selects a search result, but the dropdown immediately reappears showing previous results
**Root cause**: Selecting an item updates state (e.g. sets a field value), which triggers a re-render, which re-evaluates the search query and reopens the dropdown
**Fix**: Use a ref flag to skip the next search after selection:

```typescript
const skipNextSearchRef = useRef(false);

// In onSelect handler:
skipNextSearchRef.current = true;
setResults([]);

// In search useEffect:
if (skipNextSearchRef.current) {
  skipNextSearchRef.current = false;
  return;
}
```

**Prevention**: Always implement this pattern in any search-with-autocomplete component.
**Files**: `src/components/MediaSearch.tsx`

---

## ERR-005: 404 on `/api/users/[username]/followers` or `/following`

**First seen**: 2024-12
**Symptom**: API returns 404 for follower/following sub-routes under a username
**Root cause**: Confusion about Next.js nested dynamic routes. The `[username]` folder under `src/app/api/users/` must contain both the main route AND sub-route folders.
**Fix**: File structure must be:

```
src/app/api/users/
  [username]/
    route.ts           ← handles GET /api/users/[username]
    followers/
      route.ts         ← handles GET /api/users/[username]/followers
    following/
      route.ts         ← handles GET /api/users/[username]/following
```

**Prevention**: When adding sub-routes under a dynamic segment, always create nested folders inside the dynamic segment folder.
**Files**: `src/app/api/users/[username]/`

---

## ERR-006: External images not displaying (next/image broken)

**First seen**: 2024-12
**Symptom**: Images from external URLs (TMDB, RAWG, etc.) don't load; error about unconfigured hostname
**Root cause**: Next.js `Image` component restricts external domains by default
**Fix**: Add `unoptimized` prop to bypass optimization for external images:

```tsx
<Image src={externalUrl} unoptimized alt="..." width={...} height={...} />
```

Or add the domain to `next.config.js` images config.
**Prevention**: Always use `unoptimized` for external image URLs, or configure domains upfront.
**Files**: Any component rendering external images

---

## ERR-007: Hydration error / `"use client"` missing

**First seen**: 2024-11
**Symptom**: `Error: Hydration failed because the initial UI does not match what was rendered on the server`; or hooks (useState, useEffect) throwing errors
**Root cause**: Client-only hooks/features used in a Server Component (missing `"use client"` directive)
**Fix**: Add `"use client"` as the very first line of the file (before any imports):

```typescript
"use client";

import React, { useState } from 'react';
// ...
```

**Prevention**: Any file using React hooks, browser APIs, or event handlers needs `"use client"`.
**Files**: Any client component

---

## ERR-008: Category page shows wrong posts / category not found

**First seen**: 2024-11
**Symptom**: `/category/[id]` shows no posts or wrong category despite category existing
**Root cause**: The `[id]` route parameter holds the category **name** (not the DB `id` field). API filter uses name, not id.
**Fix**: Use category name as the URL param and filter:

```typescript
// In page: params.id === category name (e.g. "Filmler")
// API call: GET /api/posts?category=Filmler
// In API: WHERE category.name = categoryName
```

**Prevention**: Remember: `/category/[id]` — the param is the name. Don't query by DB numeric/UUID id.
**Files**: `src/app/category/[id]/page.tsx`, `src/app/category/[id]/CategoryPageClient.tsx`, `src/app/api/posts/route.ts`

---

## ERR-009: Prisma v7 — `new PrismaClient()` fails / adapter error

**First seen**: 2024-11
**Symptom**: `Error: PrismaClient is unable to run in this environment` or DB connection fails
**Root cause**: Prisma v7 requires an explicit driver adapter. Plain `new PrismaClient()` doesn't work.
**Fix**: Always use the PrismaPg adapter pattern from `src/lib/prisma.ts`:

```typescript
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
```

**Prevention**: Never instantiate PrismaClient directly. Always import `prisma` from `src/lib/prisma.ts`.
**Files**: `src/lib/prisma.ts`

---

## ERR-010: Tags not saving / disappearing after post save

**First seen**: 2024-12
**Symptom**: Tags appear in the UI but are not persisted; or tags are lost after editing a post
**Root cause**: Tags use a many-to-many join table (`PostTag`). Must upsert the `Tag` record first, then create the `PostTag` join record. Simply setting tag names doesn't work.
**Fix**: In the API handler:

```typescript
// For each tag name:
const tag = await prisma.tag.upsert({
  where: { name: tagName.toLowerCase() },
  update: {},
  create: { name: tagName.toLowerCase() },
});
await prisma.postTag.create({
  data: { postId, tagId: tag.id },
});
```

When updating a post, first delete existing PostTag records, then recreate:

```typescript
await prisma.postTag.deleteMany({ where: { postId } });
// then re-create tags as above
```

**Prevention**: Always handle the full Tag + PostTag upsert flow. Tags are global — use `upsert` not `create`.
**Files**: `src/app/api/posts/route.ts`, `src/app/api/posts/[id]/route.ts`

---

## ERR-011: `prisma.config.ts` — datasource `url` field in schema.prisma

**First seen**: 2024-11
**Symptom**: Prisma CLI errors about missing `url` or schema validation failure
**Root cause**: Prisma v7 moved DB URL config out of `schema.prisma` into `prisma.config.ts`
**Fix**: Ensure `schema.prisma` datasource block has NO `url` field:

```prisma
datasource db {
  provider = "postgresql"
  // NO url field here
}
```

And `prisma.config.ts` exists with:

```typescript
import { defineConfig } from 'prisma/config';
import 'dotenv/config';

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});
```

**Prevention**: Never add `url` to `schema.prisma` datasource in this project.
**Files**: `prisma/schema.prisma`, `prisma.config.ts`

---

## ERR-012: Session `user.id` missing / undefined in API routes

**First seen**: 2024-11
**Symptom**: `session.user.id` is `undefined` in API route handlers
**Root cause**: NextAuth default session type doesn't include `id`. It's augmented in `next-auth.d.ts` but must be cast explicitly in some contexts.
**Fix**: Cast user object when accessing `id`:

```typescript
const session = await getServerSession(authOptions);
if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
const userId = (session.user as { id: string }).id;
```

**Prevention**: Always cast when accessing `session.user.id` in API routes.
**Files**: `src/types/next-auth.d.ts`, all protected API routes

---

---

## TypeScript Errors

### ERR-TS-001: `Property 'X' does not exist on type 'Session'`
**Symptom**: TypeScript error accessing `session.user.id` or other custom session fields
**Root cause**: NextAuth default Session type doesn't include custom fields
**Fix**: The augmentation exists in `src/types/next-auth.d.ts`. If still getting error, cast:
```typescript
const userId = (session.user as { id: string }).id;
```
Or add missing field to `src/types/next-auth.d.ts`:
```typescript
declare module "next-auth" {
  interface Session {
    user: { id: string; name?: string | null; email?: string | null; image?: string | null; };
  }
}
```
**Files**: `src/types/next-auth.d.ts`

---

### ERR-TS-002: `Type '{ params: { id: string } }' is not assignable`
**Symptom**: TypeScript error on dynamic route handler second parameter
**Root cause**: Next.js 14 App Router route handler params typing
**Fix**: Type the second parameter explicitly:
```typescript
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) { ... }
```
**Files**: Any `src/app/api/**/[param]/route.ts`

---

### ERR-TS-003: `Cannot find module '@/...' or its corresponding type declarations`
**Symptom**: TypeScript can't resolve `@/` path aliases
**Root cause**: `tsconfig.json` path not configured, or file doesn't exist yet
**Fix**: Check `tsconfig.json` has:
```json
{
  "compilerOptions": {
    "paths": { "@/*": ["./src/*"] }
  }
}
```
**Files**: `tsconfig.json`

---

### ERR-TS-004: Prisma model type not found after schema change
**Symptom**: `Property 'newModel' does not exist on type 'PrismaClient'`
**Root cause**: `npx prisma generate` not run after schema change, or types not refreshed
**Fix**: Run `npx prisma generate` then restart TypeScript server in IDE (Cmd+Shift+P → "Restart TS Server")
**Files**: `prisma/schema.prisma`

---

## Next.js Build Errors

### ERR-BUILD-001: `Error: Page "/path" is missing "generateStaticParams"`
**Symptom**: Build fails on dynamic routes
**Root cause**: Dynamic segments in `generateStaticParams` required for static export
**Fix**: This project uses server-side rendering, not static export. Ensure `output: 'export'` is NOT in `next.config.js`. If the error persists, add `export const dynamic = 'force-dynamic'` to the page file.

---

### ERR-BUILD-002: `Module not found: Can't resolve 'react-quill'`
**Symptom**: Build fails when react-quill is imported
**Root cause**: react-quill imports browser APIs at module level
**Fix**: Always use dynamic import (see ERR-003). Never import react-quill statically.

---

### ERR-BUILD-003: `useSearchParams() should be wrapped in a Suspense boundary`
**Symptom**: Build/runtime error on pages using `useSearchParams`
**Root cause**: Next.js 14 requires Suspense wrapping for `useSearchParams`
**Fix**: Wrap the component using `useSearchParams` in a `<Suspense>` boundary:
```tsx
import { Suspense } from 'react';
// In parent:
<Suspense fallback={<div>Yükleniyor...</div>}>
  <ComponentUsingSearchParams />
</Suspense>
```

---

### ERR-BUILD-004: `Image with src "..." has either width or height modified`
**Symptom**: Next.js Image warning/error about dimensions
**Root cause**: CSS transforms or parent constraints conflict with `next/image` layout
**Fix**: Use `fill` prop with a positioned parent, or provide exact `width` and `height`:
```tsx
// Option A: exact dimensions
<Image src={url} width={400} height={300} unoptimized alt="..." />
// Option B: fill parent
<div className="relative w-full h-48">
  <Image src={url} fill className="object-cover" unoptimized alt="..." />
</div>
```

---

## Runtime / Browser Errors

### ERR-RT-001: `localStorage is not defined` / `window is not defined`
**Symptom**: SSR crash when accessing browser globals
**Root cause**: Code runs on server during SSR where `window`/`localStorage` don't exist
**Fix**: Guard with environment check or move to `useEffect`:
```typescript
// Option A: guard
if (typeof window !== 'undefined') { localStorage.setItem(...) }
// Option B: useEffect (runs client-only)
useEffect(() => { localStorage.setItem(...) }, []);
```

---

### ERR-RT-002: `fetch` to `/api/...` returns HTML (login page) instead of JSON
**Symptom**: API call returns 200 but body is HTML, `JSON.parse` fails
**Root cause**: The route is protected by middleware but the client isn't authenticated, so middleware redirects to login
**Fix**:
1. Check if the route should be protected in `src/middleware.ts`
2. If it should be public, remove from the matcher
3. If it should be protected, ensure the client has a valid session before calling

---

### ERR-RT-003: Infinite re-render loop in useEffect
**Symptom**: Component keeps re-rendering, React warning about max update depth
**Root cause**: Effect dependency array includes an object/array that's recreated each render, or state setter called unconditionally
**Fix**:
- Memoize objects in deps: `useMemo(() => ({ key: val }), [val])`
- Use primitive values in deps instead of objects
- Add conditional check before `setState` in effects

---

## Prisma / Database Errors

### ERR-DB-001: `Connection refused` / `ECONNREFUSED 127.0.0.1:5432`
**Symptom**: API returns 500, logs show DB connection error
**Root cause**: PostgreSQL service not running
**Fix**:
```bash
brew services start postgresql@16
# Verify:
brew services status postgresql@16
```

---

### ERR-DB-002: `Unique constraint failed on the fields: ('name')`
**Symptom**: 500 error when creating a tag or username that already exists
**Root cause**: Trying to `create` instead of `upsert` for unique-constrained fields
**Fix**: Use `upsert` for tags and usernames:
```typescript
await prisma.tag.upsert({
  where: { name: tagName },
  update: {},
  create: { name: tagName },
});
```

---

### ERR-DB-003: `Record to delete does not exist`
**Symptom**: Prisma throws on `delete` when record may not exist
**Root cause**: `prisma.model.delete()` throws if record not found (unlike SQL DELETE)
**Fix**: Use `deleteMany` instead (silent if not found):
```typescript
// Instead of:
await prisma.follow.delete({ where: { ... } });
// Use:
await prisma.follow.deleteMany({ where: { ... } });
```

---

*Last updated: 2026-02-24*
