---
description: Debug an error using ERRORS.md first, then systematic investigation
argument-hint: "[error message or description]"
---

Debug this error: $ARGUMENTS

## Step 1: Check ERRORS.md FIRST
Read `ERRORS.md` and search for:
- The exact error message
- Key words from the error (e.g. "undefined", "prisma", "hydration", "session")
- The component or route where it occurred

If a matching ERR-XXX entry exists → apply that fix immediately. Do NOT re-investigate.

## Step 2: Common DigyNotes Error Patterns
If not in ERRORS.md, check these first:

| Symptom | Likely Cause | Check |
|---------|-------------|-------|
| `prisma.X is not a function` | Dev server not restarted | ERR-001 |
| `_count.select` error | New relation, server not restarted | ERR-002 |
| `document is not defined` | react-quill SSR | ERR-003 |
| Hydration mismatch | Missing `"use client"` | ERR-007 |
| Image not loading | Missing `unoptimized` | ERR-006 |
| `session.user.id` undefined | Session cast missing | ERR-012 |
| 401 on valid session | Auth not in middleware | `src/middleware.ts` |
| Tag not saved | PostTag join missing | ERR-010 |

## Step 3: Systematic Investigation
Only if Steps 1-2 don't resolve it:
1. Read the exact file where the error occurs
2. Read relevant API routes
3. Check the Prisma schema for model structure
4. Check `src/lib/prisma.ts` if DB-related
5. Check `src/lib/auth.ts` if auth-related
6. Check `src/middleware.ts` if route protection issues

## Step 4: After Fixing — MANDATORY
If this was a NEW error not in ERRORS.md:
1. Open `ERRORS.md`
2. Create a new ERR-XXX entry (increment the highest existing number)
3. Fill in: symptom, root cause, fix, prevention, relevant files
