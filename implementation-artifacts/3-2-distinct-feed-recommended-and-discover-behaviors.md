# Story 3.2: Distinct feed, recommended, and discover behaviors

Status: review

## Story

As a user seeking new content,
I want feed, recommended, and discover screens to serve different purposes clearly,
so that each one feels useful instead of redundant.

## Acceptance Criteria

1. Given I move between feed, recommended, and discover, when I compare them, then each screen has its own explanatory framing and card emphasis.
2. Given I inspect a recommendation or discovered post, when I act on it, then the route to saving, opening, or following stays obvious.
3. Given result lists are empty or loading, when the screen state appears, then the copy explains why and what to do next.

## Implementation Notes

- `/feed`, `/recommended`, and `/discover` now open with distinct framing cards that explain the purpose of each surface, when to use it, and what action comes next.
- Feed and recommended states now explicitly handle logged-out and failed-load conditions so empty states do not feel interchangeable with genuine no-result states.
- Recommendation cards now reinforce why the item appeared and who it came from, while discover user cards push visitors toward opening profiles and browsing archives.

## Completion Notes List

- Updated `FeedPage` with clearer surface framing, login-required and failure states, and more specific follow-flow empty state copy.
- Updated `RecommendedPage` with recommendation-specific framing, login-required and failure states, stronger empty state guidance, and clearer recommendation card sourcing.
- Updated `DiscoverPage` so the top/users split is better explained and user-search empty states point to the correct next action.
- Updated `UserCard` with a stronger archive-oriented CTA so discover can lead naturally into profile browsing.
- `npm run build` completed successfully for verification.

## File List

- src/app/feed/page.tsx
- src/app/recommended/page.tsx
- src/app/discover/page.tsx
- src/components/UserCard.tsx
- implementation-artifacts/3-2-distinct-feed-recommended-and-discover-behaviors.md
