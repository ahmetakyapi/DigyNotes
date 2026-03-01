# Story 2.3: Better revisitability through note detail, tags, and public surfaces

Status: review

## Story

As a user returning to old notes,
I want note detail and public surfaces to connect clearly back to my archive context,
so that I can navigate memory paths instead of isolated pages.

## Acceptance Criteria

1. Given I open a note detail page, when I read it, then the page presents image, metadata, tags, community signals, and content in a clear reading order.
2. Given I click a tag or related surface, when navigation occurs, then the destination page feels like part of the same product grammar, not a disconnected route.
3. Given a note contains spoiler-sensitive content, when spoiler behavior is relevant, then the page protects the content without making the screen cumbersome to use.

## Implementation Notes

- Note detail now exposes an explicit archive-context block so category, tag, profile, and creation-time links are readable before the main body content.
- Tag badges can now act as first-class links, allowing note-detail and other archive surfaces to route directly into tag pages without ad hoc wrappers.
- Tag and category public surfaces now use the same contextual framing language as note detail, and tag result cards now open the note detail predictably while preserving separate profile navigation.

## Completion Notes List

- Added linked tag badges through `src/components/TagBadge.tsx`.
- Updated `/posts/[id]` with profile-linked hero metadata, an archive context section, linked tag paths, clearer spoiler guidance, and stronger related-note framing.
- Updated `/tag/[name]` with contextual hero copy, actionable empty state messaging, and clickable post cards that lead back to note detail.
- Updated `/category/[id]` header framing so category pages read like a continuation of the archive grammar rather than a standalone filter view.
- `npm run build` completed successfully for verification.

## File List

- src/components/TagBadge.tsx
- src/app/posts/[id]/PostDetailClient.tsx
- src/app/tag/[name]/TagPageClient.tsx
- src/app/category/[id]/CategoryPageClient.tsx
- implementation-artifacts/2-3-better-revisitability-through-note-detail-tags-and-public-surfaces.md
