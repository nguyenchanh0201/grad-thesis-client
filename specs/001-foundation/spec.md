# specs/001-foundation/spec.md - UI Foundation, shadcn/ui, and Tailwind v4 Base Setup

**Job ID:** 001  
**Status:** ✅ Completed  
**Dependencies:** None  
**Duration:** 1 day | **Priority:** CRITICAL

---

## 1️⃣ FUNCTIONAL GOAL

Establish the entire frontend base layer before any feature work by setting up:

- Tailwind CSS v4 native configuration with `@theme`
- shadcn/ui token mapping and component defaults
- OKLCH color palette for ticketing UX ergonomics
- Font system and variable font loading
- Base border-radius, shadow, spacing, and motion tokens
- A2UI-safe foundation for future agent-readable components

This job is intentionally first because every later feature depends on consistent tokens, component primitives, and typography.

---

## 2️⃣ DATA CONTRACT (Design Token Contract)

### Token Source of Truth

- `DEV.md` design token section
- Tailwind v4 `@theme` block in `app/globals.css`
- shadcn/ui theme variables for background, foreground, border, primary, secondary, muted, accent, and destructive

### Required Token Families

```css
@theme {
  --color-primary: oklch(60% 0.18 45);
  --color-primary-foreground: oklch(98% 0.02 45);
  --color-secondary: oklch(55% 0.03 250);
  --color-background: oklch(98% 0.01 250);
  --color-foreground: oklch(20% 0.02 250);
  --radius-lg: 1rem;
  --radius-md: 0.75rem;
  --radius-sm: 0.5rem;
}
```

### Font Contract

- **Display font:** Geist or Inter variable for headings and UI labels
- **Body font:** Geist or Inter variable for dense ticketing content
- **Mono font:** Geist Mono or IBM Plex Mono for system/debug states
- All fonts must be loaded through `next/font` and exposed as CSS variables

### shadcn/ui Mapping Contract

- Buttons, cards, inputs, dialogs, badges, and toasts must read from the same CSS variables
- Border radii and shadows must be centralized, not per-component ad hoc
- Hover/active states must use subtle transitions rather than heavy motion

---

## 3️⃣ LOGIC FLOW (Foundation Build Sequence)

```
Install / verify shadcn/ui
   ↓
Define Tailwind v4 @theme tokens
   ↓
Map shadcn/ui variables to OKLCH palette
   ↓
Load variable fonts with next/font
   ↓
Set global radius, shadows, and transitions
   ↓
Create base UI primitives / overrides
   ↓
Verify visual consistency across app shell
```

### Build Order

1. Configure `app/globals.css` theme tokens
2. Adjust or generate shadcn/ui theme variables
3. Define typography scale and font variables in `app/layout.tsx`
4. Update core primitives (`Button`, `Card`, `Input`, `Dialog`, `Toast`)
5. Add A2UI observability attributes to primitives
6. Validate responsive and accessibility constraints

---

## 4️⃣ FAILURE MODES & HANDLING

| Failure Mode                       | Impact                              | Handling                                                 |
| ---------------------------------- | ----------------------------------- | -------------------------------------------------------- |
| Tailwind v4 token mismatch         | Components render with wrong colors | Fix `@theme` vars first; avoid per-component color hacks |
| Font loading shift                 | CLS / layout jank                   | Use `next/font` variables and fallback stack             |
| Radius/shadow inconsistency        | Generic / inconsistent UI           | Centralize tokens in globals only                        |
| shadcn/ui default look too generic | Weak brand identity                 | Override base variables and button/card variants         |
| Excessive motion                   | Performance + cognitive load issues | Keep transitions subtle and short                        |

---

## 5️⃣ A2UI CONTRACT (Foundation-Level)

All core primitives must expose stable semantic markers:

```html
<button
  data-agent-type="action"
  data-entity-type="ui-button"
  data-entity-id="primary-action"
>
  Continue
</button>

<div
  data-agent-type="state-display"
  data-entity-type="ui-card"
  data-state-keys="loading,disabled"
>
  ...
</div>
```

This gives future agents a predictable base for manipulation before domain features are introduced.

---

## 6️⃣ IMPLEMENTATION CHECKLIST

- [x] Install / verify shadcn/ui and required base components
- [x] Add Tailwind v4 `@theme` block to `app/globals.css`
- [x] Define OKLCH palette variables for primary, secondary, semantic colors
- [x] Set global border-radius and shadow tokens
- [x] Load fonts with `next/font` and wire CSS variables in `app/layout.tsx`
- [x] Update shadcn/ui defaults to use the new tokens
- [x] Apply A2UI attributes to base interactive primitives
- [x] Verify hover/active/focus micro-interactions
- [x] Run TypeScript and visual sanity checks

---

## 7️⃣ DEFINITION OF DONE

- [x] Tailwind v4 theme tokens are defined centrally
- [x] shadcn/ui uses the project color system instead of generic defaults
- [x] Fonts are loaded via `next/font` and exposed as variables
- [x] Buttons/cards/inputs share consistent radius and shadows
- [x] A2UI attributes exist on foundational primitives
- [x] UI shell looks branded, not generic
- [x] No layout shift from font loading
- [x] Responsive behavior remains intact
- [x] TypeScript passes with zero errors

Verified in `specs/001-foundation/qa-report.md`.

---

## 8️⃣ DELIVERABLES

```
app/
├── globals.css (Tailwind v4 @theme and base styles)
└── layout.tsx (font variables and shell wiring)

components/ui/
├── button.tsx
├── card.tsx
├── input.tsx
├── dialog.tsx
├── badge.tsx
└── sonner.tsx

lib/
└── classnames.ts (if needed for primitive variants)
```

---

**After this job completes, proceed to shared schema/API contract work, then auth.**
