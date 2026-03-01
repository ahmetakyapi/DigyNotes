# Story 4.2: Export, maintenance, and recovery confidence

Status: review

## Story

As a user or operator,
I want data export and maintenance states to be understandable and trustworthy,
so that I know my archive and the system are recoverable.

## Acceptance Criteria

1. Given I request an export, when the response arrives, then the file contains clean, readable data representations and long-form content is safe to consume outside the app.
2. Given the system enters maintenance or degraded conditions, when I visit the product, then the messaging explains what is happening and what I can still do.
3. Given an operation fails unexpectedly, when I retry or navigate away, then the product gives me a clear recovery path.

## Implementation Notes

- Export downloads now describe their format tradeoffs in the UI and produce clearer success or failure feedback instead of relying on raw browser download behavior.
- JSON exports now carry readable text-first content and summary metadata, while CSV exports include a UTF-8 BOM so Turkish characters survive spreadsheet tools more reliably.
- Maintenance and offline surfaces now explain the situation, what the user can still do, and provide explicit retry actions.

## Completion Notes List

- Updated `/api/users/me/export` so exported content is text-safe, filenames have a reliable fallback, and CSV opens more predictably in spreadsheet tools.
- Updated profile settings export UI with explicit CSV/JSON guidance, in-progress state, Turkish error handling, and recovery hints.
- Added a reusable `RetryButton` and used it on maintenance and offline surfaces so users can retry directly.
- Expanded `/maintenance` and `/offline` pages with clearer operational messaging and next-step guidance.
- `npm run build` completed successfully for verification after clearing stale `.next` build artifacts.

## File List

- src/app/api/users/me/export/route.ts
- src/app/profile/settings/page.tsx
- src/app/maintenance/page.tsx
- src/app/offline/page.tsx
- src/components/RetryButton.tsx
- implementation-artifacts/4-2-export-maintenance-and-recovery-confidence.md
