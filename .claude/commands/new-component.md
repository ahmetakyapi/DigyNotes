---
description: Create a new React component for DigyNotes with correct conventions
argument-hint: "[ComponentName] [client|server] e.g. CommentCard client"
---

Create a new React component: $ARGUMENTS

Parse the arguments:
- First arg = ComponentName (PascalCase)
- Second arg = "client" or "server" (default: client if uses hooks/events)

## File Location
`src/components/<ComponentName>.tsx`

## Client Component Template
```typescript
"use client";

import React, { useState } from 'react';

interface <ComponentName>Props {
  // define props here
}

export default function <ComponentName>({ ...props }: <ComponentName>Props) {
  return (
    <div className="...">
      {/* content */}
    </div>
  );
}
```

## Server Component Template (no hooks, no events)
```typescript
import React from 'react';

interface <ComponentName>Props {
  // define props here
}

export default function <ComponentName>({ ...props }: <ComponentName>Props) {
  return (
    <div className="...">
      {/* content */}
    </div>
  );
}
```

## Design System — ALWAYS use these colors
```
Background:  bg-[#161616]           (card)
Border:      border border-[#2a2a2a]
Text:        text-[#f0ede8]         (primary)
             text-[#888888]         (secondary/muted)
Gold accent: text-[#c9a84c] hover:text-[#e0c068]
Danger:      text-[#e53e3e]
Rounded:     rounded-xl
```

## Rules
- `"use client"` must be the FIRST line (before imports) for client components
- Tailwind classes only — no inline styles, no CSS modules
- Turkish UI text (button labels, placeholders, error messages)
- External images: `<Image src={url} unoptimized ... />`
- React-Quill: `const QuillEditor = dynamic(() => import('react-quill'), { ssr: false })`

## After Creating
Add the component to the Component Inventory table in CLAUDE.md.
