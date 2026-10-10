---
paths:
  - "src/components/**/*.tsx"
  - "src/app/**/*.tsx"
---

# Component & Page Rules

Design tokens, type, copy and owner rules: CLAUDE.md → Design System. This file is how to build with them.

## Client vs Server
- Hooks or browser APIs → `"use client"` as the very first line (ERR-007); otherwise keep it a Server Component.
- `window` / `localStorage` / `sessionStorage` only inside effects or handlers (ERR-RT-001). "Show once" UI writes its flag when the animation finishes, never at start, and has a fail-safe hide (ERR-UI-003).
- `useScroll({ target: ref })`: attach `ref` in every render branch (ERR-UI-001).

## Styling
- Tailwind classes with theme tokens. `style={{}}` only for runtime values (motion values, computed widths/positions, Satori/OG JSX) — never static styling. No CSS modules; global CSS lives in `src/app/globals.css` + `src/styles/*`.
- Icons: `@phosphor-icons/react`. Never `lucide-react`, never emoji as icons.
- Avoid generic AI looks: no stock purple/blue gradients (gradients only as token-based scrims/fades), no Tailwind gray/white palette (`text-gray-*`, `bg-white`), no icon + title + text three-column feature grid.
- From a reference screenshot take the structure and spacing, never its colours.

## Building UI
- Reuse first: `ui/PageHeader`, `ui/EmptyState`, `ConfirmModal`, then the closest existing page — match its spacing, borders, hover states and text hierarchy.
- New pages/sections start with a `/* LAYOUT: … */` comment describing structure (existing convention).
- Every data view handles loading (skeleton), empty (informative Turkish copy, `EmptyState`) and error.
- Interactive elements: hover + `focus-visible` + disabled states, `transition-colors`, `cursor-pointer`; icon-only buttons get `aria-label`; images get meaningful `alt`.

## Specific Components
- External images: `ResilientImage` (passthrough loader + fallback) or `next/image` with `unoptimized` (ERR-006).
- react-quill: `dynamic(() => import("react-quill"), { ssr: false })` plus `react-quill/dist/quill.snow.css` (ERR-003).
- `MediaSearch` (`onSelect` callback): after a selection set `skipNextSearchRef.current = true` and `setResults([])`, or the dropdown reopens (ERR-004).
