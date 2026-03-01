# Story 2.1: Unified organization layer across bookmarks, collections, and watchlist

Status: review

## Story

As a power user,
I want bookmarks, collections, and watchlist/wishlist behaviors to feel complementary instead of fragmented,
so that I can organize content confidently.

## Acceptance Criteria

1. Given I save content through bookmark, collection, or watchlist actions, when I revisit related screens, then the terminology and interaction states are consistent.
2. Given I open a collection or watchlist item, when I scan the page, then I can easily tell what action is available next and the screen reinforces the difference between temporary saving and long-term grouping.
3. Given I add or remove an item from one organization surface, when I navigate to a related surface, then the state remains synchronized.

## Implementation Notes

- Added a shared organization surface dictionary and guide component so bookmarks, watchlist, and collections now explain the same three-surface model with aligned labels and cross-links.
- Surfaced the organization guide on the saved-notes tab, watchlist page, collections landing page, and collection detail page to clarify the difference between quick saves, later queues, and long-term grouping.
- Updated bookmark and watchlist action labels so add/remove states use the same organization language instead of drifting across pages.

## Completion Notes List

- Added `src/lib/organization.ts` and `src/components/OrganizationGuide.tsx` as the shared terminology layer.
- Updated `BookmarkButton` and the saved-notes tab in `PostsList` to present bookmarks as a distinct organization surface.
- Updated `/watchlist`, `/collections`, and `/collections/[id]` with aligned CTA copy and in-context guidance about what each surface is for.
- Follow-up refinement pass simplified the organization guide from competing large cards into a denser comparison list, and moved `/watchlist` and `/collections` primary actions above explanatory content.
- Watchlist and collections landing pages now use more theme-aware surfaces so the added organization UI reads correctly in both dark and light themes.
- `npm run build` completed successfully for verification.

## File List

- src/lib/organization.ts
- src/components/OrganizationGuide.tsx
- src/components/BookmarkButton.tsx
- src/components/PostsList.tsx
- src/app/watchlist/page.tsx
- src/app/collections/page.tsx
- src/app/collections/[id]/page.tsx
- implementation-artifacts/2-1-unified-organization-layer-across-bookmarks-collections-and-watchlist.md
