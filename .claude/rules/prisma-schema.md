---
paths:
  - "prisma/**"
  - "prisma.config.ts"
  - "src/lib/prisma.ts"
---

# Prisma Rules (v7)

- `schema.prisma`'s datasource has NO `url`; URL, shadow URL and migrations path live in `prisma.config.ts` (ERR-011).
- `src/lib/prisma.ts` is the only place a client is built: `new PrismaClient({ adapter: new PrismaPg({ connectionString }) })`, cached on `globalThis` outside production. A bare `new PrismaClient()` fails (ERR-009).
- Models: `id String @id @default(cuid())` (composite `@@id` for join tables), `createdAt @default(now())`, `updatedAt @updatedAt` where edited, `onDelete` on every relation, `@@map("snake_case_plural")`.
- Check where `DATABASE_URL` points before any DB command — the cloud shell's is production (ERR-ENV-002, see CLAUDE.md).
- Schema change: `npm run db:push` → `npm run db:generate` → restart the dev server (`npm run dev`). Until the restart new models are `undefined` and `_count.select` on new relations fails — or use `prisma.model.count()` (ERR-001/002).
- Production (Neon) needs the same change, or prod queries hit missing columns (ERR-DB-005). The `prisma/migrations` chain lags the schema (last migration 2026-03-11, no `isDraft`); don't `migrate deploy` without reading ERR-DB-004.
