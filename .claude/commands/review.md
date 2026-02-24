---
description: Code review a file or feature against DigyNotes conventions
argument-hint: "[file path or feature name]"
---

Review this for DigyNotes conventions: $ARGUMENTS

Read the specified file(s) and check against every item below.

## Security Checklist
- [ ] API routes authenticate with `getServerSession` before any DB operation
- [ ] User can only access/modify their own data (check `userId` filter on queries)
- [ ] No raw SQL — only Prisma ORM queries
- [ ] No sensitive data (passwords, tokens) returned in API responses
- [ ] Input is validated before DB writes (at minimum: check required fields exist)

## Code Convention Checklist
- [ ] Client components have `"use client"` as the FIRST line
- [ ] No inline styles — Tailwind classes only
- [ ] UI text is in Turkish
- [ ] `prisma` imported from `src/lib/prisma.ts` (not instantiated directly)
- [ ] API error format: `{ error: string }` with correct HTTP status
- [ ] `try/catch` wrapping all async DB operations
- [ ] External images use `next/image` with `unoptimized`
- [ ] React-Quill uses `dynamic(..., { ssr: false })`

## Design System Checklist
- [ ] Colors match Dark Premium palette: `#0c0c0c` / `#161616` / `#2a2a2a`
- [ ] Gold accent `#c9a84c` used for interactive elements
- [ ] `text-[#f0ede8]` for primary text, `text-[#888888]` for secondary
- [ ] `rounded-xl` for card/container rounding consistency

## Architecture Checklist
- [ ] New models/relations: dev server restarted after schema push
- [ ] Category pages use name param (not DB id)
- [ ] Tags handled with Tag + PostTag upsert pattern
- [ ] userId cast: `(session.user as { id: string }).id`
- [ ] Dynamic routes: params typed as `{ params: { key: string } }`

## After Review
List issues found with severity (Critical / Warning / Suggestion) and propose fixes.
