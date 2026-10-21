/**
 * Usernames that collide with static routes next to `/profile/[username]` and
 * `/api/users/[username]` (`/profile/settings`, `/api/users/search`, `/api/users/me`).
 * A user with one of these names would have a profile nobody can open, and the settings
 * page's availability check would hit the static route instead of the user.
 */
export const RESERVED_USERNAMES: ReadonlySet<string> = new Set(["settings", "search", "me"]);

/** True for a name register and the profile settings must refuse (expects it normalized). */
export function isReservedUsername(username: string) {
  return RESERVED_USERNAMES.has(username);
}
