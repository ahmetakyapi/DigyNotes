# BMAD Audit Report

**Date:** 2026-03-11
**Project:** DigyNotes
**Method:** BMAD installation and agent manifest review, planning artifact review, implementation artifact review, static code scan, `npm run build` verification

## Executive Summary

DigyNotes has strong product breadth and a well-prepared BMAD planning stack, but the implementation side is materially less mature than the planning side. The main issue is not missing feature ideas. The main issue is that the repo has reached a "broadly implemented, weakly validated" state.

The project is not blocked at the product-definition layer:

- BMAD is installed and current (`6.0.4`)
- PRD, architecture, UX, epics, and readiness documents are present
- All four epics have been decomposed into stories
- The application builds successfully

The project is blocked at the quality and operational confidence layer:

- No effective automated test suite exists
- No `test` or `lint` script exists in `package.json`
- No CI workflow directory is present
- Sprint/story hygiene is incomplete: all stories are still `review`, not `done`
- At least several concrete code-level bugs or product-model mismatches remain

## Evidence Snapshot

### BMAD / planning state

- BMAD status is healthy and up to date.
- `implementation-artifacts/sprint-status.yaml` shows every current story at `review`, not `done`.
- Story 1.1 still contains unchecked task boxes despite completion notes and `review` status.
- No `Senior Developer Review` section was found in story artifacts, although the BMAD code-review checklist expects it.

### Verification performed

- `npm run build`
  - Build completed successfully.
  - During static generation, `/maintenance` emitted `PrismaClientKnownRequestError` from `prisma.siteSettings.findUnique()` with code `EPERM`.
- Static scans
  - No meaningful test files were found.
  - Rate limiting is only wired into follow, like, and comment mutations.
  - No `.github/` workflow tree was found.

## Primary Findings

### 1. SEO and access control are inconsistent

Severity: High

Protected routes are being published as crawlable routes.

