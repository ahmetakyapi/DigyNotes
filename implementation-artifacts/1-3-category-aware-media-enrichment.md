# Story 1.3: Category-aware media enrichment

Status: review

## Story

As a user adding media-based notes,
I want search results and autofill to reflect the selected category,
so that I can capture accurate information with minimal typing.

## Acceptance Criteria

1. Given I search for film, series, game, book, or travel content, when results appear, then the search uses the correct provider and result shape for that category.
2. Given I select a media result, when autofill is applied, then title, creator, year, image, and rating fields populate only where appropriate and the dropdown closes cleanly without reopening unexpectedly.
3. Given I use the travel flow, when I pick a place, then the note stores visible place context and coordinates and the form makes the map-related behavior understandable.

## Implementation Notes

- New note composer search is now locked to the already-selected category, so provider selection follows the form state instead of a separate tab decision.
- Media search now invalidates stale in-flight searches whenever the query, category tab, or selected result changes; this prevents old responses from reopening the dropdown after autofill.
- Travel enrichment remains visible in the form through stored location label and coordinates, while the search surface now respects the `travel -> gezi` provider mapping consistently.

## Completion Notes List

- Locked `MediaSearch` to the selected composer category in `src/app/new-post/page.tsx`.
- Hardened `src/components/MediaSearch.tsx` against stale async result races and unstable dropdown reopening.
- Preserved category-specific autofill behavior already handled by the composer state update path.
- `npm run build` should be used as the build-first verification step for this story.

## File List

- src/app/new-post/page.tsx
- src/components/MediaSearch.tsx
- implementation-artifacts/1-3-category-aware-media-enrichment.md
