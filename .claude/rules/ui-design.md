---
paths:
  - "src/components/**/*.tsx"
  - "src/app/**/page.tsx"
  - "src/app/**/*Client.tsx"
---

# UI Design Rules — DigyNotes Vibe Coding Standards

> These rules exist because AI defaults produce the same generic output every time.
> Follow them to keep DigyNotes looking intentional, premium, and consistent.

---

## RULE 1 — Layout First, Code Second

Before writing any JSX for a new page or section:
1. Write a short layout description in a comment block at the top of the component:
   ```tsx
   /*
     LAYOUT: Two-column on desktop, single on mobile
     LEFT: Fixed sidebar with user avatar + stats (w-64)
     RIGHT: Scrollable feed of PostCards (flex-1)
     SPACING: gap-6 between columns, p-6 container padding
   */
   ```
2. Reference an existing DigyNotes page that has a similar structure
3. Only then write the JSX

Never start with JSX and hope the layout emerges. Structure is decided first.

---

## RULE 2 — Copy Existing DigyNotes Patterns

DigyNotes has established component patterns. When building something new, find the closest existing pattern and follow it:

| If building... | Copy the pattern from... |
|---------------|--------------------------|
| A content card | `src/components/PostsList.tsx` card style |
| A user row/item | `src/components/UserCard.tsx` |
| A modal dialog | `src/components/ConfirmModal.tsx` or `FollowListModal.tsx` |
| A filter/sort bar | `src/components/SortFilterBar.tsx` |
| A stats widget | `src/components/StatsPanel.tsx` |
| A form page | `src/app/profile/settings/page.tsx` |
| A search input | `src/components/SearchBar.tsx` |

Read the referenced file first. Match its spacing, border style, hover states, and text hierarchy exactly.

---

## RULE 3 — The DigyNotes Palette is LAW

**NEVER use Tailwind default color names for UI elements.**
No `blue-500`, `purple-600`, `gray-800`, `green-400`. These are the instant "AI made this" tell.

The only permitted colors:

```
BACKGROUNDS
  Page base:    bg-[#0c0c0c]   or   bg-[#0c0e16]
  Card:         bg-[#161616]   or   bg-[#0d0f1a]
  Elevated:     bg-[#1a1e2e]   (for modals, dropdowns, tooltips)

BORDERS
  Default:      border border-[#2a2a2a]
  Focus/active: border-[#c9a84c]

TEXT
  Primary:      text-[#f0ede8]   (headings, important content)
  Secondary:    text-[#888888]   (labels, meta, timestamps)
  Muted:        text-[#555555]   (disabled, placeholder-like)
  Gold:         text-[#c9a84c]   (links, interactive, accents)
  Gold hover:   hover:text-[#e0c068]
  Danger:       text-[#e53e3e]

INTERACTIVE ELEMENTS (buttons, badges, stars)
  Gold fill:    bg-[#c9a84c]     hover:bg-[#e0c068]
  Danger fill:  bg-[#e53e3e]

WHITE TEXT ON GOLD: text-[#0c0c0c] (dark text on gold backgrounds)
```

---

## RULE 4 — Anti-Patterns — These Are BANNED

### Banned Gradients
```
❌ bg-gradient-to-r from-purple-500 to-blue-600
❌ bg-gradient-to-br from-blue-400 to-indigo-600
❌ from-pink-500 to-purple-500
❌ from-amber-400 to-orange-500
```

DigyNotes uses NO gradients except the gold-to-transparent shimmer on interactive hover:
```
✅ Only allowed gradient: from-[#c9a84c]/10 to-transparent (subtle glow, sparingly)
```

### Banned Generic Patterns
```
❌ rounded-full on non-circular elements (avatars only)
❌ shadow-lg, shadow-xl — DigyNotes uses borders, not shadows
❌ bg-white or bg-gray-* for any element
❌ text-gray-* for text
❌ p-2 on cards (minimum p-4, typically p-6)
❌ text-sm for card titles (use text-base or text-lg)
❌ Emoji as icons (use SVG or a proper icon library)
```

### Banned Structural Patterns
```
❌ Centered hero with huge text + generic gradient button
❌ "Feature cards" with icon + title + description in a 3-column grid (too generic)
❌ Navbar with logo left, links center, button right (without DigyNotes styling)
```

---

## RULE 5 — Typography Scale

DigyNotes uses **Inter** currently. Apply this consistent scale:

```
Page title:        text-2xl font-bold    text-[#f0ede8]
Section heading:   text-xl font-semibold text-[#f0ede8]
Card title:        text-base font-medium text-[#f0ede8]
Body/description:  text-sm              text-[#888888]
Meta/timestamp:    text-xs              text-[#555555]
Badge/label:       text-xs font-medium  (varies by context)
Button text:       text-sm font-medium
```