- Middleware requires auth for `/posts/:path*` and `/category/:path*`. See [src/middleware.ts](/Users/ahmet/Documents/Projects/personal-projects/DigyNotes/src/middleware.ts#L19).
- Sitemap still publishes all post detail URLs and category URLs without filtering for public visibility or crawlability. See [src/app/sitemap.ts](/Users/ahmet/Documents/Projects/personal-projects/DigyNotes/src/app/sitemap.ts#L8).
- `robots.ts` does not disallow `/posts/*` or `/category/*`; it only blocks `/new-post`, `/api/`, and `/posts/*/edit`. See [src/app/robots.ts](/Users/ahmet/Documents/Projects/personal-projects/DigyNotes/src/app/robots.ts#L5).

Impact:

- Search engines are pointed at routes that anonymous users cannot access.
- Private or login-gated content identifiers may leak into sitemap output.
- Product trust and SEO intent diverge.

BMAD reading:

- `architect`: public/private surface boundaries are not modeled consistently.
- `pm`: public web surface requirements exist, but the current implementation does not respect product semantics.
- `qa`: a crawlability/access regression test matrix is missing.

### 2. Maintenance-mode fallback is not production-safe during build

Severity: High

`getSiteSetting()` only treats `P1001`, `P1008`, and `P1017` as transient Prisma failures. See [src/lib/site-settings.ts](/Users/ahmet/Documents/Projects/personal-projects/DigyNotes/src/lib/site-settings.ts#L12).  
`/maintenance` always calls `getSiteSetting("maintenanceMessage")`. See [src/app/maintenance/page.tsx](/Users/ahmet/Documents/Projects/personal-projects/DigyNotes/src/app/maintenance/page.tsx#L5).

Observed behavior:

- `npm run build` completed, but static generation logged `PrismaClientKnownRequestError` with code `EPERM` while prerendering `/maintenance`.

Impact:

- Build output is noisy and misleading.
- Maintenance mode is intended as a safe fallback path, but it currently depends on a database call that is not robust across environments.
- A failure mode intended to improve reliability currently weakens deploy confidence.

BMAD reading:

- `architect`: fallback paths must degrade without DB hard dependency.
- `dev`: broaden safe fallback handling.
- `qa`: build-time and no-DB scenarios are untested.

### 3. Category data integrity is enforced only in application code

Severity: High

The `Category` model has no database-level uniqueness on `(userId, name)`. See [prisma/schema.prisma](/Users/ahmet/Documents/Projects/personal-projects/DigyNotes/prisma/schema.prisma#L49).  
The API tries to prevent duplicates with `findFirst()` before `create()`, and seeds default categories when `count === 0`. See [src/app/api/categories/route.ts](/Users/ahmet/Documents/Projects/personal-projects/DigyNotes/src/app/api/categories/route.ts#L7).

Impact:

- Duplicate categories are possible under concurrent requests.
- Default category seeding can race.
- Data integrity depends on route timing instead of schema guarantees.

BMAD reading:

- `architect`: schema should carry invariants.
- `dev`: brownfield-safe migration needed.
- `qa`: concurrency case is not covered.

### 4. Profile settings contain at least two concrete implementation bugs

Severity: Medium

Bug A:

- `usernameCheckRef` is a plain object recreated on every render, not a stable `useRef`. See [src/app/profile/settings/page.tsx](/Users/ahmet/Documents/Projects/personal-projects/DigyNotes/src/app/profile/settings/page.tsx#L47).
- The debounce/timeout logic that follows assumes stable identity. See [src/app/profile/settings/page.tsx](/Users/ahmet/Documents/Projects/personal-projects/DigyNotes/src/app/profile/settings/page.tsx#L71).

Bug B:

- `/api/users/me` tries to write `username: null` when the incoming value is `""`. See [src/app/api/users/me/route.ts](/Users/ahmet/Documents/Projects/personal-projects/DigyNotes/src/app/api/users/me/route.ts#L71).
- In the schema, `User.username` is required and unique, not nullable. See [prisma/schema.prisma](/Users/ahmet/Documents/Projects/personal-projects/DigyNotes/prisma/schema.prisma#L9).

Impact:

- Username availability checks can behave inconsistently.
- A malformed or edge-case request can turn into a server-side validation failure path.
- Profile settings are supposed to improve user trust, but the current implementation carries preventable instability.

BMAD reading:

- `dev`: fix immediately.
- `qa`: add regression coverage for username edit flows.
- `ux-designer`: user-facing save flow should not depend on brittle debounce behavior.

### 5. Security hardening is partial, not systemic

Severity: Medium

The repo has a usable rate-limit utility, but scan results show it is only applied to follow, like, and comment mutations:

- [src/app/api/follows/route.ts](/Users/ahmet/Documents/Projects/personal-projects/DigyNotes/src/app/api/follows/route.ts#L29)
- [src/app/api/posts/[id]/likes/route.ts](/Users/ahmet/Documents/Projects/personal-projects/DigyNotes/src/app/api/posts/[id]/likes/route.ts#L38)
- [src/app/api/posts/[id]/comments/route.ts](/Users/ahmet/Documents/Projects/personal-projects/DigyNotes/src/app/api/posts/[id]/comments/route.ts#L36)

Notably absent from hardening:

- Registration route has no rate limiting. See [src/app/api/auth/register/route.ts](/Users/ahmet/Documents/Projects/personal-projects/DigyNotes/src/app/api/auth/register/route.ts#L7).
- Admin bootstrap route allows the first logged-in user to self-promote if no admin exists. See [src/app/api/admin/setup/route.ts](/Users/ahmet/Documents/Projects/personal-projects/DigyNotes/src/app/api/admin/setup/route.ts#L6).

Impact:

- Auth and account creation are softer targets than interaction surfaces.
- Admin bootstrap is operationally convenient but needs explicit environment/runbook controls.

BMAD reading:

- `architect`: privilege bootstrap needs explicit operating model.
- `qa`: abuse-path testing missing.
- `pm`: security posture is lagging behind feature breadth.

### 6. BMAD execution hygiene is incomplete

Severity: Medium

Sprint tracking says all stories are still in `review`. See [implementation-artifacts/sprint-status.yaml](/Users/ahmet/Documents/Projects/personal-projects/DigyNotes/implementation-artifacts/sprint-status.yaml#L37).  
Story 1.1 still has unchecked task boxes even though it contains completion notes. See [implementation-artifacts/1-1-guided-note-composer-entry.md](/Users/ahmet/Documents/Projects/personal-projects/DigyNotes/implementation-artifacts/1-1-guided-note-composer-entry.md#L19).

Impact:

- BMAD planning exists, but close-out discipline is weak.
- "Implemented" and "reviewed" are not reliably distinguishable.
- Later agents will receive mixed signals from artifacts.

BMAD reading:

- `sm`: sprint workflow is not being fully closed.
- `tech-writer`: artifact state needs normalization.
- `bmad-master`: execution state and documentation state have drifted apart.

### 7. Quality gates are materially below BMAD expectations

Severity: Medium

`package.json` contains `build`, `format`, and DB scripts, but no `test` and no `lint` script. See [package.json](/Users/ahmet/Documents/Projects/personal-projects/DigyNotes/package.json#L5).  
The repo scan did not find a real automated test suite, and no CI workflow directory is present.

Impact:

- `dev` and `qa` agent expectations are not met.
- Review status cannot be trusted because there is no repeatable gate.
- Each new story adds regression risk faster than confidence.

BMAD reading:

- `qa`: highest-priority structural gap.
- `dev`: cannot claim story closure with confidence.
- `sm`: sprint should not continue feature-first.

## What Is Missing

### Missing from engineering system

- Automated test baseline
- CI enforcement
- Lint script and lint gate
- Release checklist for build, auth, and public/private surfaces
- Environment-safe maintenance-mode behavior
- DB-level integrity constraints for categories

### Missing from BMAD operating discipline

- Story close-out to `done`
- Review notes appended per story
- Manual verification evidence per acceptance criterion
- Retrospective or stabilization pass after the current review stack

### Missing from product operations

- Explicit policy for admin bootstrap
- Explicit SEO policy for protected/public content
- Release decision criteria based on confidence, not only feature presence

## BMAD Agent Recommendations

### PM

- Do not start another broad feature wave yet.
- Reframe the next iteration as a stabilization sprint.
- Set exit criteria:
  - no build-time runtime errors
  - public/private SEO consistency
  - critical path smoke coverage
  - story statuses moved from `review` to `done` with evidence

### Architect

- Redesign sitemap/robots so only truly public, indexable routes are exposed.
- Decouple maintenance fallback from hard DB dependency.
- Add a DB uniqueness strategy for categories.
- Decide whether admin bootstrap is allowed in production, preview only, or local only.

### Developer

- Fix the profile settings bugs first.
- Add a safe fallback path in site settings lookup for broader runtime/build failures.
- Add schema + migration support for category uniqueness.
- Add scripts for `lint` and `test`, then wire the smallest useful suite.

### QA

- Create a minimum smoke matrix:
  - register
  - login
  - create note
  - edit note
  - follow/like/comment loop
  - profile update
  - export
  - maintenance behavior
  - public tag/discover/profile crawl behavior
- Cover abuse paths:
  - repeated registration attempts
  - rate-limit headers
  - unauthorized API access
  - admin bootstrap misuse

### UX Designer

- Re-check profile settings UX after debounce/save fixes.
- Clarify maintenance-mode product behavior:
  - full-site maintenance
  - authenticated-only maintenance
  - public landing allowed but app locked
- Audit public/private navigation language so crawlable surfaces feel intentional.

### Tech Writer

- Normalize story artifacts so status, completion notes, tasks, and review notes align.
- Add a short operational runbook:
  - admin bootstrap policy
  - maintenance mode behavior
  - release verification checklist
- Update README with current quality-gate reality instead of feature-only framing.

### Scrum Master

- Stop counting `review` as effectively finished.
- Run a review-to-done pass across current stories before accepting new scope.
- Split the next sprint into:
  - P0 stabilization
  - P1 quality infrastructure
  - only then new feature work

### Analyst

- Validate whether the most-used surfaces are capture, organization, or social.
- Use that to prioritize smoke coverage and stabilization order.
- If usage is still capture-first, all note creation/editing/profile issues should outrank discover/admin refinements.

## Recommended Next Move

Recommendation: **do a stabilization sprint before new feature development**.

Suggested order:

1. Fix P0 product/runtime mismatches
   - sitemap/robots/public-private model
   - maintenance fallback/build-time DB issue
   - profile settings bugs
   - category uniqueness/data integrity
2. Add minimum quality gates
   - `lint` script
   - minimal test suite
   - CI workflow
3. Close BMAD artifact hygiene
   - review notes
   - story state normalization
   - evidence-backed `done`
4. Reassess roadmap after confidence improves

## Decision Guidance

### If the goal is "ship more features fast"

Not recommended. The current bottleneck is confidence, not ideation.

### If the goal is "prepare for safer public rollout"

Recommended. The next sprint should be stabilization-heavy.

### If the goal is "pick one narrow improvement now"

Best first target:

- public/private SEO cleanup

Best second target:

- profile settings reliability

Best third target:

- minimal QA/CI foundation

## Bottom Line

BMAD would not tell you "the project needs more ideas."  
BMAD would tell you "the project needs tighter closure, stronger gates, and a short stabilization cycle before expanding scope again."
