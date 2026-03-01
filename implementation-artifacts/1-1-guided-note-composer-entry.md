# Story 1.1: Guided note composer entry

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a returning user,
I want the new note screen to clearly guide my first actions,
so that I can start capturing a note without hesitation.

## Acceptance Criteria

1. Given I open the new note page, when the screen renders on mobile or desktop, then the page shows a clear primary capture flow with category, search, title, and status in an obvious order, and the first meaningful action is visually prominent. [Source: planning-artifacts/epics.md#Story-11-Guided-note-composer-entry]
2. Given I switch categories, when the form updates for that category, then only relevant metadata fields remain visible, and irrelevant fields are removed or reset predictably. [Source: planning-artifacts/epics.md#Story-11-Guided-note-composer-entry]
3. Given I am entering a note for the first time, when I see empty or helper states, then the copy explains what to do next in Turkish, and the UI never feels like a generic admin form. [Source: planning-artifacts/epics.md#Story-11-Guided-note-composer-entry]

## Tasks / Subtasks

- [ ] Rework the `/new-post` entry layout so the capture flow is explicit on both mobile and desktop. (AC: 1, 3)
  - [ ] Audit the current composer structure in `src/app/new-post/page.tsx` and keep the existing two-column/sticky behavior only where it still supports a clearer first-step flow.
  - [ ] Make the first meaningful action visually obvious by elevating the search/autofill entry and clarifying the order of category, search, title, and status.
  - [ ] Keep DigyNotes visual direction intact by reusing existing card, border, gold accent, and motion grammar instead of introducing generic dashboard styling.
- [ ] Add guided empty/helper states in Turkish for first-time note creation. (AC: 1, 3)
  - [ ] Add concise helper copy for empty title/content/image/search states and ensure every empty state points to the next action.
  - [ ] Make category-specific guidance feel intentional for media and travel flows rather than a generic form label stack.
  - [ ] Preserve existing success/error feedback pattern: success via toast + redirect, failure via inline message + toast.
- [ ] Harden category-switch behavior so visible fields and resets stay predictable. (AC: 2)
  - [ ] Keep category-specific field rules centralized in shared domain helpers under `src/lib/**` rather than duplicating logic in the page component.
  - [ ] Ensure travel-only fields (`lat`, `lng`, `locationLabel`) and creator-related fields remain synchronized with category switches.
  - [ ] Verify spoiler/status/template behavior still follows current category rules after layout or helper-state changes.
- [ ] Verify responsiveness, shell interaction, and regression risk for the composer entry flow. (AC: 1, 2, 3)
  - [ ] Confirm composer routes continue hiding distracting mobile bottom tabs through existing shell logic.
  - [ ] Confirm sticky/fixed elements do not block fields or CTA on mobile, including the fixed save bar and sidebar ordering.
  - [ ] Run `npm run build` and document any manual checks still required because the repo has no established automated test suite.

## Dev Notes

- Story scope is the new-note entry experience, not the full edit flow. Keep changes centered on `src/app/new-post/page.tsx` unless shared helper extraction is clearly warranted. The related edit flow exists in `src/app/posts/[id]/edit/page.tsx`, but Story 1.2 will cover edit-specific UX and unsaved-change behavior. [Source: planning-artifacts/epics.md#Story-11-Guided-note-composer-entry] [Source: planning-artifacts/epics.md#Story-12-Reliable-edit-flow-with-unsaved-change-protection]
- Current composer already contains the main primitives needed for this story: category/status selects, title, category-aware metadata fields, `MediaSearch`, `PlaceSearch`, template-aware content editor, cover preview, spoiler controls, and fixed save bar. Prefer reorganizing and clarifying these instead of adding parallel flows. [Source: src/app/new-post/page.tsx]
- Category-specific behavior is already partially centralized in `src/lib/post-form.ts` and `src/lib/post-config.ts`. Story 1.1 should extend shared helpers if new guidance/config becomes reusable, rather than embedding more branching inside the page component. [Source: planning-artifacts/architecture.md#43-Domain-Utility-Layer] [Source: planning-artifacts/project-context.md#Critical-Dont-Miss-Rules] [Source: src/lib/post-form.ts]
- API persistence behavior should remain unchanged for this story. Posting still goes through `src/app/api/posts/route.ts`, uses server session auth, normalizes category, sanitizes HTML, caps tags at 10, and returns `{ error: string }` style failures. UI improvements must not bypass or weaken these rules. [Source: planning-artifacts/architecture.md#42-ApplicationAPI-Layer] [Source: planning-artifacts/prd.md#NFR-01-Security] [Source: planning-artifacts/prd.md#NFR-02-Data-Integrity] [Source: src/app/api/posts/route.ts]
- UX constraints to enforce:
  - Composer is a priority surface and should feel mobile-first.
  - Mobile bottom tab behavior must not clash with composer routes.
  - Empty states must say what to do next.
  - The product should retain the "Collected Night Ledger" direction instead of drifting into generic SaaS/admin UI. [Source: planning-artifacts/ux-design-specification.md#8-Navigation-and-Interaction-Model] [Source: planning-artifacts/ux-design-specification.md#10-Chosen-Design-Direction] [Source: planning-artifacts/ux-design-specification.md#14-UX-Consistency-Patterns] [Source: planning-artifacts/ux-design-specification.md#15-Responsive-and-Accessibility-Strategy]
- Existing shell behavior already marks composer routes and hides distracting mobile bottom tabs through `isComposerRoute` / `hideMobileBottomTabs`. Reuse that contract; do not fork shell logic unless the new composer flow genuinely requires it. [Source: src/components/AppShell.tsx]
- UI copy must remain Turkish, Tailwind + CSS variable styling should stay aligned with `src/app/globals.css`, and hook/browser code must remain in `"use client"` files. [Source: planning-artifacts/project-context.md#Code-Quality--Style-Rules] [Source: planning-artifacts/project-context.md#Language-Specific-Rules] [Source: src/app/globals.css]
- Testing guidance for this repo is build-first plus targeted manual validation. For this story, manually verify:
  - mobile render of `/new-post`
  - desktop render of `/new-post`
  - category switch resets for travel vs non-travel
  - first-time empty state guidance
  - successful save and failed save feedback paths. [Source: planning-artifacts/project-context.md#Testing-Rules] [Source: planning-artifacts/prd.md#NFR-04-UX-Consistency] [Source: planning-artifacts/prd.md#NFR-07-Accessibility-and-Reach]

### Project Structure Notes

- Expected primary file: `src/app/new-post/page.tsx`.
- Expected shared helper touchpoints if needed: `src/lib/post-form.ts`, `src/lib/post-config.ts`, and only adjacent reusable UI components under `src/components/**`.
- Do not create a separate composer route, modal flow, or duplicated media-search component for this story; this is a brownfield refinement of the existing page structure. [Source: planning-artifacts/architecture.md#31-Architecture-Decisions] [Source: planning-artifacts/architecture.md#41-Presentation-Layer]

### References

- [Source: planning-artifacts/epics.md#Epic-1-Faster-and-Safer-Note-Capture]
- [Source: planning-artifacts/prd.md#Journey-1-Kayıt-ve-İlk-Not]
- [Source: planning-artifacts/prd.md#FR-02-Personal-Notes]
- [Source: planning-artifacts/prd.md#FR-04-Media-Enrichment]
- [Source: planning-artifacts/prd.md#NFR-02-Data-Integrity]
- [Source: planning-artifacts/prd.md#NFR-03-Performance]
- [Source: planning-artifacts/prd.md#NFR-04-UX-Consistency]
- [Source: planning-artifacts/prd.md#NFR-07-Accessibility-and-Reach]
- [Source: planning-artifacts/architecture.md#41-Presentation-Layer]
- [Source: planning-artifacts/architecture.md#42-ApplicationAPI-Layer]
- [Source: planning-artifacts/architecture.md#43-Domain-Utility-Layer]
- [Source: planning-artifacts/project-context.md]
- [Source: planning-artifacts/ux-design-specification.md#8-Navigation-and-Interaction-Model]
- [Source: planning-artifacts/ux-design-specification.md#10-Chosen-Design-Direction]
- [Source: planning-artifacts/ux-design-specification.md#14-UX-Consistency-Patterns]
- [Source: planning-artifacts/ux-design-specification.md#15-Responsive-and-Accessibility-Strategy]
- [Source: src/app/new-post/page.tsx]
- [Source: src/app/api/posts/route.ts]
- [Source: src/lib/post-form.ts]
- [Source: src/components/AppShell.tsx]
- [Source: src/app/globals.css]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- BMAD create-story context assembled from sprint status, epic, PRD, architecture, UX spec, project context, and current composer code.

### Completion Notes List

- `/new-post` akışı kategori -> arama/manüel başlangıç -> başlık -> durum düzenine çekildi.
- Kategoriye bağlı helper copy `src/lib/post-config.ts` içine taşındı ve UI metinleri Türkçe rehber akış olarak güncellendi.
- Kategori değişimindeki alan temizliği `src/lib/post-form.ts` içindeki shared helper ile merkezi hale getirildi.
- Follow-up refinement pass ile üstteki büyük rehber bloğu küçültüldü; kategori ve ilk aksiyon aynı başlangıç panelinde toplandı, böylece arama/manüel başlangıç alanı ilk görünümde aşağıda kalmıyor.
- Composer üzerindeki yeni yardımcı yüzeyler light/dark tema arasında daha tutarlı davranacak şekilde sabit koyu arka planlardan uzaklaştırıldı.
- `npm run build` başarılı geçti; mobil ve masaüstü görsel kontrolleri hâlâ manuel doğrulama gerektiriyor.

### File List

- implementation-artifacts/1-1-guided-note-composer-entry.md
