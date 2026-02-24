---
paths:
  - "src/app/api/**/*.ts"
---

# API Route Rules (auto-loaded for src/app/api/**)

## Mandatory Structure
Every API route handler must:
1. Import `prisma` from `@/lib/prisma` — never instantiate PrismaClient directly
2. Import `getServerSession` and `authOptions` for protected routes
3. Wrap the entire handler body in `try { ... } catch (error) { ... }`
4. Return `{ error: string }` (never bare strings) with correct HTTP status

## Auth Guard Pattern
```typescript
const session = await getServerSession(authOptions);
if (!session?.user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
const userId = (session.user as { id: string }).id;
```

## Error Response Standards
```
400 Bad Request    → missing/invalid input
401 Unauthorized   → no session
403 Forbidden      → session exists but wrong user
404 Not Found      → resource doesn't exist
409 Conflict       → duplicate (e.g. already following)
500 Server Error   → unexpected/DB error
```

## Dynamic Route Params
```typescript
// Next.js 14 App Router — params must be second argument
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) { ... }
```

## Data Ownership
Before UPDATE or DELETE, always verify the resource belongs to the current user:
```typescript
const post = await prisma.post.findUnique({ where: { id: params.id } });
if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 });
if (post.userId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
```

## Known Pitfalls
- `prisma.model` undefined → dev server not restarted after schema change (ERR-001)
- `_count.select` with new relations → restart first or use `prisma.model.count()` (ERR-002)
- `session.user.id` undefined → cast as `(session.user as { id: string }).id` (ERR-012)