**Never use font sizes below `text-xs` or above `text-3xl`.**
**Never mix font weights erratically — headings: bold/semibold, body: regular/medium.**

---

## RULE 6 — Spacing & Sizing System

```
Card padding:       p-4   (compact)   p-6   (standard)
Section gap:        gap-4  (tight)    gap-6  (standard)
Page container:     max-w-4xl mx-auto px-4
Input height:       h-10 (standard)  h-12 (prominent)
Button padding:     px-4 py-2  (small)   px-6 py-3  (standard)
Avatar sizes:       w-8 h-8  (mini)   w-10 h-10  (list)   w-16 h-16  (profile)
Border radius:      rounded-lg  (inputs, buttons)   rounded-xl  (cards)
```

---

## RULE 7 — Interactive States — All Elements Need These

Every clickable element must have ALL of:
```tsx
// Buttons
className="... transition-colors duration-200 cursor-pointer"
// + hover state: hover:bg-[...] or hover:text-[...]
// + active state: active:scale-95
// + disabled state: disabled:opacity-50 disabled:cursor-not-allowed

// Cards/list items
className="... transition-colors duration-200 hover:bg-[#1a1e2e] cursor-pointer"

// Links/text actions
className="... text-[#c9a84c] hover:text-[#e0c068] transition-colors duration-200"
```

**No element should transition to its hover state abruptly. Always `transition-colors duration-200`.**

---

## RULE 8 — Icons

DigyNotes currently has no icon library. When icons are needed:

**DO NOT use:**
- Lucide React (the default "AI made this" tell — `import { X } from 'lucide-react'`)
- Emoji characters as UI icons

**USE instead:**
```bash
# Phosphor Icons — more unique, same bundle size as Lucide
npm install @phosphor-icons/react
```

```tsx
import { House, BookOpen, Star, User, X } from '@phosphor-icons/react';

// Standard sizes:
<Star size={16} />    // inline/badge
<House size={20} />   // nav items
<User size={24} />    // prominent actions
```

If Phosphor isn't installed yet, use simple inline SVGs for 1-2 icons rather than installing Lucide.

---

## RULE 9 — Empty States & Loading States

Every list or data section must have BOTH states handled:

```tsx
// Loading state — use a skeleton pattern, not a spinner
{isLoading && (
  <div className="space-y-3">
    {[1,2,3].map(i => (
      <div key={i} className="h-20 bg-[#161616] rounded-xl animate-pulse border border-[#2a2a2a]" />
    ))}
  </div>
)}

// Empty state — must be informative, not just "No data"
{!isLoading && items.length === 0 && (
  <div className="text-center py-16 text-[#555555]">
    <p className="text-base mb-1">Henüz içerik yok</p>
    <p className="text-sm">Bir şeyler ekleyerek başla</p>
  </div>
)}
```

**Never show a blank white/dark space. Always handle empty and loading.**

---

## RULE 10 — Visual Hierarchy Checklist

Before finishing any UI component, verify:
- [ ] One clearly dominant element per card (title or image, not both equally sized)
- [ ] Secondary info is visually smaller OR lighter colored — not both same weight
- [ ] Interactive elements are visually distinct from static ones
- [ ] There is consistent left-alignment (or center for hero sections)
- [ ] No wall of same-size text — vary size or color to create rhythm
- [ ] Whitespace is generous — never cramped (minimum p-4 on cards)

---

## RULE 11 — When User Provides a Reference Image

If the user pastes a screenshot or references a UI from Dribbble/Mobbin:
1. Read the **structure** — how many columns? what's the hierarchy?
2. Read the **spacing** — generous or compact? what's the approximate padding?
3. Read the **typography rhythm** — one dominant text + supporting smaller text?
4. **Translate to DigyNotes palette** — keep the structure, replace all colors with DigyNotes tokens
5. Do NOT copy generic colors from the reference. The structure is the reference, the palette is always DigyNotes.

---

## Font Upgrade Note

The current font (`Inter`) is the most common "AI generated" tell.
When appropriate, consider upgrading to one of these (same Google Fonts, easy swap):

```typescript
// More premium alternatives in layout.tsx:
import { DM_Sans } from "next/font/google";           // Clean, editorial
import { Plus_Jakarta_Sans } from "next/font/google"; // Modern, slightly quirky
import { Sora } from "next/font/google";              // Techy, distinctive
```

Only change after user approves — it's a global change affecting all text.
