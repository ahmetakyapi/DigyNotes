# Story 4.3: Safer session, media, and fallback handling

Status: review

## Story

As an everyday user,
I want session expiry, remote media failures, and request errors to degrade gracefully,
so that the product feels reliable even when dependencies fail.

## Acceptance Criteria

1. Given my session expires, when I attempt a protected action, then I receive a human-readable recovery message and a clear route back to login.
2. Given a remote image or media source fails, when the UI renders, then the screen falls back gracefully without breaking layout or meaning.
3. Given a protected API route fails because of auth or server conditions, when the client consumes the error, then it produces a consistent Turkish error experience rather than raw technical output.

## Implementation Notes

- Added reusable client-side media fallbacks for avatars and remote covers so broken external image URLs collapse into initials or a safe default cover instead of broken layouts.
- Centralized protected action error handling around `requestJson`, `getClientErrorMessage`, and auth-status helpers so session expiry and server failures surface consistent Turkish recovery copy.
- Applied the fallback strategy across the main archive, discovery, feed, recommendation, watchlist, collection, and post detail surfaces.

## Completion Notes List

- Added `AvatarImage` and `ResilientImage` components for resilient avatar and cover rendering.
- Updated bookmark, follow, watchlist, collection, like, comment, and delete flows to show human-readable Turkish errors and redirect to `/login` on expired sessions.
- Replaced brittle remote image usage on search results, cards, lists, watchlist, collection detail, discover, feed, recommended, and post detail hero surfaces.
- Extended `src/lib/client-api.ts` with reusable auth-error detection helpers for client mutations.
- `npm run build` completed successfully for verification.

## File List

- src/lib/client-api.ts
- src/components/AvatarImage.tsx
- src/components/ResilientImage.tsx
- src/components/BookmarkButton.tsx
- src/components/FollowButton.tsx
- src/components/FollowListModal.tsx
- src/components/SearchBar.tsx
- src/components/UserCard.tsx
- src/components/CollectionCard.tsx
- src/components/PostsList.tsx
- src/app/watchlist/page.tsx
- src/app/collections/page.tsx
- src/app/collections/[id]/page.tsx
- src/app/feed/page.tsx
- src/app/recommended/page.tsx
- src/app/discover/page.tsx
- src/app/posts/[id]/PostDetailClient.tsx
- implementation-artifacts/4-3-safer-session-media-and-fallback-handling.md
