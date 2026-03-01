# Story 3.1: Profile and follow clarity

Status: review

## Story

As a user exploring other people's archives,
I want profiles and follow states to be immediately understandable,
so that I can decide who to follow and why.

## Acceptance Criteria

1. Given I open a public profile, when the page loads, then I can quickly understand who the user is, what they share, and how active they are.
2. Given I follow or unfollow someone, when the action completes, then profile and follow list states update predictably and feedback makes the result obvious.
3. Given a profile has collections or recent posts, when I browse the page, then those sections reinforce discovery rather than competing for attention.

## Implementation Notes

- Profile headers now summarize the user's archive focus before the tabs, including public-post count, collection count, strong category, and a short explanation of what kind of archive the visitor is looking at.
- Follow state is now controlled from the profile page and synchronized into the follow button so header counts and local state stay aligned after mutations.
- Follower/following list APIs now return per-row `isFollowing` and `isSelf` metadata, which allows the modal to render follow buttons and discovery context without stale guessing on the client.

## Completion Notes List

- Updated `ProfilePageClient` with archive summary copy, clearer logged-out CTA, discovery-first intro cards, and controlled follow-state handling.
- Updated `FollowButton` so it reacts to upstream state changes, supports compact rendering, and emits clearer feedback.
- Updated `FollowListModal` to show richer list rows plus inline follow actions.
- Updated `/api/users/[username]/followers` and `/api/users/[username]/following` so modal state can render predictably for the current session.
- `npm run build` completed successfully for verification.

## File List

- src/app/profile/[username]/ProfilePageClient.tsx
- src/components/FollowButton.tsx
- src/components/FollowListModal.tsx
- src/app/api/users/[username]/followers/route.ts
- src/app/api/users/[username]/following/route.ts
- implementation-artifacts/3-1-profile-and-follow-clarity.md
