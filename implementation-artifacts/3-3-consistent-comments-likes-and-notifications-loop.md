# Story 3.3: Consistent comments, likes, and notifications loop

Status: review

## Story

As a socially active user,
I want interaction feedback loops to feel connected,
so that comments, likes, and notifications reinforce each other instead of feeling separate.

## Acceptance Criteria

1. Given I like or comment on a post, when the action succeeds, then the UI updates quickly and visibly on the current page.
2. Given another user interacts with my content, when I open notifications, then unread counts and read states are accurate and the notification helps me navigate back to the relevant context.
3. Given comments have replies, when I read the thread, then reply depth and ownership remain understandable without visual clutter.

## Implementation Notes

- Post detail now shows compact interaction feedback after like and comment actions, and reply threads can surface the exact target comment from notification deep links.
- Notification payloads now distinguish follow, like, comment, and reply context more clearly, including comment previews and direct links back to the specific thread node.
- Notifications can now be marked as read individually when opened, keeping the list and header badge in sync without requiring a full "mark all" action.

## Completion Notes List

- Updated `PostDetailClient` with visible interaction chips, reply ownership/context badges, and comment-target scroll/highlight behavior.
- Updated `/api/notifications` so notifications carry richer context, comment previews, and direct comment anchors for reply/comment events.
- Added `/api/notifications/[id]/read` for single-notification read state updates.
- Updated `NotificationsPage` so opening an unread item marks it read optimistically and keeps unread counts synchronized with the shell badge.
- `npm run build` completed successfully for verification.

## File List

- src/app/posts/[id]/PostDetailClient.tsx
- src/app/api/notifications/route.ts
- src/app/api/notifications/[id]/read/route.ts
- src/app/notifications/page.tsx
- implementation-artifacts/3-3-consistent-comments-likes-and-notifications-loop.md
