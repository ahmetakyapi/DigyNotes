---
paths:
  - "src/components/**/*.tsx"
  - "src/app/**/page.tsx"
  - "src/app/**/*Client.tsx"
---

# Component & Page Rules (auto-loaded for .tsx files)

## Client vs Server
- If the component uses hooks (useState, useEffect, useSession, etc.) → MUST have `"use client"` as FIRST line
- If the component uses browser APIs (window, document, localStorage) → MUST have `"use client"`
- If neither → prefer Server Component (omit `"use client"`)
- Forgetting `"use client"` → hydration error (ERR-007)

## File Header Order (client component)
```typescript
"use client";           // ← FIRST, before all imports

import React from 'react';
import { useState } from 'react';
// other imports...
```

## Design System — Required Color Tokens
Do NOT use arbitrary colors outside this palette:
```
Backgrounds:  bg-[#0c0c0c]  bg-[#161616]  bg-[#0c0e16]
Borders:      border-[#2a2a2a]
Text:         text-[#f0ede8]  text-[#888888]  text-[#555555]
Gold:         text-[#c9a84c]  hover:text-[#e0c068]
              bg-[#c9a84c]    hover:bg-[#e0c068]
Danger:       text-[#e53e3e]  bg-[#e53e3e]
```

## External Images
```tsx
import Image from 'next/image';
// Always use unoptimized for external URLs:
<Image src={externalUrl} unoptimized alt="..." width={80} height={80} />
```

## React-Quill (rich text editor)
```typescript
// NEVER import directly — always dynamic:
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
```

## Language
- All UI text in Turkish: button labels, placeholders, error messages, empty states
- Examples: "Kaydet", "İptal", "Yükleniyor...", "Gönderi bulunamadı"

## Tailwind Only
- No `style={{}}` inline styles
- No CSS modules
- No external CSS files
- Use Tailwind utility classes exclusively

## Accessibility
- Interactive elements need `cursor-pointer` class
- Buttons need accessible labels or `aria-label`
- Images need descriptive `alt` text
