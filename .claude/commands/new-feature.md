---
description: Plan and implement a new feature end-to-end for DigyNotes
argument-hint: "[feature description]"
---

Plan and implement this feature: $ARGUMENTS

## Phase 1: Understand the Scope
Before writing any code:
1. Read CLAUDE.md to understand existing patterns and conventions
2. Read ERRORS.md to know pitfalls to avoid
3. Read relevant existing files (similar features for reference)
4. Identify what's needed: DB schema? API routes? Components? Pages?

## Phase 2: DB Changes (if needed)
If the feature needs schema changes, follow `/db-change` workflow:
- Edit `prisma/schema.prisma`
- `npx prisma db push --accept-data-loss`
- `npx prisma generate`
- Restart dev server

## Phase 3: API Routes (if needed)
For each new API route, follow `/new-api` conventions:
- Auth guard with `getServerSession`
- Try/catch with `{ error: string }` responses
- Use `prisma` from `src/lib/prisma.ts`

## Phase 4: Components (if needed)
For each new component, follow `/new-component` conventions:
- `"use client"` for interactive/hook-using components
- Dark Premium design tokens
- Turkish UI text

## Phase 5: Pages (if needed)
- Public pages: no auth check needed
- Protected pages: add route to `src/middleware.ts` if not already covered
- Use `ConditionalAppShell` or AppShell as needed

## Phase 6: Integration Checklist
- [ ] All new API routes return `{ error: string }` on failure
- [ ] All client components have `"use client"`
- [ ] External images use `unoptimized`
- [ ] React-Quill uses `dynamic(..., { ssr: false })`
- [ ] After schema change: dev server restarted
- [ ] Turkish UI text throughout

## Phase 7: Update Documentation
After implementation:
1. Add new API routes to CLAUDE.md API Routes section
2. Add new components to Component Inventory in CLAUDE.md
3. If any new errors were encountered, add to ERRORS.md
4. Update MEMORY.md if new architectural patterns were established
