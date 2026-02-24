---
description: Create a new API route for DigyNotes following project conventions
argument-hint: "[route-path] e.g. /api/comments or /api/users/[username]/posts"
---

Create a new Next.js App Router API route for the path: $ARGUMENTS

Follow ALL of these DigyNotes conventions:

## 1. File Location
Place the file at `src/app/api/<route-path>/route.ts`
For dynamic segments use folder brackets: `[id]`, `[username]`

## 2. Required Imports
```typescript
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
```

## 3. Auth Pattern (for protected routes)
```typescript
const session = await getServerSession(authOptions);
if (!session?.user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
const userId = (session.user as { id: string }).id;
```

## 4. Error Response Format
Always return `{ error: string }` — never bare strings or objects:
```typescript
return NextResponse.json({ error: 'Not found' }, { status: 404 });
return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
```

## 5. Wrap in try/catch
```typescript
try {
  // ... logic
} catch (error) {
  console.error('[ROUTE_NAME]', error);
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}
```

## 6. Dynamic Route Params (Next.js 14)
```typescript
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) { ... }
```

## 7. After creating:
- Add the route to the API Routes table in CLAUDE.md
- If it uses a new Prisma model, note it in MEMORY.md
