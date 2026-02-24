# Security Rules (always active)

## Authentication
- NEVER skip auth check on routes that modify data
- NEVER trust client-sent userId — always get it from session:
  ```typescript
  const userId = (session.user as { id: string }).id;
  ```
- Sensitive routes must check session before ANY other logic

## Authorization (data ownership)
- Before UPDATE/DELETE: verify `resource.userId === session.userId`
- Return 403 (not 404) when resource exists but user doesn't own it
- Exception: admin-level ops (none currently in DigyNotes)

## Input Sanitization
- Validate required fields before DB writes
- For user-generated HTML content (Quill output): store as-is but render safely
- Avoid `eval()`, `dangerouslySetInnerHTML` unless absolutely necessary
- Tag names: always lowercase and trim before saving

## Sensitive Files — Never Read, Edit, or Log
- `.env` and `.env.local` — contain DB credentials and secrets
- `NEXTAUTH_SECRET` — never log or expose
- Database passwords — never return in API responses

## API Safety
- Public GET endpoints (tags, public profiles) are OK without auth
- POST/PUT/DELETE always require auth unless explicitly public (e.g. /api/auth/register)
- Rate limiting: not currently implemented — note if adding

## What NOT to Do
- Don't return full Prisma objects if they contain sensitive fields
- Don't concatenate user input into query strings
- Don't use `prisma.$queryRaw` unless absolutely necessary (prefer typed queries)
- Don't expose internal error messages to the client (log server-side, return generic message)
