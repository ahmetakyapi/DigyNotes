# Story 1.2: Reliable edit flow with unsaved-change protection

Status: review

## Story

As a user editing an existing note,
I want the edit experience to behave consistently and warn me before losing changes,
so that I can safely refine my archive.

## Acceptance Criteria

1. Given I modify a note and try to leave the page, when there are unsaved changes, then I receive a clear warning before navigation completes.
2. Given I edit metadata, tags, spoiler state, or content, when I save, then all changed fields persist together and the detail screen reflects the updated values.
3. Given a save fails due to auth or request errors, when the response returns, then I receive both inline and toast feedback and I can recover without losing my current form state.

## Implementation Notes

- Edit form dirty state was changed from one-way flagging to snapshot comparison, so reverting changes now clears the unsaved state predictably.
- In-page exit protection now covers `beforeunload`, browser back, internal anchor navigation, foreign form submits such as header search, and local edit-page navigation buttons.
- Category change resets now reuse shared helper logic from `src/lib/post-form.ts` to keep travel/spoiler/creator field cleanup consistent with the new-post flow.
- Save failure behavior now preserves the current edit state even on auth failures; the page shows inline and toast feedback instead of redirecting away.

## Completion Notes List

- Added unsaved-change confirmation flow to `src/app/posts/[id]/edit/page.tsx`.
- Reused shared category-dependent field synchronization from `src/lib/post-form.ts`.
- Kept PUT persistence path unchanged in `src/app/api/posts/[id]/route.ts`; successful save still returns to the detail page.
- `npm run build` should be used as the build-first verification step for this story.

## File List

- src/app/posts/[id]/edit/page.tsx
- src/lib/post-form.ts
- implementation-artifacts/1-2-reliable-edit-flow-with-unsaved-change-protection.md
