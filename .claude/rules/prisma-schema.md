---
paths:
  - "prisma/schema.prisma"
  - "prisma.config.ts"
  - "src/lib/prisma.ts"
---

# Prisma Schema Rules (auto-loaded for prisma files)

## CRITICAL: Datasource Config
```prisma
// schema.prisma — datasource MUST NOT have url field:
datasource db {
  provider = "postgresql"
  // ← NO url here. URL lives in prisma.config.ts
}
```

```typescript
// prisma.config.ts — this is where the URL goes:
import { defineConfig } from 'prisma/config';
import 'dotenv/config';

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});
```

## PrismaClient Singleton Pattern
```typescript
// src/lib/prisma.ts — the ONLY place PrismaClient is instantiated:
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

## Model Conventions
```prisma
model Example {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Nullable relations (legacy compatibility):
  userId    String?
  user      User?    @relation(fields: [userId], references: [id])

  @@map("examples")   // optional: snake_case table name
}
```

## After Schema Changes — Mandatory Steps
1. `npx prisma db push --accept-data-loss`
2. `npx prisma generate`
3. **Restart dev server** (Ctrl+C → `npm run dev`)
4. Verify in Prisma Studio: `npx prisma studio`

If step 3 is skipped:
- New models → undefined at runtime (ERR-001)
- `_count.select` with new relations → fails (ERR-002)

## DB Connection
- host: localhost, port: 5432
- db: digynotes, user: digynotes, pw: digynotes_secret
- `DATABASE_URL` in `.env` and `.env.local`
- Docker NOT used — Homebrew PostgreSQL only
