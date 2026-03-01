---
project_name: "DigyNotes"
user_name: "Ahmet"
date: "2026-03-01"
sections_completed:
  [
    "technology_stack",
    "language_rules",
    "framework_rules",
    "testing_rules",
    "quality_rules",
    "workflow_rules",
    "anti_patterns",
  ]
status: "complete"
rule_count: 22
optimized_for_llm: true
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

- Next.js `14.0.4` App Router on React `18`
- TypeScript `5` in `strict` mode with `@/* -> src/*` path alias
- Tailwind CSS `3.3.0` with `@tailwindcss/typography`
- Prisma `7.4.0` with `@prisma/adapter-pg` `7.4.0` and `pg` `8.18.0`
- NextAuth `4.24.13` with Credentials provider and JWT session strategy
- `sanitize-html` `2.17.1`, `react-quill` `2.0.0`, `@phosphor-icons/react` `2.1.10`
- Prettier `3.8.1`: `semi: true`, `singleQuote: false`, `trailingComma: es5`, `printWidth: 100`
- ESLint uses `next/core-web-vitals` and `next/typescript`

## Critical Implementation Rules

### Language-Specific Rules

- Keep TypeScript strict-safe; do not silence type errors with loose `any` unless there is no practical typed alternative.
- Use the `@/` alias for app imports instead of long relative paths.
- Any file using hooks, browser APIs, or event handlers must start with `"use client"` as the first line.
- Access authenticated user id in API routes with an explicit cast: `(session.user as { id: string }).id`.

### Framework-Specific Rules

- App Router API handlers live in `src/app/api/**/route.ts`; follow the existing `NextRequest`/`NextResponse` pattern.
- Protected areas are enforced by `src/middleware.ts`; if a route unexpectedly returns HTML instead of JSON, check middleware protection first.
- Session-aware or frequently changing API responses should follow the existing no-cache pattern: `dynamic = "force-dynamic"` and `revalidate = 0` where needed.
- `react-quill` must always be loaded via `dynamic(() => import("react-quill"), { ssr: false })`.
- Use `prisma` from `src/lib/prisma.ts`; do not instantiate a separate Prisma client in feature code.
- Keep post HTML sanitized in API handlers with the existing `sanitize-html` approach before persistence.

### Testing Rules

- No established automated test runner is present in the repo right now; do not invent Jest/Vitest/Playwright structure ad hoc.
- Default verification is targeted manual validation plus project commands such as `npm run build` and formatting checks.
- When a change touches auth, Prisma schema, filtering, or complex client state, explicitly note what was verified and what remains unverified.

### Code Quality & Style Rules

- Tailwind utility classes are the default; avoid CSS modules and inline styles unless there is a clear existing exception.
- UI copy is Turkish throughout the product; keep labels, errors, helper text, and empty states in Turkish.
- Follow the DigyNotes palette and CSS variable usage from existing screens; do not introduce default Tailwind color-name styling like `blue-500` or `gray-800`.
- Prefer Phosphor icons; do not add Lucide.
- Comments should be rare and only clarify non-obvious logic.
- API error payloads should remain shaped as `{ error: string }` with an appropriate HTTP status.

### Development Workflow Rules

- Read `ERRORS.md` before debugging; if a new error is solved, append the fix there.
- Treat `CLAUDE.md` as the project-specific operating manual for architecture, UI, and workflow conventions.
- For BMAD-driven work, keep planning docs in `planning-artifacts/`, implementation outputs in `implementation-artifacts/`, and durable knowledge in `docs/`.
- Do not overwrite unrelated user changes in a dirty worktree; inspect and work around them.

### Critical Don't-Miss Rules

- Prisma v7 in this repo requires the Pg adapter pattern; plain `new PrismaClient()` is a regression.
- After Prisma schema changes plus `prisma generate`/`db push`, restart the dev server or new models/relations may appear undefined.
- Category handling is normalized through `src/lib/categories.ts`; avoid hard-coding display labels or aliases in new code.
- Category routes use category names/normalized values, not database ids.
- Tags are global, lowercase, and capped at 10 per post; persist them through the `Tag` + `PostTag` flow, then flatten output for the client.
- Media search/autocomplete flows need care to avoid dropdown reopening loops after selection.
- Remote images should follow existing Next.js handling patterns such as a custom loader or unoptimized rendering strategy already used in forms.

---

## Usage Guidelines

**For AI Agents:**

- Read this file, `CLAUDE.md`, and `ERRORS.md` before implementing code.
- Prefer existing patterns in nearby files over generic framework defaults.
- When in doubt, choose the stricter path that preserves current architecture and UI conventions.
- Update this file if a new recurring project rule becomes stable.

**For Humans:**

- Keep this file short and implementation-focused.
- Update it when the stack, workflow, or recurring pitfalls change.
- Remove rules that become obsolete or too obvious.

Last Updated: 2026-03-01
