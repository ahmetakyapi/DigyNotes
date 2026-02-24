---
description: Guide through a Prisma schema change safely — push, generate, restart
argument-hint: "[description of schema change]"
---

Guide me through making this schema change safely: $ARGUMENTS

## Step-by-Step Workflow

### 1. Edit the Schema
Read and edit `prisma/schema.prisma` with the required changes.

Rules for schema.prisma in this project:
- Datasource block MUST NOT have a `url` field (it lives in `prisma.config.ts`)
- All new models need `id String @id @default(cuid())`
- Timestamps: `createdAt DateTime @default(now())`, `updatedAt DateTime @updatedAt`
- Nullable optional fields: `fieldName String?`
- Foreign keys: use `@relation(fields: [userId], references: [id])`

### 2. Push the Schema
```bash
npx prisma db push --accept-data-loss
```

### 3. Regenerate the Client
```bash
npx prisma generate
```

### 4. ⚠️ CRITICAL: Restart the Dev Server
**The dev server MUST be restarted.** New models are undefined at runtime until restart.
```
Ctrl+C → npm run dev
```

### 5. Verify
After restart, open Prisma Studio to confirm the change:
```bash
npx prisma studio
```

### 6. Update CLAUDE.md
If new models or relations were added, update:
- Key Files table (if new lib files)
- Architecture Patterns > Database section
- Common Gotchas (if new edge cases discovered)

### 7. Update ERRORS.md
If anything went wrong during this process, document it in ERRORS.md with:
- Symptom, root cause, fix, prevention
