# Story 4.1: Admin moderation and visibility workspace

Status: review

## Story

As an admin,
I want user, content, activity, and settings views to provide actionable visibility,
so that I can manage the platform responsibly.

## Acceptance Criteria

1. Given I open admin screens, when I review users, posts, activity, or settings, then each screen clearly communicates what can be acted on and what is informational.
2. Given I perform an admin action, when the request completes, then success or failure is explicit and I can tell whether follow-up action is needed.
3. Given moderation-sensitive data is shown, when I inspect it, then the UI avoids ambiguous labels and exposes enough context for safe decisions.

## Implementation Notes

- The admin workspace now opens each tab with explicit framing for what is actionable, what is informational, and what requires careful verification before moderation decisions.
- Admin mutations now produce a structured result banner with success or failure state plus a suggested follow-up step, instead of relying only on transient toasts.
- Moderation-sensitive user and content rows now expose clearer badges such as public/private profile state and missing-status content markers.

## Completion Notes List

- Updated `AdminPage` with per-tab workspace guide cards for overview, users, content, activity, and settings.
- Added persistent action feedback banners that explain the outcome of role, ban, delete, bulk, and settings changes together with the next verification step.
- Clarified moderation-sensitive row data by surfacing `açık/gizli` profile state on users and `Durum yok` markers on content with missing status.
- Kept existing admin APIs intact; the UX layer now makes the operational intent of those APIs more legible.
- `npm run build` completed successfully for verification.

## File List

- src/app/admin/page.tsx
- implementation-artifacts/4-1-admin-moderation-and-visibility-workspace.md
