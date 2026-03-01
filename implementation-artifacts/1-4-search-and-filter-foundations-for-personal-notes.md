# Story 1.4: Search and filter foundations for personal notes

Status: review

## Story

As a user with a growing archive,
I want note search, category filtering, and tag narrowing to work together predictably,
so that I can quickly find what I already captured.

## Acceptance Criteria

1. Given I search or filter my notes, when I combine query, category, and tag criteria, then the results reflect those criteria without conflicting states.
2. Given I paginate or scroll through results, when more items load, then ordering remains stable and no duplicates appear.
3. Given I return to the notes screen later, when I repeat the same query path, then the interaction pattern and labels remain consistent across notes-related surfaces.

## Implementation Notes

- Notes filters now use the URL as the repeatable query path for `q`, `category`, `tags`, and `tab`.
- Notes API pagination now uses an opaque cursor built from `createdAt + id`, so descending ordering stays stable even when multiple posts share nearby timestamps.
- The notes list still applies the same filter grammar locally for saved items, while server fetches for the main notes tab now honor query/category/tag combinations directly.

## Completion Notes List

- Extended `/notes` search params to include category, tags, and active tab state.
- Updated `NotesPageClient` and `PostsList` so category and tag filters sync back to the URL and drive server fetches for the notes tab.
- Hardened `/api/posts` pagination to use stable composite cursor semantics.
- `npm run build` should be used as the build-first verification step for this story.

## File List

- src/app/notes/page.tsx
- src/app/notes/NotesPageClient.tsx
- src/components/PostsList.tsx
- src/app/api/posts/route.ts
- implementation-artifacts/1-4-search-and-filter-foundations-for-personal-notes.md
