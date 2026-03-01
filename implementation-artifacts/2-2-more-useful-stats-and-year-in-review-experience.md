# Story 2.2: More useful stats and year-in-review experience

Status: review

## Story

As a user who revisits past activity,
I want stats and yearly summaries to surface meaningful patterns,
so that my archive feels alive instead of static.

## Acceptance Criteria

1. Given I open stats or year-in-review, when data is available, then charts and summaries highlight understandable personal trends, not just raw numbers.
2. Given I interact with visual summaries, when I move between sections, then the design remains readable on both mobile and desktop and data density stays manageable.
3. Given there is little or no historical data, when the screen renders, then the empty state explains what is missing and how to generate useful history.

## Implementation Notes

- Added lightweight trend helpers in `src/lib/stats-insights.ts` so stats and year-in-review can derive activity spread, focus share, sparse-data messaging, and recent momentum from existing API payloads.
- Upgraded `/stats` with a narrative archive summary plus rhythm, focus, and habit cards that interpret the raw metrics before the detailed charts.
- Upgraded `/stats/year-in-review` with a yearly narrative header, three highlight cards, and more actionable empty or sparse-data guidance.

## Completion Notes List

- Added `src/lib/stats-insights.ts` for shared trend derivation.
- Updated `/stats` to explain category focus, active months, recent rhythm, and recurring tag signals.
- Updated `/stats/year-in-review` to frame the year as a readable story instead of only a chart stack.
- Expanded empty states so users are told to spread notes across months and use ratings/tags to generate richer summaries.
- `npm run build` completed successfully for verification.

## File List

- src/lib/stats-insights.ts
- src/app/stats/page.tsx
- src/app/stats/year-in-review/page.tsx
- implementation-artifacts/2-2-more-useful-stats-and-year-in-review-experience.md
